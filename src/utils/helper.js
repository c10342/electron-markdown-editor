// 数组扁平为json对象
export const flattenArr = (arr) => {
    return arr.reduce((map, item) => {
        map[item.id] = item
        return map
    }, {})
}

// json对象变数组
export const objToArr = (obj) => {
    return Object.keys(obj).map(key => obj[key])
}

// 寻找父元素
export const getParentNode = (node, parentClassName) => {
    let current = node
    while (current !== null) {
        if (current.classList.contains(parentClassName)) {
            return current
        }
        current = current.parentNode;
    }
    return false
}