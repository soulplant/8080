function CPU() {
  this.b = 0;
  this.c = 0;
  this.d = 0;
  this.e = 0;
  this.h = 0;
  this.l = 0;
  this.a = 0;
  this.f = 0;
  this.pc = 0;  // 16bit
  this.sp = 0;  // 16bit
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
CPU.prototype.load = function(bs) {
  for (var i = 0; i < bs.length; i++) {
    this.mem[i] = bs[i];
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
CPU.prototype.rpValue = function(rp) {
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
CPU.prototype.dad = function(rp) {
  var result = this.rpValue(rp) + this.rpValue('hl');
  console.log(result);
  this.setFlag(CARRY, result > 0xffff);
  this.loadImmU16('hl', result & 0xffff);
};
///
var cpu = new CPU();
var programs = {
  'dad': [
    // MVI h, 0xff
    0x26, 0xff,  // 0010 0110
    // MVI l, 0x01
    0x2e, 0x01,  // 0010 1110
    // DAD HL
    0x29,        // 0010 1001
  ],
  'shld': [
    // MVI h, 1
    0x26, 0x01,        // 0010 0110
    // MVI l, 2
    0x2e, 0x02,        // 0010 1110
    // SHLD [0x0102]
    0x22, 0x02, 0x01,  // 0010 0010
    // MVI h, 8
    0x26, 0x08,        // 0010 0110
    // MVI l, 8
    0x2e, 0x08,        // 0010 1110
    // LHLD [0x0102]
    0x2a, 0x02, 0x01,  // 0010 1010
  ],
  'lda': [
    // LDA [0x0000]
    0x3a, 0x00, 0x00,  // 0011 1010
    // STA [0x0008]
    0x32, 0x08, 0x00,  // 0011 0010
  ],
  'stax': [
    // MVI A, 8
    0x3e, 0x08,   // 0011 1110
    // MVI C, 8
    0x0e, 0x08,   // 0000 1110
    // STAX B
    0x2,          // 0000 0010
    // MVI A, 3
    0x3e, 0x03,   // 0011 1110
    // LDAX B
    0x0a          // 0000 1010
  ],
  'lxi': [
    // LXI b, 258
    0x1, 0x1, 0x2,

    // LXI c, 258
    0x31, 0x1, 0x2
  ],
  'inr': [
  // MVI c, 0xff
  0x0e, 0xff,
  // MOV b, c
  0x41,
  // INR b
  0x04,
  // INR b
  0x04,
  // INR b
  0x04,
  // INR hl
  0x34,
  // hlt
  0x76,
  ],
};
cpu.load(programs['dad']);
