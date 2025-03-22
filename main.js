const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        }
    })

    //mainWindow.webContents.openDevTools()
    //require(path.join(__dirname, './menu.js'))
    mainWindow.loadFile('index.html')
    mainWindow.setMenu(null)

    // 加载时发送配置数据
    const config = loadConfig()
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('load-history', config)
    })
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.exit()
})

let savedPath = ""

// 文件操作 IPC 处理
ipcMain.handle('read-file', async (_, path) => {
    return fs.promises.readFile(path, 'utf-8')
})

ipcMain.handle('save-file', async (_, content) => {
    /*
    const { filePath } = await dialog.showSaveDialog({
        title: '保存翻译文件',
        defaultPath: 'Language.translated.xaml',
        filters: [{ name: 'XAML Files', extensions: ['xaml'] }]
    })*/
    console.log(savedPath);
    if(savedPath){
        await fs.promises.writeFile(savedPath, content)
        return savedPath
    }
})
// 添加保存配置的IPC处理
ipcMain.on('save-config', (_, config) => {
    saveConfig(config)
})

// 添加获取配置的IPC处理
ipcMain.handle('get-config', () => {
    return loadConfig()
})

//设置默认保存位置
ipcMain.handle("set-translation-path",(_,path) =>{
    console.log(path);
    savedPath = path
})

const configPath = './config.json'
function loadConfig() {
    try {
        return JSON.parse(fs.readFileSync(configPath))
    } catch {
        return { lastTemplate: null, lastTranslation: null }
    }
}

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config))
}