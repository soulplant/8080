function CPU() {
  this.reset();
};
CPU.prototype.dumpReg = function() {
  var regs = ['b', 'c', 'd', 'e', 'h', 'l', 'a', 'f', 'pc'];
  for (var i in regs) {
    console.log(regs[i] + '=' + this[regs[i]]);
  }
};
CPU.prototype.load = function(bs) {
  for (var i = 0; i < bs.length; i++) {
    this.mem[i] = bs[i];
  }
};
CPU.prototype.reset = function() {
  var memSize = 0x10000;
  this.b = 0;
  this.c = 0;
  this.d = 0;
  this.e = 0;
  this.h = 0;
  this.l = 0;
  this.a = 0;
  this.f = 0x02;  // sz0a 0p1c
  this.pc = 0;    // 16bit
  this.sp = memSize - 1;    // 16bit
  this.mem = new Array(memSize);
  for (var i = 0; i < memSize; i++) {
    this.mem[i] = 0;
  }
}
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
CPU.prototype.getFlag = function(f) {
  return (this.f & f) > 0;
};
CPU.prototype.rpValue = function(rp) {
  if (rp == 'sp')
    return this.sp;
  return (this[rp[0]] << 8) | this[rp[1]];
};
CPU.prototype.storeU16 = function(addr, u16) {
  this.mem[addr] = 0xff & u16;
  this.mem[addr+1] = 0xff & (u16 >> 8);
};
CPU.prototype.loadU16 = function(rp, addr) {
  this[rp[1]] = this.mem[addr];
  this[rp[0]] = this.mem[addr+1];
};
CPU.prototype.loadImmU16 = function(rp, u16) {
  if (rp == 'sp') {
    this.sp = u16;
    return;
  }
  this[rp[0]] = (u16 >> 8) & 0xff;
  this[rp[1]] = u16 & 0xff;
};
CPU.prototype.add = function(b, n, c) {
  this.setFlag(AUX_CARRY, (b & 0x7) + (n & 0x7) > 0x7);
  var result = b + n;
  if (c)
    this.setFlag(CARRY, result > 0xff);
  result &= 0xff;
  this.zsp(result);
  return result;
};
CPU.prototype.sub = function(b, n, c) {
  var result = this.add(b, -n & 0xff, c);
  this.setFlag(CARRY, !this.getFlag(CARRY));
  return result;
};
CPU.prototype.zsp = function(result) {
  this.setFlag(ZERO, result == 0);
  this.setFlag(SIGN, (result & 0x80) != 0);
  this.setFlag(PARITY, this.parity(result));
};
CPU.prototype.inr = function(b) {
  return this.add(b, 1, false /* no carry */);
};
CPU.prototype.dcr = function(b) {
  return this.sub(b, 1, false /* no carry */);
};
CPU.prototype.dad = function(rp) {
  var result = this.rpValue(rp) + this.rpValue('hl');
  console.log(result);
  this.setFlag(CARRY, result > 0xffff);
  this.loadImmU16('hl', result & 0xffff);
};
CPU.prototype.daa = function() {
  var low4 = this.a & 0xf;
  if (low4 > 9 || this.getFlag(AUX_CARRY)) {
    this.setFlag(AUX_CARRY, low4 + 6 > 0xf);
    this.a += 6;
  }
  var high4 = (this.a >> 4) & 0xf;
  if (high4 > 9 || this.getFlag(CARRY)) {
    if (high4 + 6 > 0xf)
      this.setFlag(CARRY, true);
    high4 = (high4 + 6) & 0xf;
    this.a = (high4 << 4) | (this.a & 0xf);
  }
};
CPU.prototype.push = function(rp) {
  if (rp == 'sp')
    rp = 'af';
  this.mem[this.sp - 1] = this[rp[0]];
  this.mem[this.sp - 2] = this[rp[1]];
  this.sp -= 2;
  this.sp &= 0xffff;
};
CPU.prototype.pop = function(rp) {
  if (rp == 'sp')
    rp = 'af';
  this[rp[0]] = this.mem[this.sp + 1];
  this[rp[1]] = this.mem[this.sp];
  this.sp += 2;
  this.sp &= 0xffff;
};
///
