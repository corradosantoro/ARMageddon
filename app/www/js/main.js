'use strict';

var currentFirmware = undefined;

var arm;
var arm_core;
var freq = 80e6; // 80MHz

function run() {
    var ticks = parseFloat(freq * 0.001); // 1ms

    while (ticks > 0) {
        arm.step();
        if (arm.halted) {
            Indicators.halt_state(arm);
            RegisterView.update(arm.get_status());
            Disassembler.lineHighlight(arm.get_register(15));
            return;
        }
        ticks--;
    }
    RegisterView.update(arm.get_status());
    setTimeout(1, run);
}

$(document).ready(function () {
    console.log('ARMageddon starting');

    RegisterView.init();

    $('#open').on('click', function(evt) {
        FileOperations.open(function(binary) {
            arm_core.find_region_by_type(Region.ROM).load_memory(binary);
            reset();
            RegisterView.update(arm.get_status());
            Disassembler.update(arm);
        });
    });

    $('#reset').on('click', function(evt) {
        reset();
        RegisterView.update(arm.get_status());
    });

    $('#run').on('click', function(evt) {
        Indicators.run_state();
        run();
    });

    $('#step').on('click', function(evt) {
        if (!arm.halted) {
            Indicators.step_state();
            arm.step();
            RegisterView.update(arm.get_status());
            Disassembler.lineHighlight(arm.get_pc());
        }
        else {
            Disassembler.lineHighlight(arm.get_pc());
            Indicators.halt_state(arm);
        }
    });

    //arm_core = new STM32F4();
    arm_core = new BareArmPlatform();
    arm_core.add_region(new Region(0x08000000, 2**16, Region.ROM))

    arm = new Arm(arm_core, ARM_MODE.THUMB);

    Disassembler.init();
    Indicators.init();
});

function reset()
{
    Indicators.reset_state();
    arm.reset();
}


function hide_element(el) {
    var e = document.getElementById(el);
    e.style.visibility="hidden";
}

function show_element(el) {
    var e = document.getElementById(el);
    e.style.visibility="";
}

