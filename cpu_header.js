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
// FLAGS: S Z x A x P x C
var CARRY = 1;
var PARITY = 4;
var A = 16;
var ZERO = 128;
var SIGN = 256;
// Set the ZSCPA flags from b.
CPU.prototype.zscpa = function(b) {
  this.zspa(b);
};
// Set the ZSPA flags from b.
CPU.prototype.zspa = function(b) {
};
CPU.prototype.inr = function(b) {
  b++;
  if (b > 255)
    this.f |= CARRY;
  b &= 0xff;
  if (b == 0)
    this.f |= ZERO;
  return b;
};
CPU.prototype.dcr = function(b) {
  b--;
  if (b < 0)
    this.f |= CARRY;
  b &= 0xff;
  if (b == 0)
    this.f |= ZERO;
  return b;
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
