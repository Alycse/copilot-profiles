
const vscode = acquireVsCodeApi();
let setsList = [];
let sourceFolderPath = '';
let pages = [{ set: '', checkedFiles: [], instructionFiles: [] }];
let currentPage = 0;

function restoreFullState(savedState) {
  if (!savedState) return;
  if (Array.isArray(savedState.pages) && savedState.pages.length > 0) {
    pages = savedState.pages.map(p => ({
      set: p.set || '',
      checkedFiles: Array.isArray(p.checkedFiles) ? [...p.checkedFiles] : [],
      instructionFiles: Array.isArray(p.instructionFiles) ? [...p.instructionFiles] : []
    }));
  }
  currentPage = typeof savedState.currentPage === 'number' && savedState.currentPage >= 0 && savedState.currentPage < pages.length ? savedState.currentPage : 0;
}

function saveFullState() {
  vscode.postMessage({
    command: 'saveCheckedState',
    state: {
      pages: pages.map(p => ({ set: p.set, checkedFiles: p.checkedFiles, instructionFiles: p.instructionFiles })),
      currentPage
    }
  });
}

function handleSetDropdownChange(e) {
  pages[currentPage].set = e.target.value;
  pages[currentPage].checkedFiles = undefined;
  
  const hasSourceFolder = sourceFolderPath && sourceFolderPath.trim() !== '' && sourceFolderPath !== 'Not set';
  document.getElementById('injectBtn').disabled = !hasSourceFolder || !pages[currentPage].set;
  
  saveFullState();

  if (pages[currentPage].set) {
    vscode.postMessage({ command: 'getInstructionFiles', setName: pages[currentPage].set });
  } else {
    renderInstructionFiles([]);
  }
}

function handleInjectBtnClick() {
  const allSelections = pages.filter(p => p.set && p.checkedFiles.length).map(p => ({ setName: p.set, files: p.checkedFiles }));
  if (!allSelections.length) return;
  vscode.postMessage({ command: 'injectSets', selections: allSelections });
}

function handlePrevPageClick() {
  if (currentPage > 0) {
    currentPage--;
    renderPage();
    saveFullState();
  }
}

function handleNextPageClick() {
  if (currentPage < pages.length - 1) {
    currentPage++;
    renderPage();
    saveFullState();
  }
}

function handleAddSetClick() {
  const defaultSet = setsList[0] || '';
  pages.push({ set: defaultSet, checkedFiles: undefined, instructionFiles: [] });
  currentPage = pages.length - 1;
  renderPage();
  saveFullState();
  if (defaultSet) {
    vscode.postMessage({ command: 'getInstructionFiles', setName: defaultSet });
  }
}

function handleRemoveSetClick() {
  if (pages.length > 1) {
    pages.splice(currentPage, 1);
    if (currentPage > 0) currentPage--;
    renderPage();
    saveFullState();
  }
}

function handleBrowseBtnClick() {
  vscode.postMessage({ command: 'browseSourceFolder' });
}

function setInstructionFiles(files) {
  pages[currentPage].instructionFiles = files || [];
  const allFiles = files || [];
  if (typeof pages[currentPage].checkedFiles === 'undefined') {
    pages[currentPage].checkedFiles = [...allFiles];
  } else {
    pages[currentPage].checkedFiles = pages[currentPage].checkedFiles.filter(f => allFiles.includes(f));
  }
  renderInstructionFiles(pages[currentPage].instructionFiles, pages[currentPage].checkedFiles);
  saveFullState();
}

function updateLastInjectedSet(lastInjectedSet) {
  document.getElementById('lastInjectedSet').textContent = lastInjectedSet || 'None';
}

