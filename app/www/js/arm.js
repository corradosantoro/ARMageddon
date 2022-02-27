'use strict';

var ARM_MODE = {
    ARM : 0,
    THUMB : 1,
};

function reg_name(n) {
    return "R" + n;
}



class Arm {

    constructor(arm_core, mode) {
        this.core = arm_core;
        this.mode = mode;

        this.reset();

        this.mov_cmp = [ "MOV", "CMP" ];
        this.shift_rolls = [ "LSL", "LSR" ];
        this.add_sub = [ "ADD", "SUB" ];
        this.and_eor = [ "AND", "EOR", "LSL", "LSR" ];
        this.asr_adc = [ "ASR", "ADC", "SBC", "ROR" ];
        this.tst_neg = [ "TST", "NEG", "CMP" , "CMN" ];
        this.orr_mul = [ "ORR", "MUL", "BIC" , "MVN" ];

        this.cond_map = [ "EQ", "NE", "CS", "CC", "MI", "PL", "VS", "VC",
                          "HI", "LS", "GE", "LT", "GT", "LE" ];

        this.bx_blx = [ "BX", "BLX" ];

        this.str = [ "STR", "STR.W", "STR.B", "STR.SB" ];
        this.ldr = [ "LDR", "STR.W", "LDR.B", "STR.SB" ];
        this.str_ldr = [ "STR", "LDR" ];
        this.sp_pc = [ "PC", "SP"];
        this.stmia_ldmia = [ "STMIA", "LDMIA"];

    }

    reset() {
        this.status = {
            registers : [ 0, 0, 0, 0,
                          0, 0, 0, 0,
                          0, 0, 0, 0,
                          0, 0, 0, 0 ],
            n : false,
            z : false,
            c : false,
            v : false,
            q : false,
            halted: false,
            invalid_instruction : false
        };
        this.core.reset(this.status);
        this.half = false;
    }

    get halted() {
        return this.status.halted;
    }

    set halted(h) {
        this.status.halted = h;
    }

    get invalid_instruction() {
        return this.status.invalid_instruction;
    }

    set invalid_instruction(h) {
        this.status.invalid_instruction = h;
    }

    set_register(r, data) {
        this.status.registers[r] = data;
    }

    get_register(r) {
        return this.status.registers[r];
    }

    get_status(r) {
        return this.status;
    }

    disassemble() {
        var disasm_list = [ ];
        var pc = this.core.find_region_by_type(Region.ROM).base_address;
        for (;;) {
            if (!this.core.in_limit(pc))
                break;
            var instr = this.core.read_16(pc);
            var instr2 = this.core.read_16(pc + 2);
            pc = pc + 4;

            // first opcode
            var res = this.execute_decode_instruction(pc, instr, 0, false);
            if (res == undefined)
                break;
            res.address = pc - 4;
            disasm_list.push(res);
            // if (inst.increment != undefined) {
            //     pc += inst.increment * 2;
            // }
            if (!res.skip) {
                var res = this.execute_decode_instruction(pc, instr2, 1, false);
                if (res == undefined)
                    break;
                res.address = pc - 2;
                disasm_list.push(res);
                // if (res.increment != undefined) {
                //     pc += inst.increment * 2;
                // }
            }
        }
        return disasm_list;
    }

    get_pc() {
        return this.status.registers[15] - 2 * this.half;
    }

    step() {
        if (this.status.halted)
            return;
        var pc = this.status.registers[15];
        if (this.mode == ARM_MODE.THUMB) {
            if (!this.half) {
                this.instr = this.core.read_16(pc);
                this.instr2 = this.core.read_16(pc + 2);
                pc = pc + 4;
                this.status.registers[15] = pc;
                var res = this.execute_decode_instruction(pc, this.instr, false, true);
                if (!res.ok) {
                    this.invalid_instruction = true;
                    this.halted = true;
                    return;
                    //console.log('HALT', res);
                }
                if (res.refetch == true) {
                    var pc = this.status.registers[15];
                    this.instr2 = this.core.read_16(pc - 2);
                }
                this.half = true;
            }
            else {
                var res = this.execute_decode_instruction(pc, this.instr2, true, true);
                if (!res.ok) {
                    this.invalid_instruction = true;
                    this.halted = true;
                    //console.log('HALT', res);
                }
                this.half = false;
            }
        }
    }

