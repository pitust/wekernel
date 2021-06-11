import { DriverBase, driverUnload, fire, isDriverLoadedByID } from '../Driver'
import { panic, peek32, peek64, peek8, puts } from '../IO'
import { TAG_RSDP } from '../Stivale2'
import { StivaleTags } from './StivaleTags'

@Driver('stivale2.rsdp')
@Depends('loader.stivale2')
@Fires('target.rsdp')
class Stivale2RSDP extends DriverBase {
    private rsdp: u64 = 0
    constructor() {
        super()
        if (StivaleTags.the().has(TAG_RSDP)) {
            this.rsdp = peek64(StivaleTags.the().get(TAG_RSDP) + 16)
            fire('target.rsdp')
        } else {
            driverUnload(Stivale2RSDP.getID())
        }
    }
    get(): u64 {
        return this.rsdp
    }
    static the(): Stivale2RSDP {
        return _implthe()
    }
    static getID(): u64 {
        return _implthe()
    }
}

@Driver('generic.rsdp')
@Depends('target.rsdp')
export class RSDP extends DriverBase {
    constructor() {
        super()
    }
    rsdp(): u64 {
        if (isDriverLoadedByID(Stivale2RSDP.getID())) return Stivale2RSDP.the().get()
        panic('Broken target: RSDP not provided')
        while (1) {}
    }
    rsdt(): u64 {
        return 0xffff800000000000 + <u64>peek32(this.rsdp() + 16)
    }
    static the(): RSDP {
        return _implthe()
    }
}

@Driver('generic.acpi_tables')
@Depends('generic.rsdp')
export class ACPITables extends DriverBase {
    private tables: Map<string, u64> = new Map()
    constructor() {
        super()
        const entcount = (peek32(RSDP.the().rsdt() + 4) - 36) / 4
        for (let i = <u32>0; i < entcount; i++) {
            const addr = 0xffff800000000000 + <u64>peek32(i * 4 + 36 + RSDP.the().rsdt())
            let s = String.fromCharCodes([peek8(addr + 0), peek8(addr + 1), peek8(addr + 2), peek8(addr + 3)])
            this.tables.set(s, addr)
        }
    }
    table(s: string): u64 {
        if (this.tables.has(s)) return this.tables.get(s)
        return 0
    }
    static the(): RSDP {
        return _implthe()
    }
}
