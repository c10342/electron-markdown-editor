import { useEffect, useRef } from 'react'

const { remote } = window.require('electron')

const { Menu, MenuItem } = remote

const useContextmenu = (itemsArr, selectTarget,dps) => {
    let clickedElement = useRef(null)
    useEffect(() => {
        const menu = new Menu()

        itemsArr.forEach(item => {
            menu.append(new MenuItem(item))
        });
        const handleMenu = (e) => {
            // 点击的目标在需要显示的范围内
            if (selectTarget && document.querySelector(selectTarget).contains(e.target)) {
                clickedElement.current = e.target
                menu.popup({ window: remote.getCurrentWindow() })
            }
        }
        window.addEventListener('contextmenu', handleMenu)

        return () => {
            window.removeEventListener('contextmenu', handleMenu)
        }
    }, dps)
    return clickedElement
}

export default useContextmenu