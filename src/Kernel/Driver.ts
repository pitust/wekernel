import { boolean, stringopt } from './Cmdline'
import { panic, puts } from './IO'

class PendingDriver {
    constructor(public deps: Set<string>, public name: string, public id: i64, public create: () => DriverBase) {}
}
class Dep {
    constructor(public needed: string, public touse: string) {}
}
const driverRegistry = new Set<DriverBase>()
let enqueuedDrivers = new Set<PendingDriver>()
let pendingDrivers = new Set<PendingDriver>()
let notReadyDrivers = new Set<PendingDriver>()
let rdeps = new Set<Dep>()
let fires: Dep[] = []
let ids = new Map<i64, DriverBase>()

export function isDriverLoadedByID(id: u64): bool {
    return ids.has(id)
}
export function driverUnload(id: u64): void {
    ids.delete(id)
}

export abstract class DriverBase {
    static register(
        name: string,
        arr: string[],
        rarr: string[],
        canfire: string[],
        id: i64,
        creat: () => DriverBase
    ): void {
        puts('==== Driver: ' + name)
        if (arr.length) puts(' => depends on:')
        const depset = new Set<string>()
        for (let i = 0; i < arr.length; i++) {
            puts('   - ' + arr[i])
            depset.add(arr[i])
        }
        for (let i = 0; i < canfire.length; i++) {
            fires.push(new Dep(name, canfire[i]))
        }
        if (rarr.length) puts(' => declares reverse dependencies:')
        for (let i = 0; i < rarr.length; i++) {
            puts('   - ' + rarr[i])
            rdeps.add(new Dep(name, rarr[i]))
        }

        enqueuedDrivers.add(new PendingDriver(depset, name, id, creat))
    }
    static _getthe(idx: i64, dbgname: string): DriverBase {
        if (ids.has(idx)) return ids.get(idx)
        panic('Unable to get driver ' + dbgname + ', because it was not yet initialized.')
        while (1) {}
    }
}

@Driver('target.bootup')
class BootupTarget extends DriverBase {
    static the(): BootupTarget {
        return _implthe()
    }
    static getID(): u64 {
        return _implthe()
    }
}
class FakeDriver extends DriverBase {}

let ifires: string[] = []

export function fire(tgd: string): void {
    ifires.push(tgd)
}

export function runDrivers(): void {
    if (enqueuedDrivers.size) {
        const printgraph = ['drivergraph', 'all'].includes(stringopt('debug', 'none'))
        if (printgraph) {
            puts('=========== Driver graph ===========')
            puts('digraph {')
        }
        const v = enqueuedDrivers.values()
        enqueuedDrivers = new Set<PendingDriver>()
        for (let i = 0; i < v.length; i++) {
            const u = rdeps.values()
            for (let j = 0; j < u.length; j++) {
                if (u[j].touse == v[i].name) v[i].deps.add(u[j].needed)
            }
            if (v[i].deps.size) {
                notReadyDrivers.add(v[i])
            } else {
                pendingDrivers.add(v[i])
            }
        }
        if (printgraph) {
            for (let i = 0; i < v.length; i++) {
                const deps = v[i].deps.values()
                puts('    "' + v[i].name + '"')
                for (let j = 0; j < deps.length; j++) {
                    puts('    "' + deps[j] + '" -> "' + v[i].name + '"')
                }
            }
            for (let i = 0; i < fires.length; i++) {
                puts('    "' + fires[i].needed + '" -> "' + fires[i].touse + '" [label="Can fire"]')
            }
        }
        if (printgraph) {
            puts('}')
            puts('=========== End driver graph ===========')
        }
    }

    while (pendingDrivers.size) {
        let newPendingDrivers = new Set<PendingDriver>()
        let stillNotReadyDrivers = new Set<PendingDriver>()
        {
            const v = pendingDrivers.values()
            for (let i = 0; i < v.length; i++) {
                const driver = v[i]
                ifires = []
                puts('run ' + v[i].name)
                const drvi = driver.create()
                driverRegistry.add(drvi)
                ids.set(driver.id, drvi)
                for (let i = 0; i < ifires.length; i++) {
                    pendingDrivers.add(new PendingDriver(new Set<string>(), ifires[i], -1, () => new FakeDriver()))
                }
            }
        }
        {
            const v = notReadyDrivers.values()
            for (let i = 0; i < v.length; i++) {
                const driver = v[i]
                {
                    const u = pendingDrivers.values()
                    for (let i = 0; i < u.length; i++) {
                        driver.deps.delete(u[i].name)
                    }
                }
                if (driver.deps.size == 0) {
                    newPendingDrivers.add(driver)
                } else {
                    stillNotReadyDrivers.add(driver)
                }
            }
        }
        pendingDrivers = newPendingDrivers
        notReadyDrivers = stillNotReadyDrivers
    }
    if (notReadyDrivers.size) {
        puts('[-] Warning: unable to initialise drivers:')
        const v = notReadyDrivers.values()
        let fail = false
        for (let i = 0; i < v.length; i++) {
            puts(' - ' + v[i].name)
            const deps = v[i].deps.values()
            for (let i = 0; i < deps.length; i++) {
                puts('  ' + (i == deps.length - 1 ? '\\' : '+') + '-- ' + deps[i])
            }
            if (v[i].id == BootupTarget.getID()) fail = true
        }
        if (fail) panic('Unable to boot up!')
    }
    puts('done')
}
