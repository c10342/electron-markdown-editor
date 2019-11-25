import React from 'react'

import './spinner.scss'


const Spinner = ({ text = '处理中' }) => {
    return (
        <div className='spinner-component'>
            <div className="spinner-border text-primary" style={{width:'3rem',height:'3rem'}} role="status">
                <span className="sr-only">{text}</span>
            </div>
            <h5>{text}</h5>
        </div>
    )
}

export default Spinner;