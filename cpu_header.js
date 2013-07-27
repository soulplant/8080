function CPU() {
  this.b = 0;
  this.c = 0;
  this.d = 0;
  this.e = 0;
  this.h = 0;
  this.l = 0;
  this.a = 0;
  this.pc = 0;
  this.mem = new Array(65536);
};
CPU.prototype.dumpReg = function() {
  var regs = ['b', 'c', 'd', 'e', 'h', 'l', 'a', 'pc'];
  for(var i in regs) {
    console.log(regs[i] + '=' + this[regs[i]]);
  }
};
///
var c = new CPU();
// mvi c, 9
c.mem[0] = 0x0e;
c.mem[1] = 0x09;
// mov b, c
c.mem[2] = 0x41;
// INC b   00000100
c.mem[3] = 0x04

c.dumpReg();
console.log('');
c.execute();
c.execute();
c.execute();
c.dumpReg();
