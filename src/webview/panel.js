const vscode = acquireVsCodeApi();

const state = {
  sets: [],
  sourcePath: '',
  pages: [{ set: '', checkedFiles: [], instructionFiles: [] }],
  currentPage: 0,
};

function restoreState(saved) {
  if (!saved) return;
  if (Array.isArray(saved.pages) && saved.pages.length) {
    state.pages = saved.pages.map((p) => ({
      set: p.set || '',
      checkedFiles: Array.isArray(p.checkedFiles) ? [...p.checkedFiles] : [],
      instructionFiles: Array.isArray(p.instructionFiles) ? [...p.instructionFiles] : [],
    }));
  }
  const idx = typeof saved.currentPage === 'number' ? saved.currentPage : 0;
  state.currentPage = Math.max(0, Math.min(idx, state.pages.length - 1));
}

function persistState() {
  vscode.postMessage({
    command: 'saveCheckedState',
    state: {
      pages: state.pages.map((p) => ({
        set: p.set,
        checkedFiles: p.checkedFiles,
        instructionFiles: p.instructionFiles,
      })),
      currentPage: state.currentPage,
    },
  });
}

function setDropdownChanged(e) {
  const value = e.target.value;
  const page = state.pages[state.currentPage];
  page.set = value;
  page.checkedFiles = [];
  updateInjectEnabled();
  persistState();
  if (page.set) {
    vscode.postMessage({ command: 'getInstructionFiles', setName: page.set });
  } else {
    renderInstructionFiles([], []);
  }
}

function injectClicked() {
  const selections = state.pages
    .filter((p) => p.set && p.checkedFiles.length)
    .map((p) => ({ setName: p.set, files: p.checkedFiles }));
  if (!selections.length) return;
  vscode.postMessage({ command: 'injectSets', selections });
}

function prevPage() {
  if (state.currentPage === 0) return;
  state.currentPage--;
  renderPage();
  persistState();
}

function nextPage() {
  if (state.currentPage >= state.pages.length - 1) return;
  state.currentPage++;
  renderPage();
  persistState();
}

function addSet() {
  const first = state.sets[0] || '';
  state.pages.push({ set: first, checkedFiles: [], instructionFiles: [] });
  state.currentPage = state.pages.length - 1;
  renderPage();
  persistState();
  if (first) vscode.postMessage({ command: 'getInstructionFiles', setName: first });
}

function removeSet() {
  if (state.pages.length <= 1) return;
  state.pages.splice(state.currentPage, 1);
  if (state.currentPage > 0) state.currentPage--;
  renderPage();
  persistState();
}

function browseSource() {
  vscode.postMessage({ command: 'browseSourceFolder' });
}

function createSample() {
  vscode.postMessage({ command: 'createSampleSource' });
}

function applyInstructionFiles(files) {
  const page = state.pages[state.currentPage];
  const all = files || [];
  page.instructionFiles = all;
  if (!page.checkedFiles.length) {
    page.checkedFiles = [...all];
  } else {
    page.checkedFiles = page.checkedFiles.filter((f) => all.includes(f));
  }
  renderInstructionFiles(page.instructionFiles, page.checkedFiles);
  persistState();
}

function updateLastInjected(text) {
  document.getElementById('lastInjectedSet').textContent = text || 'None';
}

function renderInstructionFiles(files, checked) {
  const container = document.getElementById('instructionFileList');
  container.innerHTML = '';
  if (!files.length) {
    container.textContent = 'No instruction files found in this set.';
    return;
  }
  files.forEach((f) => {
    const row = document.createElement('div');
    row.className = 'file-item';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';

    const name = document.createElement('span');
    name.textContent = f;
    name.style.cursor = 'pointer';
    name.style.flex = '1 1 auto';
    name.onclick = () => vscode.postMessage({ command: 'openInstructionFile', setName: state.pages[state.currentPage].set, fileName: f });

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = checked.includes(f);
    box.style.marginLeft = '12px';
    box.onchange = () => {
      const page = state.pages[state.currentPage];
      if (box.checked) {
        if (!page.checkedFiles.includes(f)) page.checkedFiles.push(f);
      } else {
        page.checkedFiles = page.checkedFiles.filter((x) => x !== f);
      }
      persistState();
    };

    row.appendChild(name);
    row.appendChild(box);
    container.appendChild(row);
  });
}

