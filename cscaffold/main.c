#include "build/gen/x.h"
// #include <string.h>
#include <stdarg.h>
#include <stdint.h>
#include <stivale2.h>

typedef uintptr_t size_t;

void     *malloc(size_t);				//< The standard function.
void     *realloc(void *, size_t);		//< The standard function.
void     *calloc(size_t, size_t);		//< The standard function.
void      free(void *);					//< The standard function.

static inline void tlbflush() {
#ifndef __VSCODE__
    asm volatile("mov %%cr3, %%rax\nmov %%rax,%%cr3":::"rax");
#endif
}

static inline void outb(uint16_t port, uint8_t val)
{
    asm volatile ( "outb %0, %1" : : "a"(val), "Nd"(port) );
}

static struct stivale2_struct_tag_terminal* termtag;
 
void* memcpy(void* restrict dstptr, const void* restrict srcptr, size_t size) {
	unsigned char* dst = (unsigned char*) dstptr;
	const unsigned char* src = (const unsigned char*) srcptr;
	for (size_t i = 0; i < size; i++)
		dst[i] = src[i];
	return dstptr;
}
u64 originallowhalf[256];
char buffer[256];
int bufidx = 0;
void putc(char c) {
    if (termtag) {
        if (c) buffer[bufidx++] = c;
        if (bufidx == 256 || c == '\n' || c == 0) {
            u64 tmpbuf[256];

            u64* cr3;
            asm volatile("mov %%cr3, %0" : "=r"(cr3));
            cr3 = (u64*)(0xffff800000000000 + (u64)cr3);
            for (int i = 0;i < 256;i++) {
                tmpbuf[i] = cr3[i];
                cr3[i] = originallowhalf[i];
            }
            tlbflush();

            ((void(*)(char* s, int l))termtag->term_write)(buffer, bufidx);
            bufidx = 0;

            for (int i = 0;i < 256;i++) {
                cr3[i] = tmpbuf[i];
            }
            tlbflush();
        }
    }
    outb(0xe9, c);
}
void puts(const char* s) {
    while (*s) putc(*s++);
    putc('\n');
}
void putsnnl(const char* s) {
    while (*s) putc(*s++);
}
void putint(uint64_t n, int base) {
    if (n == 0) {
        putc('0');
        return;
    }
    char tmpb[64], *tmp = &tmpb[0];
    memset(tmpb, 0, 64);
    for (; n > 0; n /= base)
        *(++tmp) = "0123456789abcdef"[n % base];
    while (*tmp != '\0')
        putc(*(tmp--));
}
void putptr(uint64_t ptr) {
    char buffer[17];
    memset(buffer, '0', 16);
    buffer[16] = 0;
    int i = 15;
    while (ptr) {
        buffer[i] = "0123456789abcdef"[ptr & 0xf];
        ptr >>= 4;
        i--;
    }
    putsnnl(buffer);
}
void putsint(int64_t n, int base) {
    if (n < 0) { putc('-'); n = -n; }
    putint(n, base);
}

#define QGG(qgp) (*(uint32_t*)(qgp))

int check(const char* fmt, const char* test) {
    while (*test) {
        if (!*fmt) return 0;
        if (*test != *fmt) return 0;
        fmt++;
        test++;
    }
    return 1;
}

void printk(const char* fmt, ...) {
    va_list ap;
    va_start(ap, fmt);
    while (*fmt) {
        if (*fmt == '$') {
            if (check(fmt, "$int")) {
                fmt += 4;
                putint(va_arg(ap, int64_t), 10);
                continue;
            }
            if (check(fmt, "$hex")) {
                fmt += 4;
                putsint(va_arg(ap, int64_t), 16);
                continue;
            }
            if (check(fmt, "$ptr")) {
                fmt += 4;
                putsnnl("0x");
                putptr(va_arg(ap, uint64_t));
                continue;
            }
            if (check(fmt, "$uhex")) {
                fmt += 5;
                putint(va_arg(ap, uint64_t), 16);
                continue;
            }
            if (check(fmt, "$str")) {
                fmt += 4;
                putsnnl(va_arg(ap, const char*));
                continue;
            }
            putc('$');
            continue;
        } else {
            putc(*fmt++);
            continue;
        }
    }
    putc('\n');
}


void* memset(void* bufptr, int value, size_t size) {
	unsigned char* buf = (unsigned char*) bufptr;
	for (size_t i = 0; i < size; i++)
		buf[i] = (unsigned char) value;
	return bufptr;
}

// TODO: liballoc_{lock,unlcok}

void liballoc_lock() {

}

void liballoc_unlock() {

}

uint64_t* theplace;

