import { GDT_USRC64, GDT_USRD64 } from '../GDT'
import { Process } from './Process'
import { Regs } from './Regs'

export class Thread {
    constructor(public reg: Regs,public proccess: Process) {}
}
