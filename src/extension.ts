import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const GENERAL_STATE_FILE = 'copilot-profiles-general-state.json';
const CHECKED_STATE_FILE = 'copilot-profiles-checked-state.json';
const OUTPUT_FILE = 'copilot-instructions.md';

type WebviewCommand =
  | { command: 'browseSourceFolder' }
  | { command: 'createSampleSource' }
  | { command: 'getProfiles' }
  | { command: 'injectProfiles'; selections: { profileName: string; files: string[] }[] }
  | { command: 'getInstructionFiles'; profileName: string }
  | { command: 'openInstructionFile'; profileName: string; fileName: string }
  | { command: 'saveCheckedState'; state: any }
  | { command: 'openSourceFolder'; folderPath: string };

type GeneralState = {
  lastInjectedProfile: string;
  lastInjectedProfileName: string;
  lastInjectedTimestamp: string;
  lastSourceFolder: string;
  lastUpdated: string;
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('copilot-profiles-view', new CopilotProfilesProvider(context))
  );
}

class CopilotProfilesProvider implements vscode.WebviewViewProvider {
  private ctx: vscode.ExtensionContext;
  private view?: vscode.WebviewView;
  private sourcePath?: string;

  constructor(context: vscode.ExtensionContext) {
    this.ctx = context;
  }