uint64_t* liballoc_alloc(uint64_t pages) {
    uint64_t* tpp = theplace;
    uint64_t** tpprp = &theplace;
    while (tpp) {
        if (tpp[0] >= pages) {
            // handle
            if (tpp[0] > pages) {
                tpp[0] -= pages;
                return (uint64_t*)(((void*)tpp) + (4096 * tpp[0]));
            }
            *tpprp = (uint64_t*)tpp[1];
            return tpp;
        }
        tpprp = (uint64_t**)&tpp[1];
        tpp = *tpprp;
    }
    return (uint64_t*)0;
}
void liballoc_free(uint64_t* area, uint64_t pages) {
    area[0] = pages;
    area[1] = (uint64_t)theplace;
    theplace = area;
}

static uint8_t stack[128 * 1024];

static struct stivale2_header_tag_terminal hdrtagterm = {
    .tag = {
        .identifier = STIVALE2_HEADER_TAG_TERMINAL_ID,
        .next = 0
    },
    .flags = 0
};
static struct stivale2_header_tag_framebuffer hdrtagfb = {
    .tag = {
        .identifier = STIVALE2_HEADER_TAG_FRAMEBUFFER_ID,
        .next = &hdrtagterm.tag
    },
    .framebuffer_width = 0,
    .framebuffer_height = 0,
    .framebuffer_bpp = 32,
};

__attribute__((section(".stivale2hdr"), used))
static struct stivale2_header stivale_hdr = {
    .entry_point = 0,
    .stack = (uintptr_t)stack + sizeof(stack),
    .flags = 2,
    .tags = &hdrtagfb.tag
};

struct stivale2_struct* gstruc;

typedef struct {
    u64 ds;
    u64 r15;
    u64 r14;
    u64 r13;
    u64 r12;
    u64 r11;
    u64 r10;
    u64 r9;
    u64 r8;
    u64 rdi;
    u64 rsi;
    u64 rdx;
    u64 rcx;
    u64 rbx;
    u64 rax;
    u64 rbp;
    u64 error;
    u64 rip;
    u64 cs;
    u64 flags;
    u64 rsp;
    u64 ss;
} regs_t;

struct {
    regs_t r;
    u64 lastirq;
} suspended_task;
int mode = 0;

void do_isr_handle(u64 isr, regs_t* regs) {
    suspended_task.lastirq = isr;
    if (!(regs->cs & 3) && isr == 3) {
        // coming from kernel
        if (mode == /* TASK_SETUP_REGS */ 1) {
            suspended_task.r = *regs;
            mode = 0;
            return;
        }
        if (mode == /* TASK_SWITCH_REGS */ 2) {
            regs_t other = *regs;
            *regs = suspended_task.r;
            suspended_task.r = other;
            mode = 0;
            return;
        }
        if (mode == 0) {
            printk("Fatal: ISR 0x$hex! aborting...", isr);
            while (1);
        }
    }
    if (!(regs->cs & 3) && isr < 32) {
        printk("Fatal: ISR 0x$hex! aborting...", isr);
        while (1);
    }
    regs_t other = *regs;
    *regs = suspended_task.r;
    suspended_task.r = other;
}

void (*Z_envZ_abortZ_viiii)(u32, u32, u32, u32);
void (*Z_indexZ_putcharZ_vi)(u32);
u64 (*Z_indexZ_getStivale2HeaderZ_jv)(void);
u32 (*Z_indexZ_peek8Z_ij)(u64);
u32 (*Z_indexZ_peek16Z_ij)(u64);
u32 (*Z_indexZ_peek32Z_ij)(u64);
u64 (*Z_indexZ_peek64Z_jj)(u64);
u64 (*Z_indexZ_mallocZ_jj)(u64);
void (*Z_indexZ_poke8Z_vji)(u64, u32);
void (*Z_indexZ_poke16Z_vji)(u64, u32);
void (*Z_indexZ_poke32Z_vji)(u64, u32);
void (*Z_indexZ_poke64Z_vjj)(u64, u64);
void (*Z_indexZ_loadGDTZ_vj)(u64);
void (*Z_indexZ_loadIDTZ_vj)(u64);
u64 (*Z_indexZ_pageZ_jv)(void);
void (*Z_indexZ_freeZ_vj)(u64);
void (*Z_indexZ_setInt3HandlerTaskZ_vi)(u32);
u64 (*Z_indexZ_getRegSwappedSlotAddrZ_jv)(void);
void (*Z_indexZ_outbZ_vii)(u32, u32);

void Z_envZ_abortZ_viiii_impl(u32 a, u32 b, u32 c, u32 d) {
    printk("abort()!");
    while (1);
}
void Z_indexZ_putcharZ_vi_impl(u32 val) {
    putc((char)val);
}
u64 Z_indexZ_getStivale2HeaderZ_jv_impl() {
    return (u64)gstruc;
}
u32 Z_indexZ_peek8Z_ij_impl(u64 addr) {
    return (u32)*((u8*)addr);
}
u32 Z_indexZ_peek16Z_ij_impl(u64 addr) {
    return (u32)*((u16*)addr);
}
u32 Z_indexZ_peek32Z_ij_impl(u64 addr) {
    return (u32)*((u32*)addr);
}
u64 Z_indexZ_peek64Z_jj_impl(u64 addr) {
    return (u64)*((u64*)addr);
}

