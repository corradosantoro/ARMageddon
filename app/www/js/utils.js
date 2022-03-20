'use strict';

function to8bit_unsigned(n) {
    if (n < 0)
        return 256 + n;
    else
        return n;
}

function to8bit_signed(n) {
    if (n > 127)
        return n - 256;
    else
        return n;
}

function array_to_uint(a) {
    var res = [ ];
    a.forEach(function (x) { res.push(to8bit_unsigned(x)); } );
    return res;
}

/**
 * Shift operations
 * @param {number} value Number to shift
 * @param {string} type Mnemonic instruction: LSL, LSR, ASR, ROR
 * @param {number} n_shift Numbers of shifts
 * @param {boolean} c_in Actual carry bit 1/0
 * @returns {[number, boolean]} [result, carry_out]
 */
function shift_c(value, type, n_shift, c_in) {
    let result;
    let c_out;

    switch (type) {
        case "LSL":
            [result, c_out] = lsl_c(value, n_shift);
            break;
        case "LSR":
            [result, c_out] = lsr_c(value, n_shift);
            break;
        case "ASR":
            [result, c_out] = asr_c(value, n_shift);
            break;
        case "ROR":
            [result, c_out] = ror_c(value, n_shift);
            break;
        default:
            break;
    }

    return [result, c_out];
}

/**
 * Logical Shift Left and Carry change
 * @param {number} value Number to shift
 * @param {number} n_shift Number of shifts
 * @returns {[number, boolean]} [result, c_out]
 */
function lsl_c(value, n_shift) {
    // assert n > 0;
    let result = ( value << n_shift ) & 0xffffffff ;
    let c_out = !!(( value >>> (32 - n_shift) ) & 0x1);
    return [result, c_out];
}

/**
 * Logical Shift Right and Carry change
 * @param {number} value Number to shift
 * @param {number} n_shift Number of shifts
 * @returns {[number, boolean]} [result, c_out]
 */
 function lsr_c(value, n_shift) {
    // assert n > 0;
    let result = ( value >>> n_shift ) & 0xffffffff ;
    let c_out = !!(( value >>> (n_shift - 1) ) & 0x1);
    return [result, c_out];
}

/**
 * Arithmetic Shift Right and Carry change
 * @param {number} value Number to shift
 * @param {number} n_shift Number of shifts
 * @returns {[number, boolean]} [result, c_out]
 */
 function asr_c(value, n_shift) {
    // assert n > 0;
    let result = ( value >> n_shift ) & 0xffffffff ;
    let c_out = !!(( value >>> (n_shift - 1) ) & 0x1);
    return [result, c_out];
}

/**
 * Rotate Right and Carry change
 * @param {number} value Number to shift
 * @param {number} n_shift Number of shifts
 * @returns {[number, boolean]} [result, c_out] 
 */
function ror_c(value, n_shift) {
    var t, c_out;
    for( let i=0; i<n_shift; i++ ){
        t = value & 0x1;
        value = (value >>> 1)|(t<<31);
        c_out = t;
    }
    return [value, c_out];
}

function right_justify(s, n, chr) {
    if (chr == undefined) chr = ' ';
    var res = chr.repeat(n) + s;
    return res.substring(res.length - n);
}

function left_justify(s, n) {
    var res = s + ' '.repeat(n);
    return res.substring(0, n + 1);
}

function htmlize_spaces(s) {
    return s.replace(' ', '&nbsp;');
}
