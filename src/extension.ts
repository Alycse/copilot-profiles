import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let sourcePath: string | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'copilot-profiles-view',
      new CopilotProfilesProvider(context)
    )
  );
}

class CopilotProfilesProvider implements vscode.WebviewViewProvider {
  private _context: vscode.ExtensionContext;
  private _view?: vscode.WebviewView;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  resolveWebviewView(view: vscode.WebviewView) {
    this._view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, 'src', 'webview')]
    };
    this.setWebviewHtml(view);
    view.webview.onDidReceiveMessage(async message => {
      this.handleMessage(message);
    });
  }

  private setWebviewHtml(view: vscode.WebviewView) {
    const htmlPath = path.join(this._context.extensionUri.fsPath, 'src', 'webview', 'panel.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    const scriptUri = view.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'src', 'webview', 'panel.js'));
    const cssUri = view.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'src', 'webview', 'panel.css'));
    html = html.replace('href="panel.css"', `href="${cssUri.toString()}"`);
    html = html.replace('{{SCRIPT_URI}}', scriptUri.toString());
    view.webview.html = html;
  }

  private async handleMessage(message: any) {
    switch (message.command) {
      case 'browseSourceFolder':
        await this.browseSourceFolder();
        break;
      case 'createSampleSource':
        await this.createSampleSource();
        break;
      case 'getSets':
        this.sendSets();
        break;
      case 'injectSets':
        this.injectSets(message.selections);
        break;
      case 'getInstructionFiles':
        this.sendInstructionFiles(message.setName);
        break;
      case 'openInstructionFile':
        this.openInstructionFile(message.setName, message.fileName);
        break;
      case 'saveCheckedState':
        this.saveCheckedState(message.state);
        break;
      case 'openSourceFolder':
        this.openSourceFolder(message.folderPath);
        break;
    }
  }

  private getWorkspaceRoot(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  private getGithubDir(): string | undefined {
    const root = this.getWorkspaceRoot();
    if (!root) return undefined;
    const githubDir = path.join(root, '.github');
    if (!fs.existsSync(githubDir)) fs.mkdirSync(githubDir, { recursive: true });
    return githubDir;
  }

  private getCheckedStatePath(): string | undefined {
    const githubDir = this.getGithubDir();
    if (!githubDir) return undefined;
    return path.join(githubDir, 'copilot-profiles-checked-state.json');
  }

  private saveCheckedState(state: any) {
    const filePath = this.getCheckedStatePath();
    if (!filePath) return;
    try {
      fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
    } catch {}
  }

  private loadCheckedState(): any {
    const filePath = this.getCheckedStatePath();
    if (!filePath) return undefined;
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch {}
    return undefined;
  }

  private injectSets(selections: { setName: string, files: string[] }[]) {
    if (!sourcePath) {
      vscode.window.showErrorMessage('No source folder selected.');
      return;
    }
    const githubDir = this.getGithubDir();
    if (!githubDir) {
      vscode.window.showErrorMessage('No workspace open.');
      return;
    }
    let combined = '';
    let injectedSets: string[] = [];
    for (const sel of selections) {
      const setPath = path.join(sourcePath, sel.setName);
      if (!fs.existsSync(setPath)) continue;
      let mdFiles = fs.readdirSync(setPath).filter(f => f.endsWith('.md')).sort();
      if (Array.isArray(sel.files) && sel.files.length > 0) {
        mdFiles = mdFiles.filter(f => sel.files.includes(f));
      }
      if (!mdFiles.length) continue;
      injectedSets.push(sel.setName);
      for (const file of mdFiles) {
        const content = fs.readFileSync(path.join(setPath, file), 'utf8');
        combined += `\n-----\n# ${file.replace('.md', '').replace(/[-_]/g, ' ')}\n\n${content}\n`;
      }
    }
    if (!combined) {
      vscode.window.showErrorMessage('No instruction files selected for injection.');
      return;
    }
    const outFile = path.join(githubDir, 'copilot-instructions.md');
    fs.writeFileSync(outFile, combined, 'utf8');
    const timestamp = new Date().toLocaleString();
    const lastInjectedInfo = `${injectedSets.join(', ')} (${timestamp})`;
    this.saveLastInjectedSet(injectedSets.join(', '), timestamp);
    if (this._view) {
      this._view.webview.postMessage({ command: 'lastInjectedSetUpdate', lastInjectedSet: lastInjectedInfo });
    }
    vscode.workspace.openTextDocument(outFile).then(doc => {
      vscode.window.showTextDocument(doc, { preview: false });
    });
    vscode.window.showInformationMessage(`copilot-instructions.md updated with selected instructions from: ${injectedSets.join(', ')}`);
  }

  private sendInstructionFiles(setName: string) {
    if (!this._view) return;
    if (!sourcePath || !setName) {
      this._view.webview.postMessage({ command: 'instructionFiles', instructionFiles: [] });
      return;
    }
    const setPath = path.join(sourcePath, setName);
    if (!fs.existsSync(setPath) || !fs.statSync(setPath).isDirectory()) {
      this._view.webview.postMessage({ command: 'instructionFiles', instructionFiles: [] });
      return;
    }
    const files = fs.readdirSync(setPath).filter(f => f.endsWith('.md')).sort();
    this._view.webview.postMessage({ command: 'instructionFiles', instructionFiles: files });
  }

  private async browseSourceFolder() {
    const folders = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      openLabel: 'Select Source Folder'
    });
    if (folders && folders.length) {
      sourcePath = folders[0].fsPath;
      this.saveSourceFolder(sourcePath);
      const githubDir = this.getGithubDir();
      if (githubDir) {
        const checkedStatePath = path.join(githubDir, 'copilot-profiles-checked-state.json');
        try {
          if (fs.existsSync(checkedStatePath)) {
            fs.unlinkSync(checkedStatePath);
          }
        } catch {}
      }
      this.sendSets();
    }
  }

  private async createSampleSource() {
    const folders = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      openLabel: 'Select Location to Create Sample Source'
    });
    if (folders && folders.length) {
      const selectedLocation = folders[0].fsPath;
      const sampleSourcePath = path.join(selectedLocation, 'Sample Source');
      
      try {
        // Create the main Sample Source folder
        if (!fs.existsSync(sampleSourcePath)) {
          fs.mkdirSync(sampleSourcePath, { recursive: true });
        }
        
        // Create Development folder and files
        const developmentPath = path.join(sampleSourcePath, 'Development');
        fs.mkdirSync(developmentPath, { recursive: true });
        
        const globalStandardsDevContent = 'This file contains global standards that apply to all development work.';
        const developmentInstructionsContent = 'This file contains specific instructions for development tasks.';
        
        fs.writeFileSync(path.join(developmentPath, 'global-standards.md'), globalStandardsDevContent, 'utf8');
        fs.writeFileSync(path.join(developmentPath, 'development-instructions.md'), developmentInstructionsContent, 'utf8');
        
        // Create Tester folder and files
        const testerPath = path.join(sampleSourcePath, 'Tester');
        fs.mkdirSync(testerPath, { recursive: true });
        
        const globalStandardsTesterContent = 'This file contains global standards that apply to all testing work.';
        const testerInstructionsContent = 'This file contains specific instructions for testing tasks.';
        
        fs.writeFileSync(path.join(testerPath, 'global-standards.md'), globalStandardsTesterContent, 'utf8');
        fs.writeFileSync(path.join(testerPath, 'tester-instructions.md'), testerInstructionsContent, 'utf8');
        
        // Set the created folder as the source path
        sourcePath = sampleSourcePath;
        this.saveSourceFolder(sourcePath);
        
        // Clear any existing checked state
        const githubDir = this.getGithubDir();
        if (githubDir) {
          const checkedStatePath = path.join(githubDir, 'copilot-profiles-checked-state.json');
          try {
            if (fs.existsSync(checkedStatePath)) {
              fs.unlinkSync(checkedStatePath);
            }
          } catch {}
        }
        
        this.sendSets();
        vscode.window.showInformationMessage(`Sample source folder created at: ${sampleSourcePath}`);
        
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to create sample source folder: ${error}`);
      }
    }
  }

  private sendSets() {
    if (!this._view) return;
    const lastInjectedSet = this.getLastInjectedSet();
    const lastInjectedSetName = this.getLastInjectedSetName();
    const savedCheckedState = this.loadCheckedState();
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      this._view.webview.postMessage({ command: 'sets', sets: [], lastInjectedSet, lastInjectedSetName, savedCheckedState });
      return;
    }
    const sets = fs.readdirSync(sourcePath).filter(f => fs.statSync(path.join(sourcePath!, f)).isDirectory());
    this._view.webview.postMessage({ command: 'sets', sets, setsPath: sourcePath, lastInjectedSet, lastInjectedSetName, savedCheckedState });
  }

  private getLastInjectedSet(): string {
    const root = this.getWorkspaceRoot();
    if (!root) return 'None';
    const saveFilePath = path.join(root, '.github', 'copilot-profiles-general-state.json');
    try {
      if (fs.existsSync(saveFilePath)) {
        const saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
        if (saveData.lastSourceFolder && fs.existsSync(saveData.lastSourceFolder)) {
          sourcePath = saveData.lastSourceFolder;
        }
        return saveData.lastInjectedSet || 'None';
      }
    } catch {}
    return 'None';
  }

  private getLastInjectedSetName(): string {
    const root = this.getWorkspaceRoot();
    if (!root) return '';
    const saveFilePath = path.join(root, '.github', 'copilot-profiles-general-state.json');
    try {
      if (fs.existsSync(saveFilePath)) {
        const saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
        return saveData.lastInjectedSetName || '';
      }
    } catch {}
    return '';
  }

  private saveSourceFolder(sourcePath: string) {
    const githubDir = this.getGithubDir();
    if (!githubDir) return;
    const saveFilePath = path.join(githubDir, 'copilot-profiles-general-state.json');
    let saveData: any = {
      lastInjectedSet: 'None',
      lastInjectedSetName: '',
      lastInjectedTimestamp: '',
      lastSourceFolder: '',
      lastUpdated: new Date().toISOString()
    };
    try {
      if (fs.existsSync(saveFilePath)) {
        saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
      }
      saveData.lastSourceFolder = sourcePath;
      saveData.lastUpdated = new Date().toISOString();
      fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2), 'utf8');
      this.addToGitignore('.github/copilot-profiles-general-state.json');
    } catch {}
  }

  private saveLastInjectedSet(setName: string, timestamp: string) {
    const githubDir = this.getGithubDir();
    if (!githubDir) return;
    const saveFilePath = path.join(githubDir, 'copilot-profiles-general-state.json');
    const saveData = {
      lastInjectedSet: `${setName} (${timestamp})`,
      lastInjectedSetName: setName,
      lastInjectedTimestamp: timestamp,
      lastSourceFolder: sourcePath || '',
      lastUpdated: new Date().toISOString()
    };
    try {
      fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2), 'utf8');
      this.addToGitignore('.github/copilot-profiles-general-state.json');
    } catch {}
  }

  private addToGitignore(entry: string) {
    const root = this.getWorkspaceRoot();
    if (!root) return;
    const gitignorePath = path.join(root, '.gitignore');
    try {
      let gitignoreContent = '';
      if (fs.existsSync(gitignorePath)) {
        gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        if (gitignoreContent.includes(entry)) return;
      }
      const newEntry = `\n# Copilot Profiles extension state file\n${entry}\n`;
      fs.writeFileSync(gitignorePath, gitignoreContent + newEntry, 'utf8');
    } catch {}
  }

  private async openInstructionFile(setName: string, fileName: string) {
    if (!sourcePath) return;
    const setPath = path.join(sourcePath, setName);
    const filePath = path.join(setPath, fileName);
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
