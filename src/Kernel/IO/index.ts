export declare function inb(port: u16): u8
export declare function inw(port: u16): u16
export declare function inl(port: u16): u32

export declare function outb(port: u16, value: u8): void
export declare function outw(port: u16, value: u16): void
export declare function outl(port: u16, value: u32): void

export declare function peek8(addr: u64): u8
export declare function peek16(addr: u64): u16
export declare function peek32(addr: u64): u32
export declare function peek64(addr: u64): u64

export declare function poke8(addr: u64, value: u8): void
export declare function poke16(addr: u64, value: u16): void
export declare function poke32(addr: u64, value: u32): void
export declare function poke64(addr: u64, value: u64): void

export declare function loadGDT(ptr: u64): void
export declare function loadIDT(ptr: u64): void

export enum Int3Task {
    TASK_NONE = 0,
    TASK_SETUP_REGS = 1,
    TASK_SWITCH_REGS = 2,
}
export declare function getisr(isr: u32): u64
export declare function int3(): void
export declare function setInt3HandlerTask(task: Int3Task): void
export declare function getRegInt3SlotAddr(): u64
export declare function getRegSwappedSlotAddr(): u64 // the swapped slot

export declare function malloc(size: u64): u64
export declare function free(ptr: u64): void

export declare function page(): u64
export declare function freepage(p: u64, count: u64): void

export declare function getStivale2Header(): u64
export declare function putchar(addr: u8): void

export function puts(s: string): void {
    putsnnl(s)
    putchar(<u8>'\n'.charCodeAt(0))
    putchar(0)
}

export function putsnnl(s: string): void {
    const ab = String.UTF8.encode(s)
    const u8a = Uint8Array.wrap(ab)
    for (let i = 0; i < u8a.length; i++) putchar(u8a[i])
}
export function panic(s: string): never {
    puts('=== Kernel panic ===')
    puts(s)
    while (true) {}
}