  resolveWebviewView(view: vscode.WebviewView) {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.ctx.extensionUri, 'src', 'webview')],
    };
    this.setWebviewHtml(view);
    this.loadSourcePathFromState();
    view.webview.onDidReceiveMessage((m: WebviewCommand) => this.routeMessage(m));
  }

  private showNotification(message: string) {
    vscode.window.showInformationMessage(message);
  }

  private routeMessage(message: WebviewCommand) {
    const map: Record<string, (m: any) => void | Promise<void>> = {
      browseSourceFolder: () => this.pickSourceFolder(),
      createSampleSource: () => this.createSampleSource(),
      getProfiles: () => this.postProfiles(),
      injectProfiles: (m) => this.injectSelections(m.selections),
      getInstructionFiles: (m) => this.postInstructionFiles(m.profileName),
      openInstructionFile: (m) => this.openInstructionFile(m.profileName, m.fileName),
      saveCheckedState: (m) => this.saveCheckedState(m.state),
      openSourceFolder: (m) => this.openSourceFolder(m.folderPath),
      showNotification: (m) => this.showNotification(m.message),
    };
    const handler = map[message.command];
    if (handler) handler(message);
  }

  private setWebviewHtml(view: vscode.WebviewView) {
    const htmlPath = path.join(this.ctx.extensionUri.fsPath, 'src', 'webview', 'panel.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const scriptUri = view.webview.asWebviewUri(
      vscode.Uri.joinPath(this.ctx.extensionUri, 'src', 'webview', 'panel.js')
    );
    const cssUri = view.webview.asWebviewUri(
      vscode.Uri.joinPath(this.ctx.extensionUri, 'src', 'webview', 'panel.css')
    );
    const content = html.replace('href="panel.css"', `href="${cssUri.toString()}"`).replace('{{SCRIPT_URI}}', scriptUri.toString());
    view.webview.html = content;
  }

  private workspaceRoot(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  private ensureGithubDir(): string | undefined {
    const root = this.workspaceRoot();
    if (!root) return;
    const dir = path.join(root, '.github');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  private generalStatePath(): string | undefined {
    const dir = this.ensureGithubDir();
    if (!dir) return;
    return path.join(dir, GENERAL_STATE_FILE);
  }

  private checkedStatePath(): string | undefined {
    const dir = this.ensureGithubDir();
    if (!dir) return;
    return path.join(dir, CHECKED_STATE_FILE);
  }

  private outputFilePath(): string | undefined {
    const dir = this.ensureGithubDir();
    if (!dir) return;
    return path.join(dir, OUTPUT_FILE);
  }

  private readJson<T>(file: string): T | undefined {
    try {
      if (!fs.existsSync(file)) return;
      return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
    } catch {
      return;
    }
  }

  private writeJson(file: string, data: unknown) {
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    } catch {
      vscode.window.showErrorMessage('Failed to write state file.');
    }
  }

  private addToGitignore(entry: string) {
    const root = this.workspaceRoot();
    if (!root) return;
    const gi = path.join(root, '.gitignore');
    try {
      const existing = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8') : '';
      if (existing.includes(entry)) return;
      const updated = `${existing}\n${entry}\n`;
      fs.writeFileSync(gi, updated, 'utf8');
    } catch {}
  }

  private saveCheckedState(state: any) {
    const p = this.checkedStatePath();
    if (!p) return;
    this.writeJson(p, state);
  }

  private loadCheckedState(): any {
    const p = this.checkedStatePath();
    if (!p) return;
    return this.readJson<any>(p);
  }

  private clearCheckedState() {
    const p = this.checkedStatePath();
    try {
      if (p && fs.existsSync(p)) fs.unlinkSync(p);
    } catch {}
  }

  private loadSourcePathFromState() {
    const p = this.generalStatePath();
    if (!p) return;
    const s = this.readJson<GeneralState>(p);
    if (s?.lastSourceFolder && fs.existsSync(s.lastSourceFolder)) this.sourcePath = s.lastSourceFolder;
  }

  private persistSourceFolder(dir: string) {
    const p = this.generalStatePath();
    if (!p) return;
    const now = new Date().toISOString();
    const current: GeneralState =
      this.readJson<GeneralState>(p) ?? {
        lastInjectedProfile: 'None',
        lastInjectedProfileName: '',
        lastInjectedTimestamp: '',
        lastSourceFolder: '',
        lastUpdated: now,
      };
    current.lastSourceFolder = dir;
    current.lastUpdated = now;
    this.writeJson(p, current);
    this.addToGitignore(`.github/${GENERAL_STATE_FILE}`);
  }

  private recordInjection(profileName: string) {
    const p = this.generalStatePath();
    if (!p) return;
    const now = new Date().toLocaleString();
    const data: GeneralState = {
      lastInjectedProfile: `${profileName} (${now})`,
      lastInjectedProfileName: profileName,
      lastInjectedTimestamp: now,
      lastSourceFolder: this.sourcePath || '',
      lastUpdated: new Date().toISOString(),
    };
    this.writeJson(p, data);
    this.addToGitignore(`.github/${GENERAL_STATE_FILE}`);
  }

  private listProfiles(): string[] {
    if (!this.sourcePath || !fs.existsSync(this.sourcePath)) return [];
    return fs
      .readdirSync(this.sourcePath)
      .filter((f) => {
        const full = path.join(this.sourcePath!, f);
        if (!fs.statSync(full).isDirectory()) return false;
        const hasMd = fs.readdirSync(full).some((x) => x.endsWith('.md'));
        return hasMd;
      })
      .sort();
  }

  private mdFilesInProfile(profileName: string): string[] {
    if (!this.sourcePath) return [];
    const profileDir = path.join(this.sourcePath, profileName);
    if (!fs.existsSync(profileDir) || !fs.statSync(profileDir).isDirectory()) return [];
    return fs
      .readdirSync(profileDir)
      .filter((f) => f.endsWith('.md'))
      .sort();
  }

  private buildCombinedInstructions(selections: { profileName: string; files: string[] }[]): { content: string; injectedProfiles: string[] } {
    let content = '';
    const injectedProfiles: string[] = [];
    if (!this.sourcePath) return { content, injectedProfiles };
    for (const sel of selections) {
      const profileDir = path.join(this.sourcePath, sel.profileName);
      if (!fs.existsSync(profileDir)) continue;
      let files = this.mdFilesInProfile(sel.profileName);
      if (Array.isArray(sel.files) && sel.files.length) files = files.filter((f) => sel.files.includes(f));
      if (!files.length) continue;
      injectedProfiles.push(sel.profileName);
      for (const f of files) {
        const text = fs.readFileSync(path.join(profileDir, f), 'utf8');
        const title = f.replace('.md', '').replace(/[-_]/g, ' ');
        content += `\n-----\n# ${title}\n\n${text}\n`;
      }
    }
    return { content, injectedProfiles };
  }

  private async injectSelections(selections: { profileName: string; files: string[] }[]) {
    if (!this.sourcePath) {
      this.showNotification('No source folder selected.');
      return;
    }
    const out = this.outputFilePath();
    if (!out) {
      this.showNotification('No workspace open.');
      return;
    }
    const { content, injectedProfiles } = this.buildCombinedInstructions(selections);
    if (!content) {
      this.showNotification('No instruction files selected for injection.');
      return;
    }
    fs.writeFileSync(out, content, 'utf8');
    this.recordInjection(injectedProfiles.join(', '));
    if (this.view) {
      const p = this.readJson<GeneralState>(this.generalStatePath()!);
      this.view.webview.postMessage({
        command: 'lastInjectedProfileUpdate',
        lastInjectedProfile: p?.lastInjectedProfile ?? 'None',
      });
    }
    const doc = await vscode.workspace.openTextDocument(out);
    await vscode.window.showTextDocument(doc, { preview: false });
    this.showNotification(`copilot-instructions.md updated from: ${injectedProfiles.join(', ')}`);
  }

  private postInstructionFiles(profileName: string) {
    if (!this.view) return;
    const files = this.mdFilesInProfile(profileName);
    this.view.webview.postMessage({ command: 'instructionFiles', instructionFiles: files });
  }

  private async pickSourceFolder() {
    const folders = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, openLabel: 'Select Source Folder' });
    if (!folders || !folders.length) return;
    this.sourcePath = folders[0].fsPath;
    this.persistSourceFolder(this.sourcePath);
    this.clearCheckedState();
    this.postProfiles();
  }

  private async createSampleSource() {
    const pick = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      openLabel: 'Select Location to Create Sample Source',
    });
    if (!pick || !pick.length) return;
    const base = pick[0].fsPath;
    const sample = path.join(base, 'Sample Source');
    try {
      if (!fs.existsSync(sample)) fs.mkdirSync(sample, { recursive: true });
      const dev = path.join(sample, 'Development');
      const test = path.join(sample, 'Tester');
      fs.mkdirSync(dev, { recursive: true });
      fs.mkdirSync(test, { recursive: true });
      fs.writeFileSync(path.join(dev, '_global-standards.md'), 'This file contains global standards that apply to all development work.', 'utf8');
      fs.writeFileSync(path.join(dev, 'development-instructions.md'), 'This file contains specific instructions for development tasks.', 'utf8');
      fs.writeFileSync(path.join(test, '_global-standards.md'), 'This file contains global standards that apply to all testing work.', 'utf8');
      fs.writeFileSync(path.join(test, 'tester-instructions.md'), 'This file contains specific instructions for testing tasks.', 'utf8');
      this.sourcePath = sample;
      this.persistSourceFolder(sample);
      this.clearCheckedState();
      this.postProfiles();
      this.showNotification(`Sample source folder created at: ${sample}`);
      vscode.env.openExternal(vscode.Uri.file(sample));
    } catch {
      this.showNotification('Failed to create sample source folder.');
    }
  }

  private postProfiles() {
    if (!this.view) return;
    const profiles = this.listProfiles();
    const profilesPath = this.sourcePath && fs.existsSync(this.sourcePath) && profiles.length ? this.sourcePath : '';
    const gen = this.readJson<GeneralState>(this.generalStatePath() || '') ?? undefined;
    const lastInjectedProfile = gen?.lastInjectedProfile ?? 'None';
    const lastInjectedProfileName = gen?.lastInjectedProfileName ?? '';
    const savedCheckedState = this.loadCheckedState();
    this.view.webview.postMessage({
      command: 'profiles',
      profiles,
      profilesPath,
      lastInjectedProfile,
      lastInjectedProfileName,
      savedCheckedState,
    });
  }

  private async openInstructionFile(profileName: string, fileName: string) {
    if (!this.sourcePath) return;
    const filePath = path.join(this.sourcePath, profileName, fileName);
    if (!fs.existsSync(filePath)) {
      vscode.window.showErrorMessage(`File not found: ${filePath}`);
      return;
    }
    const doc = await vscode.workspace.openTextDocument(filePath);
    vscode.window.showTextDocument(doc, { preview: true });
  }

  private openSourceFolder(folderPath: string) {
    if (!folderPath || !fs.existsSync(folderPath)) {
      vscode.window.showErrorMessage('Folder does not exist: ' + folderPath);
      return;
    }
    if (fs.statSync(folderPath).isDirectory()) {
      vscode.env.openExternal(vscode.Uri.file(folderPath));
      return;
    }
    vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(folderPath));
  }
}

export function deactivate() {}
