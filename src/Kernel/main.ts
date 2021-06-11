import {
    free,
    getisr,
    getRegSwappedSlotAddr,
    getStivale2Header,
    int3,
    Int3Task,
    loadGDT,
    loadIDT,
    malloc,
    outb,
    page,
    panic,
    peek64,
    peek8,
    poke16,
    poke32,
    poke64,
    poke8,
    ptr,
    puts,
    setInt3HandlerTask,
} from './IO'

import './Autogen/DriverImports'
import { runDrivers } from './Driver'
import { GDT_CODE64, GDT_USRC64, GDT_USRD64, initGDT } from './GDT'
import { TAG_CMDLINE } from './Stivale2'
import { parseCmdline } from './Cmdline'
import { Regs } from './Sched/Regs'
import { PIC } from './Drivers/PIC'
import { ArrayBufferVMObject } from './Memory/VMObject'

puts('[+] WeKernel: booting! please wait...')

let stivale2hdr: u64 = getStivale2Header()
let loader = '',
    version = ''

for (let i = 0; i < 64; i++) {
    const byte: u8 = peek8(stivale2hdr + i)
    if (byte) loader += String.fromCharCode(byte)
}
for (let i = 0; i < 64; i++) {
    const byte: u8 = peek8(stivale2hdr + 64 + i)
    if (byte) version += String.fromCharCode(byte)
}

puts('[+] Bootloader: ' + loader + ' ' + version)

initGDT()

const idt = page()

for (let i = 0; i < 256; i++) {
    const isr = getisr(i)
    poke16(i * 16 + 0 + idt, <u16>isr)
    poke16(i * 16 + 2 + idt, <u16>GDT_CODE64)
    poke8(i * 16 + 4 + idt, <u8>0)
    poke8(i * 16 + 5 + idt, <u8>0x8e)
    poke16(i * 16 + 6 + idt, <u16>(isr >> 16))
    poke32(i * 16 + 8 + idt, <u32>(isr >> 32))
    poke32(i * 16 + 12 + idt, <u32>0)
}
const idtr = malloc(10)
poke16(idtr, 4096)
poke64(idtr + 2, idt)
loadIDT(idtr)
free(idtr)

puts('[+] IDT: Loaded idt at 0x' + idt.toString(16).padStart(16, '0'))

let tag = peek64(stivale2hdr + 128)
while (tag) {
    const id = peek64(tag)

    if (id == TAG_CMDLINE) {
        let ptr = peek64(tag + 16)
        let cmdline = ''
        while (peek8(ptr)) cmdline += String.fromCharCode(peek8(ptr++))
        puts('[+] Command line: ' + cmdline)
        parseCmdline(cmdline)
    }
    tag = peek64(tag + 8)
}

function hptr(s: u64): string {
    return `${s == 0 ? '' : '\x1b[0;1;31m'}0x${s.toString(16).padStart(16, '0')}\x1b[0m`
}
function prnint(isr: u64): string {
    if (isr == 0x0e) return 'Page fault'.padEnd(18, ' ')
    if (isr == 0x20) return 'Timer interrupt'.padEnd(18, ' ')
    return `Unknown ISR ${isr.toString(16)}`.padEnd(18, ' ')
}

runDrivers()

const code = new Uint8Array(4096)
code[0] = 0x0f
code[1] = 0x0b

const vmo = new ArrayBufferVMObject(code.buffer)
vmo.map(0, 0x800_0000)
const stack = malloc(4096)
setInt3HandlerTask(Int3Task.TASK_SETUP_REGS)
int3()
const regs = new Regs()
regs.rip = 0x800_0000
regs.rsp = stack + 4096
regs.rflags |= /* IF */ 0x200
regs.ss = GDT_USRD64 | 3
regs.cs = GDT_USRC64 | 3
regs.toMemory(getRegSwappedSlotAddr())
while (1) {
    setInt3HandlerTask(Int3Task.TASK_SWITCH_REGS)
    int3()
    const isr = peek8(getRegSwappedSlotAddr() + 0xa8)
    if (isr >= 0x20) {
        PIC.the().eoi(isr - 0x20)
    } else {
        const r: Regs = Regs.fromMemory(getRegSwappedSlotAddr())
        // if ((r.cs & 3) == 3) {
            puts(' === Kernel panic: something fucked up badly! ===')
            puts(`  RAX ${hptr(r.rax)}  RBX ${hptr(r.rbx)}`)
            puts(`  RCX ${hptr(r.rcx)}  RDX ${hptr(r.rdx)}`)
            puts(`  RDI ${hptr(r.rdi)}  RSI ${hptr(r.rsi)}`)
            puts(`  RBP ${hptr(r.rbp)}  RSP ${hptr(r.rsp)}`)
            puts(`  R8  ${hptr(r.r8)}  R9  ${hptr(r.r9)}`)
            puts(`  R10 ${hptr(r.r10)}  R11 ${hptr(r.r11)}`)
            puts(`  R12 ${hptr(r.r12)}  R13 ${hptr(r.r13)}`)
            puts(`  R14 ${hptr(r.r14)}  R15 ${hptr(r.r15)}`)
            puts(`  RIP ${hptr(r.rip)}  RFL ${hptr(r.rflags)}`)
            puts(`  CS  ${hptr(r.cs)}  SS  ${hptr(r.ss)}`)
            puts(`  INT \x1b[0;1;32m${prnint(isr)}\x1b[0m  ERR ${hptr(r.error)}`)
            while (1) {}
        // }
    }
}
