'use strict';

var ARM_MODE = {
    ARM : 0,
    THUMB : 1,
};

function reg_name(n) {
    return "R" + n;
}

var Thumb = {

    mov_cmp : [ "MOV", "CMP" ],
    shift_rolls : [ "LSL", "LSR" ],
    add_sub : [ "ADD", "SUB" ],
    and_eor : [ "AND", "EOR", "LSL", "LSR" ],
    asr_adc : [ "ASR", "ADC", "SBC", "ROR" ],
    tst_neg : [ "TST", "NEG", "CMP" , "CMN" ],
    orr_mul : [ "ORR", "MUL", "BIC" , "MVN" ],

    decode_instruction : function(binary, index, pc) {
        var instr = binary[index] | (binary[index+1] << 8);

        var instr_f000 = instr & 0xf000;
        var instr_f800 = instr & 0xf800;
        var instr_ff00 = instr & 0xff00;
        var instr_ffc0 = instr & 0xffc0;

        var Rd = instr & 7;
        var Rn = (instr & 0x0038) >> 3;
        var Rb = Rn;
        var Rm = (instr & 0x01c0) >> 6;

        if (instr_f000 == 0x0000) { // lsl/lsr rd/rn, #imm8
            var shift = (instr >> 6) & 5;
            var op = (instr >> 11) & 1;
            return { mnemonic : this.shift_rolls[op], op_str : reg_name(rd) + "," + reg_name(rn) + ", #" + shift };
        }
        else if (instr_f800 == 0x1000) { // asr rd/rn, #imm8
            var shift = (instr >> 6) & 5;
            return { mnemonic : "asr", op_str : reg_name(rd) + "," + reg_name(rn) + ", #" + shift };
        }
        else if ((instr & 0xfc00) == 0x1800) { // add, subtract registers
            var op = (instr >> 9) & 1;
            return { mnemonic : this.add_sub[op],
                     op_str : reg_name(Rd) + "," + reg_name(Rn) + "," + reg_name(Rm) };
        }
        else if ((instr & 0xfc00) == 0x1c00) { // add, subtract immediate
            var op = (instr >> 9) & 1;
            return { mnemonic : this.add_sub[op],
                     op_str : reg_name(Rd) + "," + reg_name(Rn) + ",#" + Rm };
        }
        else if (instr_f000 == 0x2000) { // mov/cmp rd/rn, #imm8
            var imm8 = instr & 0xff;
            var r = (instr >> 8) & 7;
            var op = (instr >> 11) & 1;
            return { mnemonic : this.mov_cmp[op], op_str : reg_name(r) + ", #" + imm8 };
        }
        else if (instr_f000 == 0x3000) { // add/sub rd/rn, #imm8
            var imm8 = instr & 0xff;
            var r = (instr >> 8) & 7;
            var op = (instr >> 11) & 1;
            return { mnemonic : this.add_sub[op], op_str : reg_name(r) + ", #" + imm8 };
        }
        else if (instr_ff00 == 0x4000) { // AND | EOR | LSL | LSR rd, rn
            var op = (instr >> 6) & 3;
            return { mnemonic : this.and_eor[op], op_str : reg_name(Rd) + "," + reg_name(Rn) };
        }
        else if (instr_ff00 == 0x4100) { // ASR | ADC | SBC | ROR rd, rn
            var op = (instr >> 6) & 3;
            return { mnemonic : this.asr_adc[op], op_str : reg_name(Rd) + "," + reg_name(Rn) };
        }
        else if (instr_ff00 == 0x4200) { // TST | NEG | CMP | CMN rd, rn
            var op = (instr >> 6) & 3;
            return { mnemonic : this.tst_neg[op], op_str : reg_name(Rd) + "," + reg_name(Rn) };
        }
        else if (instr_ff00 == 0x4300) { // ORR | MUL | BIC | MVN rd, rn
            var op = (instr >> 6) & 3;
            return { mnemonic : this.orr_mul[op], op_str : reg_name(Rd) + "," + reg_name(Rn) };
        }
        else if (instr_ffc0 == 0x4600) { // MOV rd, rn
            return { mnemonic : "MOV", op_str : reg_name(Rd) + "," + reg_name(Rn) };
        }
        else if (instr_ffc0 == 0x4440) { // ADD Rd, R(n+8)
            return { mnemonic : "ADD", op_str : reg_name(Rd) + "," + reg_name(Rn + 8) };
        }
        else if (instr_ffc0 == 0x4640) { // MOV Rd, R(n+8)
            return { mnemonic : "MOV", op_str : reg_name(Rd) + "," + reg_name(Rn + 8) };
        }
        else if (instr_ffc0 == 0x4480) { // ADD R(d+8), Rn
            return { mnemonic : "ADD", op_str : reg_name(Rd + 8) + "," + reg_name(Rn) };
        }
        else if (instr_ffc0 == 0x4680) { // MOV R(d+8), Rn
            return { mnemonic : "MOV", op_str : reg_name(Rd + 8) + "," + reg_name(Rn) };
        }
        else if (instr_ffc0 == 0x44c0) { // ADD R(d+8), R(n+8)
            return { mnemonic : "ADD", op_str : reg_name(Rd + 8) + "," + reg_name(Rn + 8) };
        }
        else if (instr_ffc0 == 0x46c0) { // MOV R(d+8), R(n+8)
            return { mnemonic : "MOV", op_str : reg_name(Rd + 8) + "," + reg_name(Rn + 8) };
        }
        else if (instr_ffc0 == 0x4540) { // CMP Rd, R(n+8)
            return { mnemonic : "CMP", op_str : reg_name(Rd) + "," + reg_name(Rn + 8) };
        }
        else if (instr_ffc0 == 0x4580) { // CMP R(d+8), Rn
            return { mnemonic : "CMP", op_str : reg_name(Rd + 8) + "," + reg_name(Rn) };
        }
        else if (instr_ffc0 == 0x45c0) { // CMP R(d+8), R(n+8)
            return { mnemonic : "CMP", op_str : reg_name(Rd + 8) + "," + reg_name(Rn + 8) };
        }
        else if (instr_ff00 == 0x4700) { // BX | BLX Rm
            var r = (instr >> 6) & 0xf;
            var op = (instr >> 7) & 1;
            return { mnemonic : this.bx_blx(op), op_str : reg_name(r) };
        }
        else if (instr_f800 == 0x4800) { // LDR Rd, [pc, #imm * 4]
            var r = (instr >> 8) & 0x7;
            var imm = instr & 0xff;
            var target = pc + imm * 4;
            return { mnemonic : "LDR", op_str : reg_name(r) + ", [ #0x" + tracing.toString(16) " ] ;; pc + #" + imm };
        }
        else
            return undefined;
    },

};



class Arm {

    constructor(binary, base_address, mode) {
        this.binary = binary;
        this.base_address = base_address;
        this.mode = mode;
    }

    disassemble_thumb() {
        var disasm_list = [ ];
        var addr = this.base_address;
        var index = 0;
        for (;;) {
            if (index == this.binary.length || index == this.binary.length - 1)
                return disasm_list;
            var inst = Thumb.decode_instruction(this.binary, index, addr);
            if (inst != undefined) {
                disasm_list.push(inst);
                if (inst.increment != undefined) {
                    index += index.increment * 2;
                    addr += index.increment * 2;
                }
                index += 2;
                addr += 2;
            }
        }
    }

};
