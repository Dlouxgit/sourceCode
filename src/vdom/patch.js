export function patch(el, vnode) {
    const elm = createElm(vnode) // 创造真实节点
    const parentNode = el.parentNode
    parentNode.insertBefore(elm, el.nextSibling)
    parentNode.removeChild(el)
    return elm
}

function createElm(vnode) {
    let { tag, data, children, text, vm } = vnode
    if (typeof tag === 'string') {
        vnode.el = document.createElement(tag)
        updateProperties(vnode.el, data)
        children.forEach(child => {
            vnode.el.appendChild(createElm(child))
        })
    } else {
        // text 没有 tag
        vnode.el = document.createTextNode(text)
    }
    return vnode.el
}

function updateProperties(el, props = {}) {
    for (let key in props) {
        el.setAttribute(key, props[key])
    }
}