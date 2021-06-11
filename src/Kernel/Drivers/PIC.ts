import { DriverBase } from '../Driver'
import { outb } from '../IO'

const PIC1: u16 = 0x20
const PIC2: u16 = 0xa0
const PIC1_COMMAND: u16 = PIC1
const PIC1_DATA: u16 = PIC1 + 1
const PIC2_COMMAND: u16 = PIC2
const PIC2_DATA: u16 = PIC2 + 1

const ICW1_ICW4: u8 = 0x01
const ICW1_INIT: u8 = 0x10
const ICW4_8086: u8 = 0x01
const PIC_EOI: u8 = 0x20

@Driver('x86.pic')
@RDepends('target.bootup')
export class PIC extends DriverBase {
    constructor() {
        super()
        outb(PIC1_COMMAND, ICW1_INIT | ICW1_ICW4) // starts the initialization sequence (in cascade mode)
        outb(PIC2_COMMAND, ICW1_INIT | ICW1_ICW4)
        outb(PIC1_DATA, 0x20) // ICW2: Master PIC vector offset
        outb(PIC2_DATA, 0x28) // ICW2: Slave PIC vector offset
        outb(PIC1_DATA, 4) // ICW3: tell Master PIC that there is a slave PIC at IRQ2 (0000 0100)
        outb(PIC2_DATA, 2) // ICW3: tell Slave PIC its cascade identity (0000 0010)
        outb(PIC1_DATA, ICW4_8086)
        outb(PIC2_DATA, ICW4_8086)
        outb(PIC1_DATA, 0)
        outb(PIC2_DATA, 0)
    }
    eoi(irq: u8): void {
        if (irq >= 8) outb(PIC2_COMMAND, PIC_EOI)
        outb(PIC1_COMMAND, PIC_EOI)
    }
    static the(): PIC {
        return _implthe()
    }
}
