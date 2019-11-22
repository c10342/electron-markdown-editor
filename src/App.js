import React, { useState, useCallback, useMemo } from 'react';


import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'

import FileSearch from './components/FileSearch'
import FileList from './components/FileList';
import BottomBtn from './components/BottomBtn'
import TabList from './components/TabList'

import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'

import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

import uuidv4 from 'uuid/v4'

import useIpcRenderer from './hooks/useIpcRenderer'

import { flattenArr, objToArr } from './utils/helper'
import FileHelper from './utils/fileHelper'

const path = window.require('path')
const { remote } = window.require('electron')
const fs = window.require('fs')

// 持久化数据
const Store = window.require('electron-store')
const fileStore = new Store({name:'Files'});

const settingStore = new Store({name:'Settings'})

// 持久化数据到本地
const saveFilesToStore = (files) => {
  const fileStoreObj = objToArr(files).reduce((result, file) => {
    const { id, path, title, createdAt } = file
    result[id] = {
      id, path, title, createdAt
    }
    return result
  }, {})
  fileStore.set('files', fileStoreObj)
}

let defaultFiles = fileStore.get('files',{})

// 检查文件是否存在
defaultFiles = Object.values(defaultFiles).reduce((result, file) => {
  if (fs.existsSync(file.path)) {
    result[file.id] = file
  }
  return result
}, {})



