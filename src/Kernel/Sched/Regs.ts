import { int3, peek64, poke64 } from '../IO'

export class Regs {
    constructor(
        public r15: u64 = 0,
        public r14: u64 = 0,
        public r13: u64 = 0,
        public r12: u64 = 0,
        public r11: u64 = 0,
        public r10: u64 = 0,
        public r9: u64 = 0,
        public r8: u64 = 0,
        public rdi: u64 = 0,
        public rsi: u64 = 0,
        public rdx: u64 = 0,
        public rcx: u64 = 0,
        public rbx: u64 = 0,
        public rax: u64 = 0,
        public rbp: u64 = 0,
        public error: u64 = 0,
        public rip: u64 = 0,
        public cs: u64 = 0,
        public rflags: u64 = 0,
        public rsp: u64 = 0,
        public ss: u64 = 0
    ) {}
    static fromMemory(addr: u64): Regs {
        return new Regs(
            peek64(addr + 0x0),
            peek64(addr + 0x8),
            peek64(addr + 0x10),
            peek64(addr + 0x18),
            peek64(addr + 0x20),
            peek64(addr + 0x28),
            peek64(addr + 0x30),
            peek64(addr + 0x38),
            peek64(addr + 0x40),
            peek64(addr + 0x48),
            peek64(addr + 0x50),
            peek64(addr + 0x58),
            peek64(addr + 0x60),
            peek64(addr + 0x68),
            peek64(addr + 0x70),
            peek64(addr + 0x78),
            peek64(addr + 0x80),
            peek64(addr + 0x88),
            peek64(addr + 0x90),
            peek64(addr + 0x98),
            peek64(addr + 0xa0)
        )
    }
    toMemory(addr: u64): void {
        poke64(addr + 0x0, this.r15)
        poke64(addr + 0x8, this.r14)
        poke64(addr + 0x10, this.r13)
        poke64(addr + 0x18, this.r12)
        poke64(addr + 0x20, this.r11)
        poke64(addr + 0x28, this.r10)
        poke64(addr + 0x30, this.r9)
        poke64(addr + 0x38, this.r8)
        poke64(addr + 0x40, this.rdi)
        poke64(addr + 0x48, this.rsi)
        poke64(addr + 0x50, this.rdx)
        poke64(addr + 0x58, this.rcx)
        poke64(addr + 0x60, this.rbx)
        poke64(addr + 0x68, this.rax)
        poke64(addr + 0x70, this.rbp)
        poke64(addr + 0x78, this.error)
        poke64(addr + 0x80, this.rip)
        poke64(addr + 0x88, this.cs)
        poke64(addr + 0x90, this.rflags)
        poke64(addr + 0x98, this.rsp)
        poke64(addr + 0xa0, this.ss)
    }
}
