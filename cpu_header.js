function CPU() {
  this.b = 0;
  this.c = 0;
  this.d = 0;
  this.e = 0;
  this.h = 0;
  this.l = 0;
  this.a = 0;
  this.f = 0;
  this.pc = 0;
  var memSize = 65536;
  this.mem = new Array(memSize);
  for (var i = 0; i < memSize; i++) {
    this.mem[i] = 0;
  }
};
CPU.prototype.dumpReg = function() {
  var regs = ['b', 'c', 'd', 'e', 'h', 'l', 'a', 'f', 'pc'];
  for(var i in regs) {
    console.log(regs[i] + '=' + this[regs[i]]);
  }
};
// FLAGS: S Z x A x P x C
var CARRY = 1;
var PARITY = 4;
var A = 16;
var INTERRUPT = 32;
var ZERO = 64;
var SIGN = 128;
// Set the ZSCPA flags from b.
CPU.prototype.zscpa = function(b) {
  if (b > 255 || b < 0)
    this.f |= CARRY;
  b &= 0xff;
  if (b == 0)
    this.f |= ZERO;
  if ((b & 0x40) != 0)
    this.f |= SIGN;
  else
    this.f &= ~SIGN;
  this.parity(b);
  return b;
  // TODO: Aux Carry bit.
};
// Set the ZSPA flags from b.
CPU.prototype.zspa = function(b) {
};
CPU.prototype.parity = function(b) {
  var parity = true;
  var n = 1;
  for (var i = 0; i < 8; i++) {
    if ((n & b) != 0)
      parity = !parity;
    n *= 2;
  }
  return parity;
};
CPU.prototype.cmc = function() {
  if ((this.f & CARRY) != 0) {
    this.f &= ~CARRY;
  } else {
    this.f |= CARRY;
  }
};
CPU.prototype.stc = function() {
  this.f |= CARRY;
};
CPU.prototype.inr = function(b) {
  return this.zscp(++b);
};
CPU.prototype.dcr = function(b) {
  return this.zscp(--b);
};
///
var cpu = new CPU();
// mvi c, 0xff
cpu.mem[0] = 0x0e;
cpu.mem[1] = 0xff;
// mov b, c
cpu.mem[2] = 0x41;
// INC b   00000100
cpu.mem[3] = 0x04
