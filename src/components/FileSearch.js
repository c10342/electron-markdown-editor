import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'

import useIpcRenderer from '../hooks/useIpcRenderer'

const FileSearch = ({ title, onFileSearch }) => {
    // 是否处于搜索状态
    const [inputActive, setInputActive] = useState(false);
    // 文本框的值
    const [value, setValue] = useState('');

    const inputRef = useRef(null)

    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)

    const closeSearch = useCallback(() => {
        setInputActive(false)
        setValue('')
        onFileSearch('')
    },[onFileSearch])

    useEffect(() => {
        if (enterPressed && inputActive) {
            onFileSearch && onFileSearch(value)
        }
        if (escPressed && inputActive) {
            closeSearch()
            onFileSearch('')
        }
    }, [enterPressed, escPressed, inputActive, value, onFileSearch,closeSearch])

    useEffect(() => {
        if (inputActive) {
            inputRef.current.focus()
        }
    }, [inputActive])
    useIpcRenderer({
        'search-file': () => setInputActive(true),
      }, [])


    return (
        <div className='alert alert-primary d-flex justify-content-between align-items-center mb-0'>
            {
                !inputActive &&
                <>
                    <span>{title}</span>
                    <button
                        className='icon-button'
                        onClick={() => setInputActive(true)}
                    >
                        <FontAwesomeIcon
                            title='搜索'
                            icon={faSearch}
                            size='lg' />
                    </button>
                </>
            }
            {
                inputActive &&
                <>
                    <input
                        ref={inputRef}
                        type="text"
                        className="form-control search-input"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                    <button
                        className='icon-button'
                        onClick={closeSearch}
                    >
                        <FontAwesomeIcon
                            title='关闭'
                            icon={faTimes}
                            size='lg' />
                    </button>
                </>
            }
        </div>
    )
}

FileSearch.propTypes = {
    title: PropTypes.string,
    onFileSearch: PropTypes.func
}

FileSearch.defaultProps = {
    title: '我的云文档'
}

export default FileSearch