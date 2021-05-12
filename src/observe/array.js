let oldArrayPrototype = Array.prototype

export let arrayMethods = Object.create(oldArrayPrototype)

let methods = [
    'push',
    'shift',
    'pop',
    'unshift',
    'reverse',
    'sort',
    'splice'
]

methods.forEach(method => {
    arrayMethods[method] = function (...args) {
        oldArrayPrototype[method].call(this, ...args)

        let inserted = null
        let ob = this.__ob__
        switch (method) {
            case 'splice':
                inserted =  args.slice(2)
                break
            case 'push':
            case 'shift':
                inserted = args
                break
        }
        if (inserted) ob.observeArray(inserted)
    }
})