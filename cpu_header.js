function CPU() {
  this.b = 0;
  this.c = 0;
  this.d = 0;
  this.e = 0;
  this.h = 0;
  this.l = 0;
  this.a = 0;
  this.pc = 0;
  var memSize = 65536;
  this.mem = new Array(memSize);
  for (var i = 0; i < memSize; i++) {
    this.mem[i] = 0;
  }
};
CPU.prototype.dumpReg = function() {
  var regs = ['b', 'c', 'd', 'e', 'h', 'l', 'a', 'pc'];
  for(var i in regs) {
    console.log(regs[i] + '=' + this[regs[i]]);
  }
};
///
var cpu = new CPU();
// mvi c, 9
cpu.mem[0] = 0x0e;
cpu.mem[1] = 0x09;
// mov b, c
cpu.mem[2] = 0x41;
// INC b   00000100
cpu.mem[3] = 0x04
