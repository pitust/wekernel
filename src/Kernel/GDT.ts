import { free, loadGDT, malloc, poke16, poke64, puts, updatetss } from './IO'

function bits(shiftup: u64, shiftdown: u64, mask: u64, val: u64): u64 {
    return ((val >> (shiftdown - mask)) & ((1 << mask) - 1)) << shiftup;
}


export function initGDT(): void {
    const intstack = malloc(0x2000)

    const tss = malloc(0x6b)
    poke16(tss + 0x66, 13)
    poke64(tss + 0x04, intstack)

    puts('[+] TSS: Loaded tss at 0x' + tss.toString(16).padStart(16, '0'))

    const gdtr = malloc(10)
    const gdt = malloc(0x58)
    poke16(gdtr, 0x58)
    poke64(gdtr + 2, gdt)
    poke64(gdt + 0x00, 0x0000000000000000) // null
    poke64(gdt + 0x08, 0x00009a000000ffff) // code16
    poke64(gdt + 0x10, 0x000093000000ffff) // data16
    poke64(gdt + 0x18, 0x00cf9a000000ffff) // code32
    poke64(gdt + 0x20, 0x00cf93000000ffff) // data32
    poke64(gdt + 0x28, 0x00af9b000000ffff) // code64
    poke64(gdt + 0x30, 0x00af93000000ffff) // data64
    poke64(gdt + 0x38, 0x00affb000000ffff) // usrc64
    poke64(gdt + 0x40, 0x00aff3000000ffff) // usrd64
    poke64(
        gdt + 0x48,
        bits(16, 24, 24, tss) | bits(56, 32, 8, tss) | (103 & 0xff) | ((<u64>0b1001) << 40) | ((<u64>1) << 47)
    ) // tsse64
    poke64(gdt + 0x50, tss >> 32)
    loadGDT(gdtr)
    free(gdtr)

    updatetss()

    puts('[+] GDT: Loaded gdt at 0x' + gdt.toString(16).padStart(16, '0'))
}

export const GDT_NULL = 0x00
export const GDT_CODE16 = 0x08
export const GDT_DATA16 = 0x10
export const GDT_CODE32 = 0x18
export const GDT_DATA32 = 0x20
export const GDT_CODE64 = 0x28
export const GDT_DATA64 = 0x30
export const GDT_USRC64 = 0x38
export const GDT_USRD64 = 0x40
export const GDT_TSSE64 = 0x48