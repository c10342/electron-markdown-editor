import React, { useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

const BottomBtn = ({ text, colorClass, icon, onBtnClick }) => {
    const onClick = useCallback(() => {
        onBtnClick && onBtnClick()
    }, [onBtnClick])
    return (
        <button
            onClick={onClick}
            type='button'
            className={`btn btn-block no-border ${colorClass}`}
        >
            <FontAwesomeIcon
                className='mr-2'
                icon={icon}
                size='lg' />
            {text}
        </button>
    )
}

BottomBtn.propTypes = {
    text: PropTypes.string
}

BottomBtn.defaultProps = {
    text: '新建'
}

export default BottomBtn