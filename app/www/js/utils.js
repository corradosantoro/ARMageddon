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
