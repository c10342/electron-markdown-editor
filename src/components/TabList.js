import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

import './TabList.scss'


const TabList = ({ files, activeId, unsaveIds, onTabClick, onCloseTab }) => {
    return (
        <ul className="nav nav-pills tablist-component">
            {
                files.map(file => {
                    const withUnsaveMark = unsaveIds.includes(file.id)
                    const fClassName = classNames({
                        'nav-link': true,
                        'active': activeId === file.id,
                        'withUnsaveMark':withUnsaveMark,
                        "text-truncate":true,
                        "max-width-150":true,
                        "position-relative":true,
                        "pr-4":true
                    })
                    return (
                        <li className="nav-item" key={file.id}>
                            <a
                                className={fClassName}
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onTabClick && onTabClick(file.id)
                                }}
                            >
                                {file.title}

                                <span 
                                onClick={(e)=>{
                                    e.stopPropagation();
                                    onCloseTab && onCloseTab(file.id)
                                }}
                                className='close-icon tab-icon'>
                                    <FontAwesomeIcon
                                        icon={faTimes} />
                                </span>

                                { withUnsaveMark && <span className='rounded-circle unsaved-icon tab-icon'></span>}
                            </a>
                        </li>
                    )
                })
            }

        </ul>
    )
}

TabList.propTypes = {
    files: PropTypes.array,
    activeId: PropTypes.string,
    unsaveIds: PropTypes.array,
    onTabClick: PropTypes.func,
    onCloseTab: PropTypes.func
}

TabList.defaultProps = {
    files: [],
    unsaveIds: []
}

export default TabList