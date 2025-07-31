# Copilot Profiles - A Modular Instruction Manager

### Easily manage modular GitHub Copilot instruction sets inside Visual Studio Code.

Copilot Profiles is a Visual Studio Code extension that lets you easily switch between custom instruction sets for GitHub Copilot.

Instead of manually editing .github/copilot-instructions.md every time you want Copilot to behave differently, this extension gives you a clean, intuitive UI to pick, preview, and combine reusable .md files from configurable sets.

## Features

### Source Folder Management
Browse, select, or create a Source Folder containing your instruction sets. Each set is simply a subfolder of markdown (.md) files representing modular Copilot instructions.

### Instruction Set Selection
Use a dropdown to choose from all available sets. Each set can represent a different Copilot behavior, coding style, or project context.

### File Selection
Select specific .md files within a set to include. Files can be reused across multiple sets for maximum modularity.

### Injection to .github/copilot-instructions.md
Automatically combines all selected files into a single copilot-instructions.md file in your workspace.

### Multi-Set Support
Enable multiple instruction sets at once. All enabled files across all selected sets will be injected together.

### Persistent State
Your selected source folder, sets, and files are saved automatically so everything is restored when you reload VS Code.

## How to use

- Create a Source Folder anywhere on your system.

  - <img width="132" height="136" alt="image" src="https://github.com/user-attachments/assets/53d13f9f-b95f-43b8-be7c-357be4147bf7" />

- Inside it, create subfolders, with each one representing a Set.

  - <img width="269" height="65" alt="image" src="https://github.com/user-attachments/assets/2e95a9f0-54d8-4fe3-b319-3ab5ff995633" />

- Add your instruction files (.md) to the appropriate Set folder.

  - <img width="267" height="69" alt="image" src="https://github.com/user-attachments/assets/11730d4e-a793-449b-94bb-486c24022617" />

- In VS Code, open the Copilot Profiles sidebar and select Browse for Source Folder.

  - <img width="387" height="416" alt="image" src="https://github.com/user-attachments/assets/3e4cfcf9-0379-4c96-ae57-2c6a595653d4" />

- Choose the Source Folder you created.
  
  - <img width="845" height="413" alt="image" src="https://github.com/user-attachments/assets/09c1e36f-e19c-477e-819b-405d5282cf7b" />

- Pick a Set from the dropdown and click Inject.
  
  - <img width="323" height="734" alt="image" src="https://github.com/user-attachments/assets/a4a38443-84c0-414b-bd4b-da8d1c627d55" />

- The selected Set’s instruction files will be combined into .github/copilot-instructions.md, which GitHub Copilot automatically uses as context.
  
  - <img width="1099" height="867" alt="image" src="https://github.com/user-attachments/assets/9b3b1b13-45cf-41f0-a2f1-8fe3de231596" />

## Demo

https://github.com/user-attachments/assets/b738a327-e2dd-4684-bb8c-cc3dff0e86cf
