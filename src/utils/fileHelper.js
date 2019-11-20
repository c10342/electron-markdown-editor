const fs = window.require('fs').promises

class FileHelper{
    static readFile(path){
        return fs.readFile(path,{encoding:'utf8'})
    }

    static writeFile(path,content){
        return fs.writeFile(path,content,{encoding:'utf8'})
    }
    static renameFile(oldPath,newPath){
        return fs.rename(oldPath,newPath)
    }
    static deleteFile(path){
        return fs.unlink(path)
    }
}

export default FileHelper

