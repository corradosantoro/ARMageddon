'use strict';

var Emulator = {

    e : undefined,

    read_unmapped : function(uc, addr, size, user_data) {
        console.log('Bad read at address ', addr, size);
    },

    fetch_unmapped : function(uc, addr, size, user_data) {
        console.log('Bad fetch at address ', addr.toString(16), size);
    },

    hook_code : function(uc, addr, size, user_data) {
        console.log('Executing at address ', addr.toString(16), size);
    },

    run : function() {
        var code = currentFirmware;

        // Initialize engine
        this.e = new uc.Unicorn(uc.ARCH_ARM, uc.MODE_THUMB);

        this.e.hook_add(uc.HOOK_MEM_FETCH_UNMAPPED, Emulator.fetch_unmapped,
                        undefined,
                        0x0, ROMStart - 1);

        this.e.hook_add(uc.HOOK_MEM_READ_UNMAPPED, Emulator.read_unmapped,
                        undefined,
                        0x0, ROMStart - 1);

        // Write registers and memory
        this.e.reg_write_i32(uc.ARM_REG_R0, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R1, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R2, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R3, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R4, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R5, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R6, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R7, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R8, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R9, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R10, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R11, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R12, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R13, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R14, 0x0);
        this.e.reg_write_i32(uc.ARM_REG_R15, ROMStart);
        this.e.mem_map(ROMStart, 4*1024, uc.PROT_ALL);
        this.e.mem_write(ROMStart, code)

        // Start emulator
        var begin = ROMStart;
        var until = ROMStart + code.length;

        this.e.emu_start(begin | 1, until, 0, 0);

        console.log(e.reg_read_i32(uc.ARM_REG_R0));
        console.log(e.reg_read_i32(uc.ARM_REG_R1));
        console.log(e.reg_read_i32(uc.ARM_REG_R2));
    }

};
