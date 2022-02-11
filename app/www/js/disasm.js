'use strict';


var Disassembler = {

    OpList : [ ],
    selectedLine: -1,
    AddressMap : [ ],

    currentHighlighted : undefined,

    disasm_line : function(instr) {
        var s = "0x" + right_justify(instr.address.toString(16).toUpperCase(), 8, '0') + htmlize_spaces("    ") +
            htmlize_spaces(left_justify(instr.mnemonic, 6)) + " " + instr.op_str;
        return s;
    },

    update : function(arm) {
        var $this = this;
        var instructions = arm.disassemble();

        //console.log(instructions);

        this.OpList = [ ];
        this.AddressMap = [ ];

        // Display results;
        for (var i = 0; i < instructions.length;i++) {
            var instr = instructions[i];
            //console.log(instr);
            // Instruction
            // id: 427
            // address: 134217766
            // size: 2
            // bytes: (2) [0, 191]
            // mnemonic: "nop"
            // op_str: ""
            Disassembler.OpList.push(Disassembler.disasm_line(instr));//new DisasmLine(instr));
            this.AddressMap[instr.address.toString(16)] = i;
        }

        this.updateFrame();

        // Delete decoder
        //d.close();
    },

    updateFrame : function() {
        $("#disasm-box").empty();
        var $this = this;
        var theHtml = "";
        for (var i = 0; i < this.OpList.length;i++) {
            var x = this.OpList[i];
            var htmltext;
            htmltext = '<div id="disasm-line-' + i + '" class="disasm-line">' + x + '</div>';//<br/>';
            theHtml = theHtml + htmltext;
        }

        var $this = this;
        document.getElementById("disasm-box").innerHTML = theHtml;
        for (var i = 0; i < this.OpList.length;i++) {
            var e = document.getElementById('disasm-line-' + i);
            e.array_index = i;
            e.onclick =
                function(evt) {
                    $this.lineClicked(evt.target.array_index);
                };
        }
    },

    lineHighlight : function(address) {
        if (this.currentHighlighted) {
            this.currentHighlighted.style.backgroundColor = "#999";
        }
        var line = this.AddressMap[address.toString(16)];
        if (line != undefined) {
            var line_element = document.getElementById("disasm-line-" + line);
            var rect = line_element.getBoundingClientRect();
            var rect_parent = document.getElementById("disasm-box").getBoundingClientRect();
            document.getElementById("disasm-box").scrollTop = rect.top - rect_parent.top;
            line_element.style.backgroundColor = "#f00";
            this.currentHighlighted = line_element;
        }
    },

    lineClicked : function(n) {
        if (this.selectedLine >= 0)
            this.lineSelected(this.selectedLine, false);
        this.selectedLine = n;
        this.lineSelected(this.selectedLine, true);
    },

    lineSelected : function(line, is_sel) {
        var line_element = document.getElementById("disasm-line-" + line);
        if (line_element != undefined) {
            if (is_sel)
                line_element.style.backgroundColor = "#0ff";
            else
                line_element.style.backgroundColor = "#999";
        }
    }

};