function renderInstructionFiles(files, checkedFiles) {
  const container = document.getElementById('instructionFileList');
  container.innerHTML = '';
  if (!files.length) {
    container.textContent = 'No instruction files found in this set.';
    return;
  }
  files.forEach(f => {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'space-between';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = f;
    nameSpan.style.cursor = 'pointer';
    nameSpan.style.flex = '1 1 auto';
    nameSpan.onclick = () => {
      vscode.postMessage({ command: 'openInstructionFile', setName: pages[currentPage].set, fileName: f });
    };
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checkedFiles.includes(f);
    checkbox.style.marginLeft = '12px';
    checkbox.onchange = () => {
      if (checkbox.checked) {
        if (!pages[currentPage].checkedFiles.includes(f)) pages[currentPage].checkedFiles.push(f);
      } else {
        pages[currentPage].checkedFiles = pages[currentPage].checkedFiles.filter(x => x !== f);
      }
      saveFullState();
    };
    div.appendChild(nameSpan);
    div.appendChild(checkbox);
    container.appendChild(div);
  });
}

function renderPage() {
  const dropdown = document.getElementById('setDropdown');
  dropdown.innerHTML = '';
  setsList.forEach(set => {
    const option = document.createElement('option');
    option.value = set;
    option.textContent = set;
    dropdown.appendChild(option);
  });
  if (!pages[currentPage].set && setsList.length) {
    pages[currentPage].set = setsList[0];
  }
  dropdown.value = pages[currentPage].set || (setsList[0] || '');
  const hasSourceFolder = sourceFolderPath && sourceFolderPath.trim() !== '' && sourceFolderPath !== 'Not set';
  dropdown.disabled = !hasSourceFolder;
  document.getElementById('injectBtn').disabled = !hasSourceFolder || !pages[currentPage].set;
  document.getElementById('removeSetBtn').disabled = pages.length <= 1;
  document.getElementById('prevPageBtn').disabled = currentPage === 0;
  document.getElementById('nextPageBtn').disabled = currentPage === pages.length - 1;
  document.getElementById('pageIndicator').textContent = `Page ${currentPage + 1} of ${pages.length}`;
  if (pages[currentPage].set) {
    vscode.postMessage({ command: 'getInstructionFiles', setName: pages[currentPage].set });
  } else {
    renderInstructionFiles([], []);
  }
}

function handleSourceFolderClick(e) {
  if (e.type === 'click' && e.button === 0 && sourceFolderPath) {
    vscode.postMessage({ command: 'openSourceFolder', folderPath: sourceFolderPath });
  }
}

window.onload = () => {
  document.getElementById('browseBtn').onclick = handleBrowseBtnClick;
  document.getElementById('setDropdown').onchange = handleSetDropdownChange;
  document.getElementById('injectBtn').onclick = handleInjectBtnClick;
  document.getElementById('prevPageBtn').onclick = handlePrevPageClick;
  document.getElementById('nextPageBtn').onclick = handleNextPageClick;
  document.getElementById('addSetBtn').onclick = handleAddSetClick;
  document.getElementById('removeSetBtn').onclick = handleRemoveSetClick;
  document.getElementById('sourceFolder').onclick = handleSourceFolderClick;
  vscode.postMessage({ command: 'getSets' });
};

window.addEventListener('message', event => {
  const { command, sets, setsPath, lastInjectedSet, instructionFiles, savedCheckedState } = event.data;
  if (command === 'sets') {
    setsList = sets || [];
    sourceFolderPath = setsPath || '';
    if (savedCheckedState) {
      restoreFullState(savedCheckedState);
    } else {
      pages.forEach(p => {
        if (!p.set && setsList.length) p.set = setsList[0];
      });
      currentPage = 0;
    }
    renderPage();
    document.getElementById('sourceFolder').textContent = sourceFolderPath || 'Not set';
    updateLastInjectedSet(lastInjectedSet);
  } else if (command === 'instructionFiles') {
    setInstructionFiles(instructionFiles);
  } else if (command === 'lastInjectedSetUpdate') {
    updateLastInjectedSet(lastInjectedSet);
  }
});
