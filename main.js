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

// 文件操作 IPC 处理
ipcMain.handle('read-file', async (_, path) => {
    return fs.promises.readFile(path, 'utf-8')
})

ipcMain.handle('save-file', async (_, content) => {
    const { filePath } = await dialog.showSaveDialog({
        title: '保存翻译文件',
        defaultPath: 'Language.translated.xaml',
        filters: [{ name: 'XAML Files', extensions: ['xaml'] }]
    })
    if (filePath) {
        await fs.promises.writeFile(filePath, content)
        return filePath
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