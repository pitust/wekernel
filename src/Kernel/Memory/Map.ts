import { bytefmt, cr3, flushtlb, page, panic, peek64, physpeek64, physpoke64, physpoke8, poke64, poke8, ptr, puts } from '../IO'

export enum VMPerms {
    PRESENT = 1,
    WRITEABLE = 2,
    USER = 4,
    // ... snip ...
    HUGE = 0x80,
    // ... snip ...
}

function get_pte_ptr(va: u64): u64 {
    let page_table: u64 = cr3()
    let control_pte: u64 = 0
    let va_val = va & 0x000f_ffff_ffff_f000
    const offsets = [
        ((((va_val >> 12) >> 9) >> 9) >> 9) & 0x1ff,
        (((va_val >> 12) >> 9) >> 9) & 0x1ff,
        ((va_val >> 12) >> 9) & 0x1ff,
        (va_val >> 12) & 0x1ff,
    ]
    let i = -1
    for (let idx = 0; idx < 4; idx++) {
        let key = offsets[idx]
        i++
        const ptk = physpeek64(page_table + key * 8)
        if (ptk & 0x80) {
            panic(`Unable to map to ${ptr(va)}`)
        }
        if (!(key & 1) && i != 3) {
            const new_page_table = page() - 0xffff800000000000
            for (let i = 0; i < 4096; i++) physpoke8(new_page_table + i, 0)
            physpoke64(page_table + key * 8, 0x07 | new_page_table)
        }
        control_pte = page_table + key * 8
        page_table = physpeek64(page_table + key * 8) & 0x000f_ffff_ffff_f000
    }

    return control_pte
}

export function vm_map(phys: u64, virt: u64, perms: VMPerms): void {
    const va_val: u64 = virt & 0x000f_ffff_ffff_f000
    puts(`PTE PTR: ${ptr(get_pte_ptr(virt))}`)

    physpoke64(get_pte_ptr(virt), va_val | perms)
    flushtlb()
}