    execute_decode_instruction(instr, pc, half, do_execute) {
        if (this.mode == ARM_MODE.THUMB)
            return this.thumb_execute_decode_instruction(instr, pc, half, do_execute);
    }

    thumb_execute_decode_instruction(pc, instr, half, do_execute) {
        var instr_f000 = instr & 0xf000;
        var instr_f800 = instr & 0xf800;
        var instr_ff00 = instr & 0xff00;
        var instr_ffc0 = instr & 0xffc0;
        var instr_fe00 = instr & 0xfe00;

        var Rd = instr & 7;
        var Rn = (instr & 0x0038) >> 3;
        var Rb = Rn;
        var Rm = (instr & 0x01c0) >> 6;

        //console.log(pc.toString(16), "-->", instr.toString(16), instr_f000.toString(16), instr_f800.toString(16));

        if (instr_f000 == 0x0000) { // lsl/lsr rd/rn, #imm8
            var shift = (instr >> 6) & 5;
            var op = (instr >> 11) & 1;
            if (do_execute) {
                if (op == 0)
                    this.status.registers[Rd] = (this.status.registers[Rn] << shift) & 0xffffffff;
                else
                    this.status.registers[Rd] = this.status.registers[Rn] >>> shift;
                return { ok : true };
            }
            else
                return { mnemonic : this.shift_rolls[op], op_str : reg_name(Rd) + "," + reg_name(Rn) + ", #" + shift };
        }
        else if (instr_f800 == 0x1000) { // asr rd/rn, #imm8
            var shift = (instr >> 6) & 5;
            if (do_execute) {
                this.status.registers[Rd] = this.status.registers[Rn] >> shift;
                return { ok : true };
            }
            else
                return { mnemonic : "asr", op_str : reg_name(Rd) + "," + reg_name(Rn) + ", #" + shift };
        }
        else if ((instr & 0xfc00) == 0x1800) { // add, subtract registers
            var op = (instr >> 9) & 1;
            if (do_execute) {
                if (op == 0)
                    this.status.registers[Rd] = (this.status.registers[Rn] + this.status.registers[Rm]) & 0xffffffff;
                else
                    this.status.registers[Rd] = (this.status.registers[Rn] - this.status.registers[Rm]) & 0xffffffff;
                return { ok : true };
            }
            else
                return { mnemonic : this.add_sub[op],
                         op_str : reg_name(Rd) + "," + reg_name(Rn) + "," + reg_name(Rm) };
        }
        else if ((instr & 0xfc00) == 0x1c00) { // add, subtract immediate
            var op = (instr >> 9) & 1;
            if (do_execute) {
                if (op == 0)
                    this.status.registers[Rd] = (this.status.registers[Rn] + Rm) & 0xffffffff;
                else
                    this.status.registers[Rd] = (this.status.registers[Rn] - Rm) & 0xffffffff;
                return { ok : true };
            }
            else
                return { mnemonic : this.add_sub[op],
                         op_str : reg_name(Rd) + "," + reg_name(Rn) + ",#" + Rm };
        }
        else if (instr_f000 == 0x2000) { // mov/cmp rd/rn, #imm8
            var imm8 = instr & 0xff;
            var r = (instr >> 8) & 7;
            var op = (instr >> 11) & 1;
            if (do_execute) {
                if (op == 0) {
                    this.status.registers[r] = imm8;
                }
                else {
                    this.status.z = (this.status.registers[r] == imm8);
                    //status.registers[Rd] = (status.registers[Rn] - Rm) & 0xffffffff;
                    //COMPARE & update program status word
                }
                return { ok : true };
            }
            else
                return { mnemonic : this.mov_cmp[op], op_str : reg_name(r) + ", #" + imm8 };
        }
        else if (instr_f000 == 0x3000) { // add/sub rd/rn, #imm8
            var imm8 = instr & 0xff;
            var r = (instr >> 8) & 7;
            var op = (instr >> 11) & 1;
            if (do_execute) {
                if (op == 0)
                    this.status.registers[r] = (this.status.registers[r] + imm8) & 0xffffffff;
                else
                    this.status.registers[r] = (this.status.registers[r] - imm8) & 0xffffffff;
                return { ok : true };
            }
            else
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
            if (do_execute) {
                this.status.registers[Rd] = this.status.registers[Rn];
                return { ok : true };
            }
            else
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
            return { mnemonic : this.bx_blx[op], op_str : reg_name(r) };
        }
        else if (instr_f800 == 0x4800) { // LDR Rd, [pc, #imm * 4]
            var r = (instr >> 8) & 0x7;
            var imm = instr & 0xff;
            var target = pc + imm * 4;
            return { mnemonic : "LDR", op_str : reg_name(r) + ", [ #0x" + target.toString(16) + " ] ;; pc + #" + (imm*4) };
        }
        else if (instr_f800 == 0x5000) { // STR pre
            var op = (instr >> 9) & 3;
            return { mnemonic : this.str[op],
                     op_str : reg_name(Rd) + ", [" + reg_name(Rn) + "," + reg_name(Rm) + "]" };
        }
        else if (instr_f800 == 0x5800) { // LDR pre
            var op = (instr >> 9) & 3;
            return { mnemonic : this.ldr[op],
                     op_str : reg_name(Rd) + ", [" + reg_name(Rn) + "," + reg_name(Rm) + "]" };
        }
        else if (instr_f000 == 0x6000) { // STR | LDR Ld, [Ln, #immed*4]
            var op = (instr >> 11) & 1;
            var imm = (instr >> 6) & 0x1f;
            return { mnemonic : this.str_ldr[op],
                     op_str : reg_name(Rd) + ", [" + reg_name(Rn) + "," + (imm*4).toString(16) + "]" };
        }
        else if (instr_f000 == 0x7000) { // STR.B | LDR.B Ld, [Ln, #immed]
            var op = (instr >> 11) & 1;
            var imm = (instr >> 6) & 0x1f;
            return { mnemonic : this.str_ldr[op] + ".B",
                     op_str : reg_name(Rd) + ", [" + reg_name(Rn) + "," + (imm).toString(16) + "]" };
        }
        else if (instr_f000 == 0x8000) { // STR.W | LDR.W Ld, [Ln, #immed]
            var op = (instr >> 11) & 1;
            var imm = (instr >> 6) & 0x1f;
            return { mnemonic : this.str_ldr[op] + ".W",
                     op_str : reg_name(Rd) + ", [" + reg_name(Rn) + "," + (imm*2).toString(16) + "]" };
        }
        else if (instr_f000 == 0x9000) { // STR | LDR from/to SP 
            var op = (instr >> 11) & 1;
            var Rd = (instr >> 8) & 0x7;
            var imm = instr & 0x7f;
            var target = this.status.registers[13] + (imm*4); 
                     //STR <Rd>, [SP, #<immed_8>*4] | LDR <Rd>, [SP, #<immed_8>*4] 
            return { mnemonic : this.str_ldr[op],
                     op_str : reg_name(Rd) + ", [SP, #" + (imm*4).toString(16) + "] ;; #0x" + target.toString(16) };
        }
        else if (instr_f000 == 0xA000) { // ADD (PC/SP plus immediate)
            var op = (instr >> 11) & 1;
            var Rd = (instr >> 8) & 0x7;
            var imm = instr & 0x7f;
            var target = this.status.registers[13+(op*2)] + (imm*4);
                    //ADD <Rd>, PC, #<immed_8>*4 | ADD <Rd>, SP, #<immed_8>*4
            return { mnemonic: "ADD",
                     op_str : reg_name(Rd) + ", " + this.sp_pc[op] + ", #" + (imm*4).toString(16) + " ;; #0x" + target.toString(16) };
        }
        else if (instr_f000 == 0xC000) { // STMIA | LDMIA 
            var op = (instr >> 11) & 1;
            var Rn = (instr >> 8) & 0x7;
            var reg_list = [];
            var reg_str = "{";
            for(var i = 0; i < 8; i++)
                if ((instr >> i) & 1){
                    reg_list.push(i);
                    reg_str += "R" + i + ",";
                }
            reg_str = reg_str.replace(/.$/,"}");
                    //STMIA <Rn>!, {<registers>} | LDMIA <Rn>!, {<registers>}
            return { mnemonic: this.stmia_ldmia[op],
                     op_str : reg_name(Rn) + "!, " + reg_str };
        }
        else if (instr_f000 == 0xd000 ) { // Bcond | invalid | SWI
            var cond = (instr >> 8) & 0xf;
            var offset = to8bit_signed(instr & 0xff);
            var target = pc + (offset + half) * 2;
            if (cond < 13) {
                if (do_execute) {
                    switch (cond) {
                    case 0: //"EQ"
                        if (this.status.z) this.status.registers[15] = target;
                        break;
                    case 1: //"NE"
                        if (!this.status.z) this.status.registers[15] = target;
                        break;
                    }
                    return { ok : true, refetch: true };
                }
                else
                    return { mnemonic : "B" + this.cond_map[cond], op_str : "#0x" + target.toString(16) };
            }
            else if (cond == 14) {
                if (do_execute) {
                    this.status.halted = true;
                    this.status.invalid_instruction = true;
                    return { ok : true };
                }
                else
                    return { mnemonic : "invalid(#0x" + instr.toString(16) + ")", op_str : "" };
            }
            else {
                if (do_execute) {
                    if (offset == 0) this.status.halted = true;
                    return { ok : true };
                }
                else
                    return { mnemonic : "SWI", op_str : "#0x" + offset.toString(16) };
            }
        }
        else if (instr_f800 == 0xe000) { // B
            var offset = to8bit_signed(instr & 0xff);
            var target = pc + (offset + 1) * 2;
            if (do_execute) {
                this.status.registers[15] = target;
                return { ok : true, refetch: true };
            }
            else
                return { mnemonic : "B", op_str : "#0x" + target.toString(16) };
        }
        else if (instr_fe00 == 0xf800) { // 32bit - 3.3.3 Load and store single data item, and memory hints
            var instr_2 = this.core.read_16(pc - 2);
            var imm12 = instr_2 & 0x7ff;
            var imm8 = instr_2 & 0xff;
            var Rt = (instr_2 >> 12) & 0xf;
            var Rn = instr & 0xf;
            var U = (instr >> 7) & 1;
            var L = (instr >> 4) & 1;
            var S = (instr >> 8) & 1;
            var size = (instr >> 5) & 3;
            var subcode = (instr_2 >> 8) & 0xf;

            if (Rn == 15) {
                var target = (pc & 0xfffffffc) + imm12;// + 4;
                // PC +/- imm12
                return { mnemonic : "LDR" + this.__size(S, size),
                         op_str : reg_name(Rt) + ", [ #0x" + target.toString(16) + " ] ;; pc + " + imm12,
                         skip : true };
            }
            else if (U == 1) {
                // Rn + imm12
                return { mnemonic : this.str_ldr[L] + this.__size(S, size),
                         op_str : reg_name(Rt) + ", [" + reg_name(Rn) + " + #0x" + imm12.toString(16) + "]",
                         skip : true };
            }
            else if (subcode == 0xc) {
                // Rn - imm8
                return { mnemonic : this.str_ldr[L] + this.__size(S, size),
                         op_str : reg_name(Rt) + ", [" + reg_name(Rn) + " - #0x" + imm8.toString(16) + "]",
                         skip : true };
            }
            else if (subcode == 0) {
                // Rn + shifted register
                var shift = (instr_2 >> 3) & 3;
                var Rm = instr_2 & 0x7;
                return { mnemonic : this.str_ldr[L] + this.__size(S, size),
                         op_str : reg_name(Rt) + ", [" + reg_name(Rn) + " + " + reg_name(Rm) + " shr " + shift.toString(16) + "]",
                         skip : true };
            }
            else
                return { mnemonic : "undef", op_str : "#0x" + instr.toString(16), skip : true };
        }
        else
            return { mnemonic : "undef", op_str : "#0x" + instr.toString(16) };
    }
    // 1111 1000 1101 1111 1101 0000 0011 0100
    // --------S UxxL Rn   Rt

    __size(S, size) {
        if (size == 0) return "";
        if (size == 1 && S == 0) return ".B";
        if (size == 1 && S == 1) return ".BS";
        if (size == 2 && S == 0) return ".W";
        if (size == 2 && S == 1) return ".WS";
    }
};
