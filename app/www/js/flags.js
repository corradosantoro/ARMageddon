'use strict';

var FlagsView = {

    init : function() {
        this.flags_value = document.querySelectorAll('td[id^="flag-"]');
    },

    update : function(status) {
        this.flags_value.forEach(function(element){
            element.innerHTML = +status[element.id.slice(5)];
        });
    }
}