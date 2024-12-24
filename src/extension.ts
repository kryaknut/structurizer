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

            //создание структуры проекта
            createProjectStructure(projectPath);
        }
    });

    let updateCMakeListsCommand = vscode.commands.registerCommand('extension.updateCMakeLists', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Откройте проект c CMakeLists.txt');
            return;
        }
    
        await updateCMakeLists(workspaceFolders[0].uri.fsPath);
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(updateCMakeListsCommand);
}

async function updateCMakeLists(basePath: string) {
    const folders = ['bin', 'lib', 'tests'];
    let sourcesVariables: string[] = [];

    for (const folder of folders) {
        const folderPath = path.join(basePath, folder);
        const cmakeListsPath = path.join(folderPath, 'CMakeLists.txt');

        if (fs.existsSync(cmakeListsPath)) {
            // Получаем все .cpp файлы в текущей папке
            const sourceFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.cpp'));

            // Обновляем CMakeLists.txt
            let cmakeContent = fs.readFileSync(cmakeListsPath, 'utf-8');

            // Создаем новую переменную для источников
            const sourcesVarName = `SOURCES_${folder.toUpperCase()}`;
            sourcesVariables.push(sourcesVarName);

            // Формируем строку для GLOB
            const newSources = sourceFiles.map(file => `"${file}"`).join('\n');
            const globLine = `file(GLOB ${sourcesVarName} ${newSources})`;

            // Если секция с GLOB уже существует, обновляем ее
            if (cmakeContent.includes(`file(GLOB ${sourcesVarName}`)) {
                cmakeContent = cmakeContent.replace(new RegExp(`file\\(GLOB ${sourcesVarName} ".*?"\\)`), globLine);
            } else {
                // Если секция не существует, добавляем ее
                cmakeContent = cmakeContent.replace(/#\s*Получаем все \.cpp файлы в папке/, `$&\n${globLine}`);
            }

            // Записываем обновленный CMakeLists.txt
            fs.writeFileSync(cmakeListsPath, cmakeContent, 'utf-8');
            vscode.window.showInformationMessage(`CMakeLists.txt в папке ${folder} обновлен.`);
        } else {
            vscode.window.showWarningMessage(`CMakeLists.txt не найден в папке ${folder}.`);
        }
    }

    //обновляем основной CMakeLists.txt для добавления всех источников в add_executable
    const mainCMakeListsPath = path.join(basePath, 'CMakeLists.txt');
    let mainCMakeContent = fs.readFileSync(mainCMakeListsPath, 'utf-8');

    //формируем строку для add_executable
    const sourcesList = sourcesVariables.map(varName => `\${${varName}}`).join(' ');
    const addExecutableLine = `add_executable(\${PROJECT_NAME} ${sourcesList})`;

    //если строка add_executable уже существует, обновляем ее, иначе добавляем
    if (mainCMakeContent.includes('add_executable')) {
        mainCMakeContent = mainCMakeContent.replace(/add_executable\(\${PROJECT_NAME} .*?\)/, addExecutableLine);
    } else {
        mainCMakeContent = mainCMakeContent.replace(/(# Добавляем исполняемый файл)/, `$1\n${addExecutableLine}`);
    }

    //записываем обновленный основной CMakeLists.txt
    fs.writeFileSync(mainCMakeListsPath, mainCMakeContent, 'utf-8');
}

function createProjectStructure(basePath: string) {
    const folders = [
        'lib',
        'bin',
        'tests',
    ];

    folders.forEach(folder => {
        const folderPath = path.join(basePath, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
    });

    const mainContent = `
int main() {
    return 0;
}`;

    // Создание файла CMakeLists.txt
    const cmakeContent = `
cmake_minimum_required(VERSION 3.10)
project(MyProject)

set(CMAKE_CXX_STANDARD 26)

include_directories(include)

add_subdirectory(bin)
add_subdirectory(lib)
add_subdirectory(tests)
`;

    const cmakeLibContent = `
`;

    const cmakeBinContent = `
# Получаем все .cpp файлы в папке bin
file(GLOB SOURCES_BIN "*.cpp")

# Создаем исполняемый файл
add_executable(\${PROJECT_NAME} \${SOURCES_BIN})`;

    const cmakeTestsContent = `
`;5

    fs.writeFileSync(path.join(basePath, 'CMakeLists.txt'), cmakeContent.trim());
    fs.writeFileSync(path.join(basePath, 'bin/main.cpp'), mainContent.trim());
    fs.writeFileSync(path.join(basePath, 'lib/CMakeLists.txt'), cmakeLibContent.trim());
    fs.writeFileSync(path.join(basePath, 'bin/CMakeLists.txt'), cmakeBinContent.trim());
    fs.writeFileSync(path.join(basePath, 'tests/CMakeLists.txt'), cmakeTestsContent.trim());
    
    // Создание файла README.md
    const readmeContent = `# Проект\n\n## Описание проекта\n\n`;
    fs.writeFileSync(path.join(basePath, 'README.md'), readmeContent.trim());

    vscode.window.showInformationMessage('Project structure created successfully!');
}

export function deactivate() {}