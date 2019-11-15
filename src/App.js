import React, { useState, useCallback } from 'react';


import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'

import FileSearch from './components/FileSearch'
import FileList from './components/FileList';
import defaultFiles from './utils/defaultFiles'
import BottomBtn from './components/BottomBtn'
import TabList from './components/TabList'

import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'

import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

import uuidv4 from 'uuid/v4'

function App() {
  // 文件列表
  const [files, setFiles] = useState(defaultFiles);
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

  // 已经打开的文件
  const openedFiles = openedFileIDs.map(openID => {
    return files.find(file => file.id === openID)
  });

  // 正在编辑的文件
  const activeFile = files.find(file => file.id === activeFileID);

  // 点击左侧面板文件列表项
  const fileClick = useCallback((id) => {
    if (!openedFileIDs.includes(id)) {
      setOpenedFileIDs([...openedFileIDs, id]);
    }
    setActiveFileID(id)
  }, [openedFileIDs])

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
    if (!unsavedFileIDs.includes(id)) {
      setUnsavedFileIDs([...unsavedFileIDs, id]);
    }

    // 更新文件内容
    const newFiles = files.map(file => {
      if (file.id === id) {
        file.body = value
      }
      return file
    })

    setFiles(newFiles)
  }, [unsavedFileIDs, files])

  // 删除文件
  const fileDelete = useCallback((id) => {
    const newFiles = files.filter(file => file.id !== id);
    setFiles(newFiles);
    // 删除文件后需要关闭对应的选项卡
    closeTab(id)
  }, [files,closeTab])

  // 保存修改的文件名
  const saveEdit = useCallback((id, value) => {
    const newFiles = files.map(file => {
      if (file.id === id) {
        file.title = value
        if (file.isNew) {  //新建文件
          setActiveFileID(id)
          setOpenedFileIDs([...openedFileIDs, id])
        }
        //如果是新建文件，保存修改的文件名则标识创建完成
        file.isNew = false
      }
      return file
    })
    setFiles(newFiles)
  }, [files, openedFileIDs])

  // 搜索文件
  const fileSearch = useCallback((value) => {
    if (value) {
      const newSearchFiles = files.filter(file => file.title.includes(value))
      setSearchedFiles(newSearchFiles);
      setIsSearch(true)
    } else {
      setIsSearch(false)
    }
  }, [files])

  // 新建文件
  const createNewFile = useCallback(() => {
    // 已经有文件在新建了
    if (files.find(file => file.isNew)) {
      return
    }
    const id = uuidv4()
    const newFiles = [
      ...files,
      {
        id,
        title: '',
        body: '## 请输入',
        createdAt: Date.now(),
        isNew: true //标识是否为新建文件
      }
    ]
    setFiles(newFiles)
  }, [files,])

  const fileList = isSearch ? searchedFiles : files;

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
              </>
            )
          }
        </div>
      </div>
    </div>
  );
}

export default App;
