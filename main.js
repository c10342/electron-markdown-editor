const { app, Menu, ipcMain } = require('electron');

const Store = require('electron-store')

const store = new Store({ name: 'Settings' })


const menuTemplate = require('./menuTemplate')

// 判断electron是否在开发环境
const isDev = require('electron-is-dev')

const AppWindow = require('./AppWindow')

const path = require('path')

let mainWindow;
let settingWindow;
app.on('ready', () => {
    // mainWindow = new BrowserWindow({
    //     width: 1024,
    //     height: 680,
    //     webPreferences: {
    //         nodeIntegration: true
    //     },
    //     minHeight: 680,
    //     minWidth: 1024
    // });

    const url = isDev ? "http://localhost:3000/" : "lin";
    mainWindow = new AppWindow({
        minHeight: 680,
        minWidth: 1024
    }, url)

    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)

    ipcMain.on('open-settings-window', () => {
        const settingConfig = {
            width: 500,
            height: 400,
            parent: mainWindow
        }
        const url = `file://${path.join(__dirname, './settings/settings.html')}`
        settingWindow = new AppWindow(settingConfig, url)

        settingWindow.webContents.openDevTools()

        settingWindow.removeMenu()

        settingWindow.on('closed', () => {
            settingWindow = null
        })
    })

    ipcMain.on('config-is-saved', () => {
        const qiniuMenuItem = process.platform === 'darwin' ? menu.items[3] : menu.items[2]
        const submenu = qiniuMenuItem.submenu;
        const qiniuConfiged = ['accessKey', 'secretKey', 'bucket'].every(i => !!store.get(i))
        const switchItems = (toggle) => {
            [1, 2, 3].forEach(i => {
                submenu.items[i].enabled = toggle
            })
        }
        switchItems(qiniuConfiged)
    })
});