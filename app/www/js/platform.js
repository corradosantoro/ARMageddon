'use strict';

class Region {
    static RAM = 0;
    static ROM = 1;

    constructor(address, size, type) {
        this.base_address = address;
        this.limit = address;
        this.size = size;
        this.end_address = this.base_address + size;
        this.type = type;
        this.memory = [ ];
        for (var i = 0; i < this.size;i++) this.memory.push(0xff);
    }

    in_limit(address) {
        return address >= this.base_address && address < this.limit;
    }

    can_access(address) {
        return address >= this.base_address && address < this.end_address;
    }

    can_read(address) {
        return address >= this.base_address && address < this.end_address;
    }

    read_8(address) {
        return this.memory[address - this.base_address];
    }

    read_16(address) {
        var v0 = this.read_8(address);
        var v1 = this.read_8(address+1);
        var word = v0 | (v1 << 8);
        return word;
    }

    read_32(address) {
        var v0 = this.read_16(address);
        var v1 = this.read_16(address + 2);
        var dword = v0 | (v1 << 16);
        return dword;
    }

    load_memory(bytes, address) {
        if (address == undefined) address = this.base_address;
        var offset = address - this.base_address;
        for (var i = 0; i < bytes.length;i++) {
            this.ensure_space(address + i);
            this.memory[offset + i] = bytes[i]
        }
    }

    ensure_space(address) {
        if (address > this.limit) {
            this.limit += 1024;
            if (this.limit >= this.end_address)
                this.limit = this.end_address;
        }
    }

}

class BareArmPlatform {

    constructor() {
        this.regions = [];
        this.base_address = 0x08000000;
        this.cached_region = undefined;
    }

    reset(status) {
        for (var i = 0; i < 14;i++)
            status.registers[i] = 0;
        status.registers[15] = this.base_address;
    }

    add_region(regn) {
        this.regions.push(regn);
    }

    find_region_by_type(typ) {
        for (var i = 0; i < this.regions.length;i++) {
            var r = this.regions[i];
            if (r.type == typ)
                return r;
        }
        return undefined;
    }

    find_region(address) {
        for (var i = 0; i < this.regions.length;i++) {
            var r = this.regions[i];
            if (r.can_access(address))
                return r;
        }
        return undefined;
    }

    in_limit(address) {
        if (this.cached_region != undefined) {
            return this.cached_region.in_limit(address);
        }
        this.cached_region = this.find_region(address);
        return this.cached_region.in_limit(address);
    }

    can_read(address) {
        if (this.cached_region != undefined) {
            return this.cached_region.can_read(address);
        }
        this.cached_region = this.find_region(address);
        return this.cached_region.can_read(address);
    }

    read_8(address) {
        if (this.cached_region != undefined) {
            if (this.cached_region.can_access(address))
                return this.cached_region.read_8(address);
        }
        this.cached_region = this.find_region(address);
        if (this.cached_region == undefined) {
            console.log("Invalid access at address 0x" + address.toString(16));
            return undefined;
        }
        else
            return this.cached_region.read_8(address);
    }

    read_16(address) {
        var v0 = this.read_8(address);
        var v1 = this.read_8(address+1);
        var word = v0 | (v1 << 8);
        return word;
    }

    read_32(address) {
        var v0 = this.read_16(address);
        var v1 = this.read_16(address + 2);
        var dword = v0 | (v1 << 16);
        return dword;
    }

}


class STM32F4 extends BareArmPlatform {

    constructor() {
        super();
    }

    reset(status) {
        super.reset(status);
        var sp = this.read_32(this.base_address) & 0xfffffff2;
        var pc = this.read_32(this.base_address + 4) & 0xfffffff2;
        status.registers[15] = pc;
        status.registers[13] = sp;
    }

}
