const { app, Menu, ipcMain, dialog } = require('electron');

const Store = require('electron-store')

const settingStore = new Store({ name: 'Settings' })

const fileStore = new Store({ name: 'Files' })


const menuTemplate = require('./menuTemplate')

const QiniuManager = require('./src/utils/QiniuManager')

// 判断electron是否在开发环境
const isDev = require('electron-is-dev')

const AppWindow = require('./AppWindow')

const path = require('path')

const createManager = () => {
    const accessKey = settingStore.get('accessKey', '')
    const secretKey = settingStore.get('secretKey', '')
    const bucket = settingStore.get('bucket', '')
    return new QiniuManager(accessKey, secretKey, bucket);
}

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
        const qiniuConfiged = ['accessKey', 'secretKey', 'bucket'].every(i => !!settingStore.get(i))
        const switchItems = (toggle) => {
            [1, 2, 3].forEach(i => {
                submenu.items[i].enabled = toggle
            })
        }
        switchItems(qiniuConfiged)
    })

    ipcMain.on("upload-file", (event, data) => {
        const manager = createManager()
        manager.uploadFile(data.key, data.path).then(data => {
            mainWindow.webContents.send("upload-file-success")
        }).catch((err) => {
            dialog.showErrorBox('上传失败', '请检查七牛云配置是否正确');
        })
    })

    ipcMain.on('download-file', (event, data) => {
        const manager = createManager()
        manager.getFileStat(data.key).then(res => {
            const filesObj = fileStore.get('files', {})
            // 七牛云的更新时间,纳秒==》毫秒
            const serverUpdatedTime = Math.round(res.putTime / 10000)
            const localUpdatedTime = filesObj[data.id].updateAt

            if (serverUpdatedTime > localUpdatedTime || !localUpdatedTime) {
                manager.downLoadFile(data.key, data.path).then(() => {
                    mainWindow.webContents.send('file-downloaded', { status: 'download-file-success', id: data.id })
                })
            } else {
                mainWindow.webContents.send('file-downloaded', { status: 'no-new-file', id: data.id })
            }
        }, err => {
            if (err.statusCode === 612) {
                mainWindow.webContents.send('file-downloaded', { status: 'no-file', id: data.id })
            }
        })
    })

    ipcMain.on('upload-all-file', () => {
        mainWindow.webContents.send('loading-status', true)
        const filesObj = fileStore.get('files', {})
        const manager = createManager()
        const promiseArr = Object.keys(filesObj).map(id => {
            // console.log(file)
            const file = filesObj[id]
            return manager.uploadFile(`${file.title}.md`, file.path)
        })
        Promise.all(promiseArr).then(() => {
            dialog.showMessageBoxSync({
                type: 'info',
                title: `成功上传了${promiseArr.length}个文件`,
                message: `成功上传了${promiseArr.length}个文件`
            })
            mainWindow.webContents.send('upload-all-file-success')
        }).catch((err) => {
            dialog.showErrorBox('上传失败', '请重新上传')
        }).finally(() => {
            mainWindow.webContents.send('loading-status', false)
        })
    })
});