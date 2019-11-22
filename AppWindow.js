const { BrowserWindow } = require('electron')

class AppWindow extends BrowserWindow {
    constructor(config, url) {
        const baseConfig = {
            width: 1024,
            height: 680,
            webPreferences: {
                nodeIntegration: true
            },
            show:false,
            backgroundColor:'#efefef'
        }
        const finalConfig = {...baseConfig,config}
        super(finalConfig)
        this.loadURL(url)
        this.once('ready-to-show',()=>{
            this.show()
        })
    }
}

module.exports = AppWindow