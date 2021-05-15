export function isFunction(val) {
    return typeof val === 'function'
}

export function isObject(val) {
    return typeof val === 'object' && val !== null
}

let callbacks = []
let waiting = false

function flushCallBacks() {
    callbacks.forEach(fn => fn())
    callbacks = []
    waiting = false
}

export function nextTick(fn) {
    callbacks.push(fn)
    if (!waiting) {
        waiting = true
        Promise.resolve().then(flushCallBacks)
    }
    return 
}

export let isArray = Array.isArray