import { nextTick } from "../utils"

let queue = []
let has = {}

function flushSchedulerQueue() {
    queue.forEach(watcher => watcher.run())
    queue = []
    has = {}
    pending = false
}

let pending = false
export function queueWatcher(watcher) {
    let id = watcher.id
    if (has[id] == null) { // 0 == null toBeFalsy(),  0 == undefined toBeFalsy(),  null == undefined toBeTruthy()
        has[id] = true
        queue.push(watcher)
        if (!pending) {
            nextTick(flushSchedulerQueue)
            pending = true
        }
    }
}