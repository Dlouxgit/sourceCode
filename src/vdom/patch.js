import { isSameVnode } from "."

export function patch(oldVnode, vnode) {
    if (oldVnode.nodeType) {
        const elm = createElm(vnode) // 创造真实节点
        const parentNode = oldVnode.parentNode
        parentNode.insertBefore(elm, oldVnode.nextSibling)
        parentNode.removeChild(oldVnode)
        return elm
    } else {
        if (!isSameVnode(oldVnode, vnode)) {
            createElm(vnode)
            return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el)
        }
        let el = vnode.el = oldVnode.el
        // 文本节点
        if (!oldVnode.tag) {
            if (!oldVnode.text !== vnode.text) {
                return el.textContent = vnode.text
            }
        }

        updateProperties(vnode, oldVnode.data)
        // 元素节点
        let oldChildren = oldVnode.children || []
        let newChildren = vnode.children || []
        if (oldChildren.length > 0 && newChildren.length === 0) { // 老节点存在子节点，新节点无
            el.innerHTML = ''
        } else if (newChildren.length > 0 && oldChildren.length === 0) { // 新节点存在子节点，老节点无
            newChildren.forEach(child => el.appendChild(createElm(child)))
        } else {
            updateChildren(el, oldChildren, newChildren)
        }
    }
}

// diff O(n)
function updateChildren(el, oldChildren, newChildren) {
    let oldStartIndex = 0
    let oldStartVnode = oldChildren[0]
    let oldEndIndex = oldChildren.length - 1
    let oldEndVnode = oldChildren[oldEndIndex]

    let newStartIndex = 0
    let newStartVnode = newChildren[0]
    let newEndIndex = newChildren.length - 1
    let newEndVnode = newChildren[newEndIndex]

    function makeKeyByIndex() {
        let map = {}
        children.forEach((item, index) => {
            map[item.key] = index
        })
        return map
    }

    let mapping = makeKeyByIndex(oldChildren)

    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        if (!oldStartVnode) {
            oldStartVnode = oldChildren[++oldStartIndex]
        } else if (!oldEndVnode) {
            oldEndVnode = oldChildren[--oldEndIndex]
        } else if (isSameVnode(oldStartVnode, newStartVnode)) {
            patch(oldStartVnode, newStartVnode)
            oldStartVnode = oldChildren[++oldStartIndex]
            newStartVnode = newChildren[++newStartIndex]
        } else if (isSameVnode(oldEndVnode, newEndVnode)) {
            patch(oldEndVnode, newEndVnode)
            oldEndVnode = oldChildren[--oldEndIndex]
            newEndVnode = newChildren[--newEndIndex]
        } else if (isSameVnode(oldStartVnode, newEndVnode)) {
            patch(oldStartVnode, newEndVnode)
            el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling)
            oldStartVnode = oldChildren[++oldStartIndex]
            newEndVnode = newChildren[--newEndIndex]
        } else if (isSameVnode(oldEndVnode, newStartVnode)) {
            patch(oldEndVnode, newStartVnode)
            el.insertBefore(oldEndVnode.el, oldStartVnode.el)
            oldEndVnode = oldChildren[--oldEndIndex]
            newStartVnode = newChildren[++newStartIndex]
        } else {
            let moveIndex = mapping[newStartVnode.key]
            if (moveIndex == null) {
                el.insertBefore(oldStartVnode.el, createElm(newStartVnode))
            } else {
                let moveVnode = oldChildren[moveIndex]
                el.insertBefore(moveVnode.el, oldStartVnode.el)
                patch(moveVnode, newStartVnode)
                oldChildren[moveIndex] = undefined
            }
            newStartVnode = newChildren[++newStartIndex]
        }
    }
    // 新的多，插入
    if (newStartIndex <= newEndIndex) {
        // 查看当前节点的下一个元素是否存在(是否为 null)，存在就插入到下一个元素之前(inserBefore)，否则插入到最后(appendChild)
        const anchor = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].el
        for (let i = newStartIndex; i < newEndIndex; i++) {
            // insertBefore(el, null) 相当于 appendChild
            // exmple
            // ABCD 老
            // FEABCD 新
            // F 插入到 A 前，之后 E 插入到 A 前，因此是 FE ABCD
            el.insertBefore(createElm(newChildren[i]), anchor)
        }
    }
    // 老的多，删除
    if (oldStartIndex <= oldEndIndex) {
        for (let i = oldStartIndex; i <= oldEndIndex; i++) {
            let child = oldChildren[i]
            // 由于乱序比对时，移动了 oldChildren 中的节点后，原来的节点位置会变成 undefined，此时的这个节点是不应该被移除的，因为它已经被摆放到了正确的位置上
            child && el.removeChild(child.el)
        }
    }
}

function createElm(vnode) {
    let { tag, data, children, text, vm } = vnode
    if (typeof tag === 'string') {
        vnode.el = document.createElement(tag)
        updateProperties(vnode)
        children.forEach(child => {
            vnode.el.appendChild(createElm(child))
        })
    } else {
        // text 没有 tag
        vnode.el = document.createTextNode(text)
    }
    return vnode.el
}

function updateProperties(vnode, oldProps = {}) {
    let newProps = vnode.data || {}
    let el = vnode.el

    let newStyle = newProps.style || {}
    let oldStyle = oldProps.style || {}

    for (let key in oldStyle) {
        if (!newStyle[key]) {
            el.style[key] = ''
        }
    }

    for (let key in newProps) {
        if (key === 'style') {
            for (let key in newStyle) {
                el.style[key] = newStyle[key]
            }
        } else {
            el.setAttribute(key, newProps[key])
        }
    }
    for (let key in oldProps) {
        if (!newProps[key]) {
            el.removeArttribute(key)
        }
    }
}