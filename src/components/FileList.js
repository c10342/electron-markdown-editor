import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'
import useContextmenu from '../hooks/useContextmenu'
import { getParentNode } from '../utils/helper'

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
    const [editStatus, setEditStatus] = useState(false);
    const [value, setValue] = useState('');

    const closeEdit = () => {
        setEditStatus(false)
        setValue('')
    }

    const closeSearch = useCallback((file) => {
        closeEdit()
        if (file && file.isNew) {
            onFileDelete(file.id)
        }
    }, [onFileDelete])

    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)

    const clickItem = useContextmenu([
        {
            label: '打开',
            click: () => {
                const parentNode = getParentNode(clickItem.current, 'file-item')
                if (parentNode) {
                    const id = parentNode.dataset.id
                    onFileClick && onFileClick(id)
                }
            }
        },
        {
            label: '删除',
            click: () => {
                const parentNode = getParentNode(clickItem.current, 'file-item')
                if (parentNode) {
                    const id = parentNode.dataset.id
                    onFileDelete && onFileDelete(id)
                }
            }
        },
        {
            label: '重命名',
            click: () => {
                const parentNode = getParentNode(clickItem.current, 'file-item')
                if (parentNode) {
                    const id = parentNode.dataset.id
                    const title = parentNode.dataset.title
                    setEditStatus(id);
                    setValue(title)
                }
            }
        }
    ], '.file-list', [files])

    useEffect(() => {
        const createNewFiles = files.find(file => file.isNew)
        if (createNewFiles) {
            setEditStatus(createNewFiles.id)
        }
    }, [files])

    useEffect(() => {
        const createNewFiles = files.find(file => file.isNew)
        if (enterPressed && editStatus && value.trim()) {
            onSaveEdit && onSaveEdit(editStatus, value)
            closeEdit()
        }
        if (escPressed && editStatus) {
            closeSearch(createNewFiles)
        }

    }, [enterPressed, escPressed, value, editStatus, files, closeSearch, onSaveEdit])

    return (
        <ul className="list-group list-group-flush file-list">
            {
                files.map(file => {
                    return (
                        <li
                            key={file.id}
                            data-id={file.id}
                            data-title={file.title}
                            className="list-group-item bg-light row d-flex align-items-center no-gutters file-item">
                            {
                                (editStatus !== file.id) && (
                                    <>
                                        <span className='col-2'>
                                            <FontAwesomeIcon
                                                icon={faMarkdown}
                                                size='lg' />
                                        </span>
                                        <span
                                            onClick={() => { onFileClick && onFileClick(file.id) }}
                                            className='col-6 c-link text-truncate'
                                        >{file.title}</span>
                                        <button
                                            onClick={() => { setEditStatus(file.id); setValue(file.title) }}
                                            type='button'
                                            className='icon-button col-2'
                                        >
                                            <FontAwesomeIcon
                                                title='编辑'
                                                icon={faEdit}
                                                size='lg' />
                                        </button>
                                        <button
                                            onClick={() => { onFileDelete && onFileDelete(file.id) }}
                                            type='button'
                                            className='icon-button col-2'
                                        >
                                            <FontAwesomeIcon
                                                title='删除'
                                                icon={faTrash}
                                                size='lg' />
                                        </button>
                                    </>
                                )
                            }
                            {
                                (editStatus === file.id) && (
                                    <>
                                        <input
                                            placeholder='请输入文件名'
                                            autoFocus={editStatus === file.id}
                                            type="text"
                                            className="form-control search-input col-10 pl-2"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                        />
                                        <button
                                            className='icon-button col-2'
                                            onClick={() => { closeSearch(file) }}
                                        >
                                            <FontAwesomeIcon
                                                title='关闭'
                                                icon={faTimes}
                                                size='lg' />
                                        </button>
                                    </>
                                )
                            }
                        </li>
                    )
                })
            }
        </ul>
    )
}

FileList.propTypes = {
    files: PropTypes.array,
    onFileClick: PropTypes.func,
    onFileDelete: PropTypes.func,
    onSaveEdit: PropTypes.func,
}

FileList.defaultProps = {
    files: [],
}


export default FileList;