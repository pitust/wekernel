#include <stdint.h>
#ifndef _sh
#define _sh
typedef uintptr_t size_t;
void* calloc(size_t nobj, size_t size);
void* memset(void *, int, unsigned long);
void* realloc(void *, unsigned long);
void free(void*);
void* malloc(size_t);
void* memcpy(void* restrict dstptr, const void* restrict srcptr, size_t size);
#endif