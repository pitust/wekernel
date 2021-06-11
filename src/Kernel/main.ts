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
    peek64,
    peek8,
    poke16,
    poke32,
    poke64,
    poke8,
    puts,
    setInt3HandlerTask,
} from './IO'

import './Autogen/DriverImports'
import { runDrivers } from './Driver'
import { GDT_CODE64, initGDT } from './GDT'
import { TAG_CMDLINE } from './Stivale2'
import { parseCmdline } from './Cmdline'
import { Regs } from './Sched/Regs'
import { PIC } from './Drivers/PIC'

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

runDrivers()

const mem = malloc(2)
const stack = malloc(4096)
poke16(mem, 0xfeeb)
setInt3HandlerTask(Int3Task.TASK_SETUP_REGS)
int3()
const regs = Regs.fromMemory(getRegSwappedSlotAddr())
regs.rip = mem
regs.rsp = stack + 4096
regs.flags |= /* IF */ 0x200
regs.toMemory(getRegSwappedSlotAddr())
while (1) {
    setInt3HandlerTask(Int3Task.TASK_SWITCH_REGS)
    int3()
    const isr = peek8(getRegSwappedSlotAddr() + 0xb0)

    PIC.the().eoi(isr - 0x20)
}
