import { isObject, isReservedTag } from '../utils'

function createComponent(vm, tag, data, children, key, Ctor) {

    if (isObject(Ctor)) {
        Ctor =  vm.$options._base.extend(Ctor)
    }
    data.hook = {
        init(vnode) {
            let child = vnode.componentInstance = new Ctor({})
            child.$mount()
        },
        prepatch() {},
        insert() {},
        destroy() {}
    }

    let componentVnode = vnode(vm, tag, data, undefined, key, undefined, { Ctor, children })
    return componentVnode
}

export function createElement(vm, tag, data = {}, ...children) {
    if (!isReservedTag(tag)) {
        let Ctor = vm.$options.components[tag]
        return createComponent(vm, tag, data, children, data.key, Ctor)
    }

    return vnode(vm, tag, data, children, data.key, undefined)
}

export function createText(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text)
}

export function isSameVnode(oldVnode, newVnode) {
    return (newVnode.tag === oldVnode.tag) && (newVnode.key === oldVnode.key)
}

function vnode(vm, tag, data, children, key, text, componentOptions) {
    return {
        vm,
        tag,
        data,
        children,
        key,
        text,
        componentOptions
    }
}