function updateInjectEnabled() {
  const hasFolder = !!state.sourcePath && state.sourcePath.trim() !== '' && state.sourcePath !== 'Not set';
  const page = state.pages[state.currentPage];
  document.getElementById('injectBtn').disabled = !hasFolder || !page.set;
}

function renderPage() {
  const dropdown = document.getElementById('setDropdown');
  dropdown.innerHTML = '';
  state.sets.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    dropdown.appendChild(opt);
  });
  const page = state.pages[state.currentPage];
  if (!page.set && state.sets.length) page.set = state.sets[0];
  dropdown.value = page.set || '';
  const hasFolder = !!state.sourcePath && state.sourcePath.trim() !== '' && state.sourcePath !== 'Not set';
  dropdown.disabled = !hasFolder;
  updateInjectEnabled();
  document.getElementById('removeSetBtn').disabled = state.pages.length <= 1;
  document.getElementById('prevPageBtn').disabled = state.currentPage === 0;
  document.getElementById('nextPageBtn').disabled = state.currentPage === state.pages.length - 1;
  document.getElementById('pageIndicator').textContent = `Page ${state.currentPage + 1} of ${state.pages.length}`;
  const sourceFolderElement = document.getElementById('sourceFolder');
  if (hasFolder) {
    sourceFolderElement.textContent = state.sourcePath;
    sourceFolderElement.style.display = 'block';
  } else {
    sourceFolderElement.style.display = 'none';
  }
  if (page.set) {
    vscode.postMessage({ command: 'getInstructionFiles', setName: page.set });
  } else {
    renderInstructionFiles([], []);
  }
}

function openSourceFolderClick(e) {
  if (e.type === 'click' && e.button === 0 && state.sourcePath) {
    vscode.postMessage({ command: 'openSourceFolder', folderPath: state.sourcePath });
  }
}

function init() {
  document.getElementById('browseBtn').onclick = browseSource;
  document.getElementById('createSampleBtn').onclick = createSample;
  document.getElementById('setDropdown').onchange = setDropdownChanged;
  document.getElementById('injectBtn').onclick = injectClicked;
  document.getElementById('prevPageBtn').onclick = prevPage;
  document.getElementById('nextPageBtn').onclick = nextPage;
  document.getElementById('addSetBtn').onclick = addSet;
  document.getElementById('removeSetBtn').onclick = removeSet;
  document.getElementById('sourceFolder').onclick = openSourceFolderClick;
  vscode.postMessage({ command: 'getSets' });
}

window.onload = init;

window.addEventListener('message', (event) => {
  const { command, sets, setsPath, lastInjectedSet, instructionFiles, savedCheckedState } = event.data || {};
  if (command === 'sets') {
    state.sets = sets || [];
    state.sourcePath = setsPath || '';
    if (savedCheckedState) {
      restoreState(savedCheckedState);
    } else {
      state.pages = [{ set: state.sets[0] || '', checkedFiles: [], instructionFiles: [] }];
      state.currentPage = 0;
    }
    renderPage();
    const isNotSet = !state.sourcePath || state.sourcePath.trim() === '' || state.sets.length === 0;
    document.getElementById('sourceFolder').textContent = isNotSet ? 'Not set' : state.sourcePath;
    updateLastInjected(lastInjectedSet);
    const createBtn = document.getElementById('createSampleBtn');
    createBtn.style.display = isNotSet ? 'block' : 'none';
    if (isNotSet) {
      vscode.postMessage({ command: 'showNotification', message: 'No valid Sets found in this Source location.' });
    }
  }
  if (command === 'instructionFiles') applyInstructionFiles(instructionFiles);
  if (command === 'lastInjectedSetUpdate') updateLastInjected(lastInjectedSet);
});
