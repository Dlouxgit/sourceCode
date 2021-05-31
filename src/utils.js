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


let strats = {}

let lifeCycle = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted'
]
lifeCycle.forEach(hook => {
    strats[hook] = function (parentVal, childVal) {
        if (childVal) {
            if (parentVal) {
                return parentVal.concat(childVal)
            } else { // 最开始是 {} 和父合并，因此父亲的 key 值一定会走这里变成数组，因此上面的逻辑可以用 concat
                if (isArray(childVal)) {
                    return childVal
                } else {
                    return [childVal]
                }
            }
        } else {
            return [parentVal]
        }
    }
})

strats.components = function (parentVal, childVal) {
    let res = Object.create(parentVal)
    if (childVal) {
        for  (let key in childVal) {
            res[key] = childVal[key]
        }
    }
    return res
}

export function mergeOptions(parentVal, childVal) {
    console.log('parentVal, childVal', parentVal, childVal)
    const options = {}

    for (let key in parentVal) {
        mergeFileds(key)
    }

    for (let key in childVal) {
        if (!parentVal.hasOwnProperty(key)) {
            mergeFileds(key)
        }
    }

    function mergeFileds(key) {
        let strat = strats[key]
        if (strat) {
            options[key] = strat(parentVal[key], childVal[key])
        } else {
            options[key] = childVal[key] || parentVal[key]
        }
    }

    return options
}

function makeMap(str) {
    let tagList = str.split(',')
    return function(tagNmae) {
        return tagList.includes(tagNmae)
    }
}

export const isReservedTag = makeMap('div,span,template,p,script,slot,a,image,text,view,button')