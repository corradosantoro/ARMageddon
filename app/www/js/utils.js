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
 * Function that took two integers returns the overflow.
 * @param {number} x First operand 
 * @param {number} y Second operand
 * @param {string} res Result of the sum or difference between x and y
 */
function overflowFrom(x, y, res) {
    let x_bit = x >>> 31;
    let y_bit = y >>> 31;
    let res_bit = res >>> 31;
    return !!((x_bit == y_bit) && (res_bit != x_bit & res_bit != y_bit) && (res > 0x80000000-y || res < -0x80000000+y));
}

function isZero(n){
    return n == 0 ? true: false;
}

function isNeg(n){
    return !!(( n >>> (31) ) & 0x1);
}

/**
 * Add and update flags
 * @returns [result, c, v, n, z]
 */
function add_c(x, y) {
	var result, c, v, n, z;
    result = (x+y);
    v = overflowFrom(x,y,result);
 	if((result>>>0) > REG_LIMIT)
        c = true;
    else 
        c = false;
    result &= 0xffffffff;
    z = isZero(result);
    n = isNeg(result);
	return [result, c, v, n, z];
}

/**
 * Add + carryF and update flags
 * @returns [result, c, v, n, z]
 */
 function adc_c(x, y, c_in) {
	var result, c_out, v, n, z;
    result = (x+y+c_in);
    v = overflowFrom(x,y+c_in,result);
 	if((result>>>0) > REG_LIMIT)
        c_out = true;
    else 
        c_out = false;
    result &= 0xffffffff;
    z = isZero(result);
    n = isNeg(result);
	return [result, c_out, v, n, z];
}

/**
 * Sub and update flags
 * @returns [result, c, v, n, z]
 */
function sub_c(x,y){
	var result, c, v, n, z;
    result = (x-y);
    v = overflowFrom(x,y,result);
    if(x < y)
        c = false;
    else 
  	    c = true;
    result &= 0xffffffff;
    z = isZero(result);
    n = isNeg(result);
	return [result, c, v, n, z];
}

/**
 * Sub - carryF and update flags
 * @returns [result, c, v, n, z]
 */
 function sbc_c(x,y, c_in){
	var result, c_out, v, n, z;
    result = (x-y-c_in);
    v = overflowFrom(x,y-c_in,result);
    if(x < y)
        c_out = false;
    else 
        c_out = true;
    result &= 0xffffffff;
    z = isZero(result);
    n = isNeg(result);
	return [result, c_out, v, n, z];
}

/**
 * Mul and update flags N and Z
 * @returns [result, n, z]
 */
function mul_c(x, y){
    var result, n, z;
    result = x*y;
    result &= 0xffffffff;
    n = isNeg(result);    
    z = isZero(result); 
    return [result, n, z];
}

/**
 * Bitwise operations
 * @param {string} type Mnemonic instruction: AND, EOR, ORR, BIC, NEG, CMP, CMN, MVN
 * @returns [result, n, z] or [result, c, v, n, z]
 */
function bitwiseOp(first,second, type){
    var result, c, v, n, z;
    switch (type) {
        case "AND":
            result = first & second;
            break;
        case "EOR":
            result = first ^ second;
            break;
        case "ORR":
            result = first | second;
            break;
        case "BIC":
            result = first & (~second);
            break;
        case "NEG":
            [result, c, v, n, z] = sub_c(0, second);
            return [result, c, v, n, z];
        case "CMP":
            [result, c, v, n, z] = sub_c(first, second);
            return [result, c, v, n, z];
        case "CMN":
            [result, c, v, n, z] = add_c(first, second);
            return [result, c, v, n, z];
        case "MVN":
            result = (~second);
            break;            
        default:
            break;
    }
    n = isNeg(result);    
    z = isZero(result); 
    return [result, n, z];
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
