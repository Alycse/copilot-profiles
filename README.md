# Copilot Profiles

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

### Sample Set Generator
Quickly generate a sample Source Folder with example sets and files to see how everything works out of the box.

## Demo

https://github.com/user-attachments/assets/b738a327-e2dd-4684-bb8c-cc3dff0e86cf
