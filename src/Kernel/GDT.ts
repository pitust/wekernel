import { free, loadGDT, malloc, poke16, poke64, puts } from './IO'

export function initGDT(): void {
    const gdtr = malloc(10)
    const gdt = malloc(9 * 8)
    poke16(gdtr, 9 * 8)
    poke64(gdtr + 2, gdt)
    poke64(gdt + 0 * 8, 0x0000000000000000) // null
    poke64(gdt + 1 * 8, 0x00009a000000ffff) // code16
    poke64(gdt + 2 * 8, 0x000093000000ffff) // data16
    poke64(gdt + 3 * 8, 0x00cf9a000000ffff) // code32
    poke64(gdt + 4 * 8, 0x00cf93000000ffff) // data32
    poke64(gdt + 5 * 8, 0x00af9b000000ffff) // code64
    poke64(gdt + 6 * 8, 0x00af93000000ffff) // data64
    poke64(gdt + 7 * 8, 0x00affb000000ffff) // usrc64
    poke64(gdt + 8 * 8, 0x00affb000000ffff) // usrd64
    loadGDT(gdtr)
    free(gdtr)

    puts('[+] GDT: Loaded gdt at 0x' + gdt.toString(16).padStart(16, '0'))
}

export const GDT_NULL = 0 * 8
export const GDT_CODE16 = 1 * 8
export const GDT_DATA16 = 2 * 8
export const GDT_CODE32 = 3 * 8
export const GDT_DATA32 = 4 * 8
export const GDT_CODE64 = 5 * 8
export const GDT_DATA64 = 6 * 8
export const GDT_USRC64 = 7 * 8
export const GDT_USRD64 = 8 * 8
