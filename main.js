const { app, BrowserWindow,Menu } = require('electron');

const menuTemplate = require('./menuTemplate')

// 判断electron是否在开发环境
const isDev = require('electron-is-dev')

let mainWindow;
app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 680,
        webPreferences: {
            nodeIntegration: true
        },
        minHeight: 680,
        minWidth: 1024
    });

    const url = isDev ? "http://localhost:3000/" : "lin";

    mainWindow.webContents.openDevTools();

    mainWindow.loadURL(url);

    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)
});