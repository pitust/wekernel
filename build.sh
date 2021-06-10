set -e
grep -r '@Driver' src/Kernel | awk '{ split($1,o,":");print o[1] }' | sed 's/\.ts//g' | sort -u | awk '{ print "import '"'"'../../../" $1 "'"'"';" }' | prettier --stdin-filepath foobar.ts >src/Kernel/Autogen/DriverImports.ts
asc src/index.ts -o x.wasm --transform `pwd`/src/Transform/index.ts
wasm2wat x.wasm
mkdir -p build/gen
wasm2c x.wasm -o build/gen/x.c
CFLAGS="-target x86_64-elf -c -I. -Iliballoc -Iinclude -ggdb -mno-80387 -mno-mmx -mno-3dnow -mno-sse -mno-sse2 -mno-red-zone -Wno-tautological-pointer-compare -Wno-incompatible-library-redeclaration -mcmodel=kernel"
clang $CFLAGS cscaffold/main.c -o build/main.o
yasm cscaffold/idt.s -o build/idt.o -felf64
clang $CFLAGS build/gen/x.c -o build/x.o
clang $CFLAGS cscaffold/wasm-rt-impl.c -o build/wasm-rt-impl.o
clang $CFLAGS liballoc/liballoc.c -o build/liballoc.o
ld.lld build/x.o build/main.o build/idt.o build/wasm-rt-impl.o build/liballoc.o -T linker.ld -o build/kernel
cp ~/limine/limine-eltorito-efi.bin iso
cp ~/limine/limine-cd.bin iso
cp ~/limine/limine.sys iso
cp build/kernel iso/kernel.elf
xorriso -as mkisofs --protective-msdos-label iso -o build/iso.img
limine-install build/iso.img
qemu-system-x86_64 -hda build/iso.img -global isa-debugcon.iobase=0xe9 -debugcon stdio -s -M q35