'use strict';


var Indicators = {

    led_on : function(el) {
        var e = document.getElementById(el);
        //console.log(e.className);
        if (e.className.match("red")) {
            e.style.backgroundColor = '#F00';
        }
        else if (e.className.match("green")) {
            e.style.backgroundColor = '#0F0';
        }
        else if (e.className.match("blue")) {
            e.style.backgroundColor = '#00F';
        }
    },

    led_off : function(el) {
        var e = document.getElementById(el);
        if (e.className.match("red")) {
            e.style.backgroundColor = '#600';
        }
        else if (e.className.match("green")) {
            e.style.backgroundColor = '#060';
        }
        else if (e.className.match("blue")) {
            e.style.backgroundColor = '#006';
        }
    },

    run_state : function() {
        this.led_on('run');
        this.led_off('step');
        this.led_off('reset');
        this.led_off('invalid');
    },

    reset_state : function() {
        this.led_off('run');
        this.led_off('step');
        this.led_off('reset');
        this.led_off('invalid');
    },

    step_state : function() {
        this.led_on('run');
        this.led_on('step');
        this.led_off('reset');
        this.led_off('invalid');
    },

    halt_state : function(arm)  {
        this.led_on('run');
        this.led_off('step');
        this.led_on('reset');
        if (arm.invalid_instruction)
            this.led_on('invalid');
        else
            this.led_off('invalid');
    },

    init : function() {
        this.led_off('run');
        this.led_on('reset');
        this.led_off('step');
        this.led_off('invalid');
    }

};
