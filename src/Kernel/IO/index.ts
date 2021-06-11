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

export function physpeek8(addr: u64): u8 { return peek8(addr + 0xffff800000000000) }
export function physpeek16(addr: u64): u16 { return peek16(addr + 0xffff800000000000) }
export function physpeek32(addr: u64): u32 { return peek32(addr + 0xffff800000000000) }
export function physpeek64(addr: u64): u64 { return peek64(addr + 0xffff800000000000) }
export function physpoke8(addr: u64, value: u8): void { poke8(addr + 0xffff800000000000, value) }
export function physpoke16(addr: u64, value: u16): void { poke16(addr + 0xffff800000000000, value) }
export function physpoke32(addr: u64, value: u32): void { poke32(addr + 0xffff800000000000, value) }
export function physpoke64(addr: u64, value: u64): void { poke64(addr + 0xffff800000000000, value) }

export declare function loadGDT(ptr: u64): void
export declare function loadIDT(ptr: u64): void
export declare function updatetss(): void

export enum Int3Task {
    TASK_NONE = 0,
    TASK_SETUP_REGS = 1,
    TASK_SWITCH_REGS = 2,
}
export declare function getisr(isr: u32): u64
export declare function int3(): void
export declare function cr3(): u64
export declare function flushtlb(): void
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
export function ptr(s: u64): string {
    return '0x' + s.toString(16).padStart(16, '0')
}
export function bytefmt(s: u64): string {
    return '0x' + s.toString(16).padStart(2, '0')
}