let id = 0
class Dep {
    constructor(vm) {
        this.vm = vm
        this.id = id++
        this.subs = []
    }

    depend() {
        Dep.target.addDep(this)
    }

    addSub(watcher) {
        this.subs.push(watcher)
    }

    notify() {
        this.subs.forEach(item => item.update())
    }
}

Dep.target = null

export default Dep