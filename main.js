const { app, Menu, ipcMain, dialog } = require('electron');

const Store = require('electron-store')

const {autoUpdater} = require('electron-updater')

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
    if(isDev){
        autoUpdater.updateConfigPath = path.join(__dirname,'./dev-app-update.yml');
    }

    // 自动更新
    autoUpdater.autoDownload = false
    // 这个方法只能在正式环境使用
    // autoUpdater.checkForUpdatesAndNotify()
    // 测试环境
    autoUpdater.checkForUpdates()
    autoUpdater.on('error',error=>{
        dialog.showErrorBox('Error',error == null?"unknown":error.toString())
    })
    autoUpdater.on('update-available',()=>{
        dialog.showMessageBox({
            type:'info',
            title:'应用有新版本',
            message:'发现新版本，是否现在更新？',
            buttons:['是','否']
        }).then(data=>{
            if(data.response == 0){
                autoUpdater.downloadUpdate()
            }else{

            }

        })
    })
    autoUpdater.on('update-not-available',()=>{
        dialog.showMessageBox({
            title:'没有新版本',
            message:'当前已经是最新版本'
        })
    })
    autoUpdater.on('checking-for-update',()=>{
        console.log('checking-for-update....')
    })
    autoUpdater.on('download-progress',(progressObj)=>{
        let message = 'Download speed: '+progressObj.bytesPersecond;
        message+='-Downloaded '+progressObj.percent+'%'
        message+= '('+progressObj.transferred+'/'+progressObj.total+")"
        console.log(message)
    })

    autoUpdater.on('update-downloaded',()=>{
        console.log('update-downloaded')
        dialog.showMessageBox({
            title:'安装更新',
            message:'更新下载完毕,应用将重启并安装'
        },()=>{
            setImmediate(()=>autoUpdater.quitAndInstall())
        })
    })

    const url = isDev ? "http://localhost:3000/" : `file://${path.join(__dirname, './build/index.html')}`;
    mainWindow = new AppWindow({
        minHeight: 680,
        minWidth: 1024
    }, url)

    // mainWindow.webContents.openDevTools();

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

        // settingWindow.webContents.openDevTools()

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