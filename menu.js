const { Menu, ipcMain } = require('electron')

//创建菜单集合
let template = [
    {
        label: '文件',
        submenu: [
            {
                label: '保存翻译',
                accelerator: 'ctrl+s',
                click: () => {
                    ipcMain.send('on-save-file-click')
                }
            }
        ]
    }
]
let menuBuilder = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menuBuilder);