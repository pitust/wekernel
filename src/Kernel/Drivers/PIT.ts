import { DriverBase } from '../Driver'
import { outb } from '../IO'

const PIT_DATA0: u16 = 0x40
const PIT_DATA1: u16 = 0x40
const PIT_DATA2: u16 = 0x40
const PIT_CMD: u16 = 0x43

@Driver('x86.pic')
@RDepends('target.bootup')
export class PIT extends DriverBase {
    constructor() {
        super()
        outb(PIT_CMD, 0x34)
        outb(PIT_DATA0, <u8>300)
        outb(PIT_DATA0, <u8>(300 >> 8))
    }
    static the(): PIT {
        return _implthe()
    }
}