function App() {
  const localPath = settingStore.get('fileLocation') || remote.app.getPath('documents')
  // 文件列表
  const [files, setFiles] = useState(defaultFiles || {});
  // 正在编辑的文件id
  const [activeFileID, setActiveFileID] = useState('');
  // 已经打开的文件id
  const [openedFileIDs, setOpenedFileIDs] = useState([]);
  // 没有保存的文件id
  const [unsavedFileIDs, setUnsavedFileIDs] = useState([]);
  // 搜索的文件
  const [searchedFiles, setSearchedFiles] = useState([]);
  // 是否正在搜索文件
  const [isSearch, setIsSearch] = useState(false);
  const filesArr = useMemo(() => {
    return objToArr(files)
  }, [files])

  // 正在编辑的文件
  const activeFile = useMemo(() => {
    return files[activeFileID]
  }, [files, activeFileID]);

  // 点击左侧面板文件列表项
  const fileClick = useCallback((id) => {
    if (!openedFileIDs.includes(id) && !fs.existsSync(files[id].path)) {
      alert('文件不存在')
      return;
    }
    if (!openedFileIDs.includes(id)) {
      setOpenedFileIDs([...openedFileIDs, id]);
    }
    setActiveFileID(id)
    const currentFile = files[id]

    // 已经加载过的文件不需要再次加载
    if (!currentFile.isLoad) {
      FileHelper.readFile(currentFile.path).then((value) => {
        const newFile = { ...currentFile, body: value, isLoad: true }
        setFiles({ ...files, [id]: newFile })
      })
    }
  }, [openedFileIDs, files])

  // 点击右侧面板上方的tablist组件的每一项
  const tabClick = useCallback((id) => {
    setActiveFileID(id)
  }, [])

  // 点击右侧面板上方的tablist组件的每一项的关闭图标
  const closeTab = useCallback((id) => {
    const newOpenedFileIDs = openedFileIDs.filter(openedFileID => openedFileID !== id);
    setOpenedFileIDs(newOpenedFileIDs);

    // 关闭当前tab后，最近一次打开的文件为编辑状态
    if (id === activeFileID && newOpenedFileIDs.length > 0) {
      const len = newOpenedFileIDs.length - 1;
      setActiveFileID(newOpenedFileIDs[len]);
    }

    // 当没有打开的文件
    if (newOpenedFileIDs.length === 0) {
      setActiveFileID('');
    }
  }, [openedFileIDs, activeFileID])

  // 编辑文件，文件发生变化
  const fileChange = useCallback((id, value) => {
    if (files[id].body === value) {
      return
    }
    if (!unsavedFileIDs.includes(id)) {
      setUnsavedFileIDs([...unsavedFileIDs, id]);
    }

    // 更新文件内容
    // const newFiles = files.map(file => {
    //   if (file.id === id) {
    //     file.body = value
    //   }
    //   return file
    // })
    const newFiles = { ...files[id], body: value }

    setFiles({ ...files, [id]: newFiles })
  }, [unsavedFileIDs, files])

  // 删除文件
  const fileDelete = useCallback((id) => {

    const { [id]: value, ...afterDeleteFiles } = files
    if (files[id].isNew) {  //新建文件的时候，取消操作
      setFiles(afterDeleteFiles);
    } else {  //文件已经存在了
      if (fs.existsSync(files[id].path)) {
        FileHelper.deleteFile(files[id].path).then(() => {
          // 删除文件后需要关闭对应的选项卡
          closeTab(id)
          setFiles(afterDeleteFiles);
          saveFilesToStore(afterDeleteFiles)
        })
      } else {
        // 删除文件后需要关闭对应的选项卡
        closeTab(id)
        setFiles(afterDeleteFiles);
        saveFilesToStore(afterDeleteFiles)
      }

    }

  }, [files, closeTab])

  // 保存修改的文件名或者新建文件
  const saveEdit = useCallback((id, value) => {
    // const newFiles = files.map(file => {
    //   if (file.id === id) {
    //     file.title = value
    //     if (file.isNew) {  //新建文件
    //       setActiveFileID(id)
    //       setOpenedFileIDs([...openedFileIDs, id])
    //     }
    //     //如果是新建文件，保存修改的文件名则标识创建完成
    //     file.isNew = false
    //   }
    //   return file
    // })
    const isNew = files[id].isNew
    // 新建是新建在指定目录下的,修改文件名是修改原来路径下面的
    const newPath = isNew ? path.join(localPath, `${value}.md`) : path.join(path.dirname(files[id].path), `${value}.md`)
    const modifiedFile = { ...files[id], title: value, isNew: false, path: newPath }
    const newFiles = { ...files, [id]: modifiedFile }
    if (isNew) {  //新建文件
      FileHelper
        .writeFile(newPath, files[id].body)
        .then(() => {
          setFiles(newFiles)
          setOpenedFileIDs([...openedFileIDs, id])
          setActiveFileID(id)
          saveFilesToStore(newFiles)
        })

    } else { //重命名
      const oldPath = files[id].path
      FileHelper
        .renameFile(oldPath, newPath)
        .then(() => {
          setFiles(newFiles)
          saveFilesToStore(newFiles)
        })
    }

  }, [files, openedFileIDs])

  // 搜索文件
  const fileSearch = useCallback((value) => {
    if (value) {
      const newSearchFiles = filesArr.filter(file => file.title.includes(value))
      setSearchedFiles(newSearchFiles);
      setIsSearch(true)
    } else {
      setIsSearch(false)
    }
  }, [files])

  // 新建文件
  const createNewFile = useCallback(() => {
    // 已经有文件在新建了
    if (filesArr.find(file => file.isNew)) {
      return
    }
    const id = uuidv4()
    // const newFiles = [
    //   ...files,
    //   {
    //     id,
    //     title: '',
    //     body: '## 请输入',
    //     createdAt: Date.now(),
    //     isNew: true //标识是否为新建文件
    //   }
    // ]
    const newFiles = {
      id,
      title: '',
      body: '## 请输入',
      createdAt: Date.now(),
      isNew: true //标识是否为新建文件
    }
    setFiles({ ...files, [id]: newFiles })
  }, [files])

  // 已经打开的文件
  const openedFiles = useMemo(() => {
    return openedFileIDs.map(openID => {
      const of = filesArr.find(file => file.id === openID)
      return of
    })
  }, [openedFileIDs, filesArr])

  // 保存当前文件
  const saveCurrentFile = useCallback(() => {
    FileHelper
      .writeFile(activeFile.path, activeFile.body)
      .then(() => {
        setUnsavedFileIDs(unsavedFileIDs.filter(i => i !== activeFileID))
      })
  })

  // 导入文件
  const importFile = useCallback(() => {
    remote.dialog.showOpenDialog({
      title: '选择 markdown 文件',
      filters: [{ name: 'markdown', extensions: ['md'] }],
      properties: ['openFile', 'multiSelections']
    }).then(result => {
      const filePaths = result.filePaths
      if (Array.isArray(filePaths)) {
        // 过滤掉已经加载了的文件
        let newPaths = filePaths.filter(path => {
          const isL = Object.values(files).find(file => file.path === path);
          return !isL
        })

        if (newPaths.length > 0) {
          newPaths = newPaths.map(mpath => {
            return {
              id: uuidv4(),
              title: path.basename(mpath, path.extname(mpath)),
              path: mpath,
            }
          })
          const newFiles = { ...files, ...flattenArr(newPaths) }
          setFiles(newFiles)
          saveFilesToStore(newFiles)
          remote.dialog.showMessageBox({
            type: 'info',
            title: `成功导入了${newPaths.length}个文件`,
            message: `成功导入了${newPaths.length}个文件`
          })
        }
      }
    }).catch(err => {
      console.log(err)
    })
  }, [files])

  const fileList = useMemo(() => {
    return isSearch ? searchedFiles : filesArr
  }, [isSearch, searchedFiles, filesArr]);


  useIpcRenderer({
    'create-new-file': createNewFile,
    'save-edit-file': saveCurrentFile,
    'import-file': importFile
  }, [createNewFile, saveCurrentFile, importFile])

  return (
    <div className="App container-fluid px-0">
      <div className="row no-gutters">
        <div className="col-3 left-pannel">
          <FileSearch
            title='我的云文档'
            onFileSearch={fileSearch}
          />
          <FileList
            files={fileList}
            onFileClick={fileClick}
            onFileDelete={fileDelete}
            onSaveEdit={saveEdit}
          />
          <div className='row no-gutters button-group'>
            <div className='col'>
              <BottomBtn
                onBtnClick={createNewFile}
                text='新建'
                icon={faPlus}
                colorClass='btn-primary'
              />
            </div>
            <div className='col'>
              <BottomBtn
                text='导入'
                icon={faFileImport}
                colorClass='btn-success'
                onBtnClick={importFile}
              />
            </div>
          </div>
        </div>
        <div className="col-9 right-pannel d-flex flex-column">
          {
            !activeFileID && (
              <div className='start-page'>
                请新建或者导入 markdown 文件
              </div>
            )
          }
          {
            activeFileID && (
              <>
                <TabList
                  unsaveIds={unsavedFileIDs}
                  files={openedFiles}
                  activeId={activeFileID}
                  onTabClick={tabClick}
                  onCloseTab={closeTab}
                />
                <SimpleMDE
                  className='edit d-flex flex-column'
                  key={activeFile && activeFile.id}
                  onChange={(value) => { fileChange(activeFile.id, value) }}
                  value={activeFile && activeFile.body}
                />
                {/* <BottomBtn
                  onBtnClick={saveCurrentFile}
                  text='保存'
                  icon={faPlus}
                  colorClass='btn-primary'
                /> */}
              </>
            )
          }
        </div>
      </div>
    </div>
  );
}

export default App;
