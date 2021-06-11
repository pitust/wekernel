import { freepage, page, panic } from "../IO"
import { VMPerms, vm_map } from "./Map"

export abstract class VMObject {
    abstract size(): u64;
    abstract map(offset: u64, to: u64): void;
    abstract ref(): void;
    abstract unref(): void;
}
export class ArrayBufferVMObject extends VMObject {
    private mapped: Map<u64, u64> = new Map()
    private rc: u64 = 1;
    constructor(public buf: ArrayBuffer) {
        super()
        if (buf.byteLength & 0xfff || !buf.byteLength) panic('Invalid ArrayBufferVMObject created')
    }
    size(): u64 {
        return <u64>this.buf.byteLength
    }
    map(offset: u64, to: u64): void {
        let phys: u64;
        if (this.mapped.has(offset)) {
            phys = this.mapped.get(offset)
        } else {
            phys = page()
        }
        vm_map(phys, to, VMPerms.USER | VMPerms.PRESENT)
    }
    ref(): void {
        this.rc += 1;
    }
    unref(): void {
        this.rc -= 1;
        if (this.rc == 0) {
            let v = this.mapped.values()
            for (let i = 0;i < v.length;i++) {
                freepage(v[i], 1)
            }
            this.mapped = new Map()
        }
    }
}