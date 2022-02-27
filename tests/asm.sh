#
#
#

CC=arm-none-eabi-gcc
LD=arm-none-eabi-g++
SIZ=arm-none-eabi-size
AS=arm-none-eabi-as
AR=arm-none-eabi-ar
NM=arm-none-eabi-nm
OBJCOPY=arm-none-eabi-objcopy
STRIP=arm-none-eabi-strip
DBG=arm-none-eabi-gdb


CFLAGS="-Wall -mcpu=cortex-m4 -mthumb -mlittle-endian"


LDFLAGS="-mcpu=cortex-m4 -mthumb -mlittle-endian -TARMageddon.ld -Wl,--gc-sections"

echo -n "Compiling..."
$CC $CFLAGS -c $1.s
echo "DONE"
echo -n "Linking..."
$LD $LDFLAGS $1.o -o $1.elf
echo "DONE"
$OBJCOPY -O binary $1.elf $1.bin


