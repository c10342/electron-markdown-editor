import {useEffect} from 'react'

const {ipcRenderer} = window.require('electron')

const useIpcRenderer = (listeners,dps)=>{
    useEffect(()=>{
        Object.keys(listeners).forEach(key=>{
            ipcRenderer.on(key,listeners[key])
        })
        return ()=>{
            Object.keys(listeners).forEach(key=>{
                ipcRenderer.removeListener(key,listeners[key])
            })
        }
    },dps)
}


export default useIpcRenderer