u64 Z_indexZ_mallocZ_jj_impl(u64 size) {
    u64 a = (u64)malloc(size);
    return a;
}
void Z_indexZ_poke8Z_vji_impl(u64 addr, u32 val) {
    (*(u8*)(addr)) = (u8)val;
}
void Z_indexZ_poke16Z_vji_impl(u64 addr, u32 val) {
    (*(u16*)(addr)) = (u16)val;
}
void Z_indexZ_poke32Z_vji_impl(u64 addr, u32 val) {
    (*(u32*)(addr)) = val;
}
void Z_indexZ_poke64Z_vjj_impl(u64 addr, u64 val) {
    (*(u64*)(addr)) = val;
}
void Z_indexZ_loadGDTZ_vj_impl(u64 addr) {
    asm("lgdt (%0)" :: "r"(addr));
}
void Z_indexZ_loadIDTZ_vj_impl(u64 addr) {
    asm("lidt (%0)" :: "r"(addr));
}
u64 Z_indexZ_pageZ_jv_impl() {
    return (u64)liballoc_alloc(1);
}
void Z_indexZ_freeZ_vj_impl(u64 addr){
    free((void*)addr);
}
void Z_indexZ_setInt3HandlerTaskZ_vi_impl(u32 task) {
    mode = task;
}
u64 Z_indexZ_getRegSwappedSlotAddrZ_jv_impl() {
    return (u64)&suspended_task;
}
void Z_indexZ_outbZ_vii_impl(u32 port, u32 val) {
    outb((u16)port, (u8)val);
}

void _start(struct stivale2_struct* struc) {
    
    u64* cr3;
    asm volatile("mov %%cr3, %0" : "=r"(cr3));
    cr3 = (u64*)(0xffff800000000000 + (u64)cr3);
    for (int i = 0;i < 256;i++) {
        originallowhalf[i] = cr3[i];
        cr3[i] = 0;
    }
    tlbflush();
    gstruc = struc;

    struct stivale2_tag* tag = struc->tags;
    while (tag) {
        if (tag->identifier == STIVALE2_STRUCT_TAG_TERMINAL_ID) termtag = (struct stivale2_struct_tag_terminal*)tag;
        tag = tag->next;
    }
    tag = struc->tags;
    while (tag) {
        if (tag->identifier == STIVALE2_STRUCT_TAG_MEMMAP_ID) {
            struct stivale2_struct_tag_memmap* map = (struct stivale2_struct_tag_memmap*)tag;
            for (size_t i = 0;i < map->entries;i++) {
                if (map->memmap[i].type == STIVALE2_MMAP_USABLE) {
                    printk("Usable memory: [$ptr; $ptr]", map->memmap[i].base, map->memmap[i].base + map->memmap[i].length);
                    liballoc_free((uint64_t*)(0xffff800000000000 + map->memmap[i].base), map->memmap[i].length / 4096);
                }
            }
        } 
        tag = tag->next;
    }


    
    Z_envZ_abortZ_viiii = Z_envZ_abortZ_viiii_impl;
    Z_indexZ_putcharZ_vi = Z_indexZ_putcharZ_vi_impl;
    Z_indexZ_getStivale2HeaderZ_jv = Z_indexZ_getStivale2HeaderZ_jv_impl;
    Z_indexZ_peek8Z_ij = Z_indexZ_peek8Z_ij_impl;
    Z_indexZ_peek16Z_ij = Z_indexZ_peek16Z_ij_impl;
    Z_indexZ_peek32Z_ij = Z_indexZ_peek32Z_ij_impl;
    Z_indexZ_peek64Z_jj = Z_indexZ_peek64Z_jj_impl;
    Z_indexZ_mallocZ_jj = Z_indexZ_mallocZ_jj_impl;
    Z_indexZ_poke8Z_vji = Z_indexZ_poke8Z_vji_impl;
    Z_indexZ_poke16Z_vji = Z_indexZ_poke16Z_vji_impl;
    Z_indexZ_poke32Z_vji = Z_indexZ_poke32Z_vji_impl;
    Z_indexZ_poke64Z_vjj = Z_indexZ_poke64Z_vjj_impl;
    Z_indexZ_loadGDTZ_vj = Z_indexZ_loadGDTZ_vj_impl;
    Z_indexZ_loadIDTZ_vj = Z_indexZ_loadIDTZ_vj_impl;
    Z_indexZ_pageZ_jv = Z_indexZ_pageZ_jv_impl;
    Z_indexZ_freeZ_vj = Z_indexZ_freeZ_vj_impl;
    Z_indexZ_setInt3HandlerTaskZ_vi = Z_indexZ_setInt3HandlerTaskZ_vi_impl;
    Z_indexZ_getRegSwappedSlotAddrZ_jv = Z_indexZ_getRegSwappedSlotAddrZ_jv_impl;
    Z_indexZ_outbZ_vii = Z_indexZ_outbZ_vii_impl;
    init();
    while (1);
}