export function createElement(vm, tag, data = {}, ...children) {
    return vnode(vm, tag, data, children, data.key, undefined)
}

export function createText(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text)
}

export function isSameVnode(oldVnode, newVnode) {
    return (newVnode.tag === oldVnode.tag) && (newVnode.key === oldVnode.key)
}

function vnode(vm, tag, data, children, key, text) {
    return {
        vm,
        tag,
        data,
        children,
        key,
        text
    }
}