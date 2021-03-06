import Dep from './dep'
import { queueWatcher } from './scheduler'

let id = 0
class Watcher {
    constructor(vm, fn, cb, options) {
        this.vm = vm
        this.fn = fn
        this.cb = cb
        this.options = options
        this.id = id++
        this.depIds = new Set()
        this.getter = fn
        this.deps = []
        this.get()
    }

    addDep(dep) {
        let depId = dep.id
        if (!this.depIds.has(depId)) {
            this.depIds.add(depId)
            this.deps.push(dep)
            dep.subs.push(this)
        }
    }

    get() {
        Dep.target = this
        this.getter()
        Dep.target = null
    }

    update() {
        queueWatcher(this)
    }

    run() {
        console.log('渲染触发')
        this.get()
    }
}

export default Watcher