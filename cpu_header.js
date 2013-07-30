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
var AUX_CARRY = 16;
var INTERRUPT = 32;
var ZERO = 64;
var SIGN = 128;
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
CPU.prototype.setFlag = function(f, v) {
  if (v)
    this.f |= f;
  else
    this.f &= ~f;
};
CPU.prototype.add = function(b, n, c) {
  this.setFlag(AUX_CARRY, (b & 0x7) + (n & 0x7) > 0x7);
  var result = b + n;
  if (c)
    this.setFlag(CARRY, result > 0xff);
  result &= 0xff;
  this.setFlag(SIGN, (result & 0x40) != 0);
  this.setFlag(ZERO, result == 0);
  this.setFlag(PARITY, this.parity(result));
  return result;
};
CPU.prototype.sub = function(b, n, c) {
  this.setFlag(AUX_CARRY, (b & 0x7) < (n & 0x7));
  var result = b - n;
  if (c)
    this.setFlag(CARRY, result < -128);
  result &= 0xff;
  this.setFlag(SIGN, (result & 0x40) != 0);
  this.setFlag(ZERO, result == 0);
  this.setFlag(PARITY, this.parity(result));
  return result;
};
CPU.prototype.inr = function(b) {
  return this.add(b, 1, false /* no carry */);
};
CPU.prototype.dcr = function(b) {
  return this.sub(b, 1, false /* no carry */);
};
CPU.prototype.cmc = function() {
  this.setFlag(CARRY, (this.f & CARRY) != 0);
};
CPU.prototype.stc = function() {
  this.setFlag(CARRY, true);
};
///
var cpu = new CPU();
// mvi c, 0xff
cpu.mem[0] = 0x0e;
cpu.mem[1] = 0xff;
// mov b, c
cpu.mem[2] = 0x41;
// inr b   00000100
cpu.mem[3] = 0x04
// inr b   00000100
cpu.mem[4] = 0x04
// inr b   00000100
cpu.mem[5] = 0x04
// inr hl  00110100
cpu.mem[6] = 0x34
// hlt     01110110
cpu.mem[7] = 0x76
