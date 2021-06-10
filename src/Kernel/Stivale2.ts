export const TAG_CMDLINE: u64 = 0xe5e76a1b4597a781
export const TAG_MEMMAP: u64 = 0x2187f79e8612de07
export const TAG_FRAMEBUFFER: u64 = 0x506461d2950408fa
export const TAG_EDID: u64 = 0x968609d7af96b845
export const TAG_FB_MTRR: u64 = 0x6bc1a78ebe871172
export const TAG_TERMINAL: u64 = 0xc2b3f4c3233b0974
export const TAG_MODULES: u64 = 0x4b6fe466aade04ce
export const TAG_RSDP: u64 = 0x9e1786930a375e78
export const TAG_EPOCH: u64 = 0x566a7bed888e1407
export const TAG_FIRMWARE: u64 = 0x359d837855e3858c
export const TAG_EFI_SYSTEM_TABLE: u64 = 0x4bc5ec15845b558e
export const TAG_KERNEL_FILE: u64 = 0xe599d90c2975584a
export const TAG_KERNEL_SLIDE: u64 = 0xee80847d01506c57
export const TAG_SMBIOS: u64 = 0x274bd246c62bf7d1
export const TAG_SMP: u64 = 0x34d1d96339647025
export const TAG_PXE_SERVER_INFO: u64 = 0x29d1e96239247032
export const TAG_MMIO32_UART: u64 = 0xb813f9b8dbc78797
export const TAG_DTB: u64 = 0xabb29bd49a2833fa
export const TAG_VMAP: u64 = 0xb0ed257db18cb58f
const id2name: Map<u64, string> = new Map()

id2name.set(TAG_CMDLINE, 'Kernel command line')
id2name.set(TAG_MEMMAP, 'Memory map')
id2name.set(TAG_FRAMEBUFFER, 'Framebuffer')
id2name.set(TAG_EDID, 'Extended Display Identification')
id2name.set(TAG_FB_MTRR, 'MTRR Write-Combining framebuffer')
id2name.set(TAG_TERMINAL, 'Terminal')
id2name.set(TAG_MODULES, 'Kernel Modules')
id2name.set(TAG_RSDP, 'RSDT Pointer')
id2name.set(TAG_EPOCH, 'UNIX Epoch at boot')
id2name.set(TAG_FIRMWARE, 'Firmware used')
id2name.set(TAG_EFI_SYSTEM_TABLE, 'EFI System Table')
id2name.set(TAG_KERNEL_FILE, 'Kernel File')
id2name.set(TAG_KERNEL_SLIDE, 'KASLR Slide')
id2name.set(TAG_SMBIOS, 'SMBIOS')
id2name.set(TAG_SMP, 'AP Information')
id2name.set(TAG_PXE_SERVER_INFO, 'PXE Server information')
id2name.set(TAG_MMIO32_UART, 'Memory-mapped UART')
id2name.set(TAG_DTB, 'Device Tree')
id2name.set(TAG_VMAP, 'Virtual Memory high map address')

export function lookupStivaleTag(id: u64): string {
    return id2name.has(id) ? id2name.get(id) : '<unknown tag ' + id.toString(16).padStart(16, '0') + '>'
}
