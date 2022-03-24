'use strict';


var RegisterView = {

    init : function() {
        this.registers_hex = [];
        this.registers_dec = [];
        for (var i = 0;i < 16;i++) {
            this.registers_hex.push(document.getElementById('r' + i + '-hex'));
            this.registers_dec.push(document.getElementById('r' + i + '-dec'));
        }
    },

    update : function(status) {
        for (var i = 0;i < 16;i++) {
            this.registers_hex[i].innerHTML = "0x" + right_justify((status.registers[i]>>>0).toString(16).toUpperCase(), 8, '0');
            this.registers_dec[i].innerHTML = status.registers[i];
        }
    }


};
