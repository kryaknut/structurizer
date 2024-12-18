import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.createProjectStructure', async () => {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: 'Select a folder to create the project structure'
        });

        if (folderUri && folderUri[0]) {
            const projectPath = folderUri[0].fsPath;

            // Создание структуры проекта
            createProjectStructure(projectPath);
        }
    });

    context.subscriptions.push(disposable);
}

function createProjectStructure(basePath: string) {
    const folders = [
        'lib',
        'bin',
        'tests',
    ];

    folders.forEach(folder => {
        const folderPath = path.join(basePath, folder);
        fs.mkdirSync(folderPath, { recursive: true });
    });

    const mainContent = `
    int main() {

    return 0;
}`

    // Создание файла CMakeLists.txt
    const cmakeContent = `
cmake_minimum_required(VERSION 3.10)
project(MyProject)

set(CMAKE_CXX_STANDARD 26)

include_directories(include)
file(GLOB SOURCES "bin/*.cpp")

add_subdirectory(bin)
add_subdirectory(lib)
add_subdirectory(tests)
`;

const cmakeLibContent = `

`;
const cmakeBinContent = `
add_executable(\${PROJECT_NAME} \${SOURCES})
`;
const cmakeTestsContent = `

`;

    fs.writeFileSync(path.join(basePath, 'CMakeLists.txt'), cmakeContent.trim());
    fs.writeFileSync(path.join(basePath, 'bin/main.cpp'), mainContent.trim());
    fs.writeFileSync(path.join(basePath, 'lib/CMakeLists.txt'), cmakeLibContent.trim());
    fs.writeFileSync(path.join(basePath, 'bin/CMakeLists.txt'), cmakeBinContent.trim());
    fs.writeFileSync(path.join(basePath, 'tests/CMakeLists.txt'), cmakeTestsContent.trim());
    // Создание файла README.md
    const readmeContent = `# MyProject\n\n## Description\n\nA brief description of your project.`;
    fs.writeFileSync(path.join(basePath, 'README.md'), readmeContent.trim());

    vscode.window.showInformationMessage('Project structure created successfully!');
}

export function deactivate() {}