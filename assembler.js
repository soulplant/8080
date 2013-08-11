if (require) {
  parser = require('./asm-parser.js');
} else {
}

function removeSpaces(str) {
  while (true) {
    var next = str.replace(' ', '');
    if (next == str)
      return str;
    str = next;
  }
}

function bin2dec(str) {
  var result = 0;
  for (var i = 0; i < str.length; i++) {
    result *= 2;
    result += str.charAt(i) == '1';
  }
  return result;
}

// Represents an encoded instruction of 1-3 bytes in size.
function Frame(size) {
  this.size = size;
  this.bytes = [];
  for (var i = 0; i < size; i++)
    this.bytes.push(0);
};

function Bits(n, size, offset) {
  this.n = n;
  this.size = size;
  this.offset = offset;
}
Bits.prototype.toByte = function() {
  return this.n << this.offset;
};
Bits.prototype.addToFrame = function(frame) {
  frame.bytes[0] |= this.toByte();
};

function Immediate(n, size) {
  this.n = n;
  this.size = size;
};
Immediate.prototype.addToFrame = function(frame) {
  var lb = this.n & 0xff;
  frame.bytes[1] = lb;
  if (this.size == 16) {
    var hb = (this.n >> 8) & 0xff;
    frame.bytes[2] = hb;
  }
};

function Arg(name) {
  this.name = name;
}
Arg.prototype.encodeRegMem = function(op, offset) {
  var regs = ['b', 'c', 'd', 'e', 'h', 'l', 'm', 'a'];
  var i = regs.indexOf(op);
  if (i == -1)
    return null;
  return new Bits(i, 3, offset);
};
Arg.prototype.encodeRegPair = function(op) {
  var rps = ['bc', 'de', 'hl', 'sp'];
  var i = rps.indexOf(op);
  if (i == -1)
    return null;
  return new Bits(i, 2, 4);
};
Arg.prototype.encodeImmediate = function(op, size) {
  return new Immediate(op, size);
};
Arg.prototype.encode = function(op) {
  switch (this.name) {
    // Registers / [hl]
    case 'DDD':
    case 'SSS':
      var offset = this.name == 'DDD' ? 3 : 0;
      return this.encodeRegMem(op, offset);
    case 'RP':
    case 'bc':  // Constrained version of RP.
    case 'de':  // Constrained version of RP.
      return this.encodeRegPair(op);
    case 'arg16':
    case 'addr':
      return this.encodeImmediate(op, 16);
    case 'db':
      return this.encodeImmediate(op, 8);
  }
};

function Instruction(name, bitTemplate, mnemonicTemplate, size) {
  this.name = name;
  this.bitTemplate = removeSpaces(bitTemplate);
  this.mnemonicTemplate = mnemonicTemplate;
  this.size = size;
  this.args = this.parseMnemonicTemplate(mnemonicTemplate);
};
Instruction.prototype.parseMnemonicTemplate = function(template) {
  var i = template.indexOf(' ');
  if (i == -1)
    return [];
  var argListString = template.substring(i + 1);
  var args = argListString.replace(' ', '').split(',');
  return args.map(function(argStr, i) { return new Arg(argStr); });
};
Instruction.prototype.matches = function(asmStatement) {
  return asmStatement.name == this.name;
};
Instruction.prototype.getTemplateBits = function() {
};
Instruction.prototype.encode = function(asmStatement) {
  // bin2dec treats non-1 characters as zero.
  var base = bin2dec(this.bitTemplate);
  var frame = new Frame(this.size);
  frame.bytes[0] = base;

  this.args.forEach(function(arg, i) {
    arg.encode(asmStatement.ops[i]).addToFrame(frame);
  });

  return frame.bytes;
};

var mov = new Instruction('MOV', '01 DDD SSS', 'MOV DDD, SSS', 1);
var dad = new Instruction('DAD', '00 RP1 001', 'DAD RP', 1);
var mvi = new Instruction('MVI', '00 DDD 110', 'MVI DDD, db', 2);
asmStatement = {type: 'i', name: 'MOV', ops: ['a', 'b']};
asmStatement = {type: 'i', name: 'DAD', ops: ['hl']};
asmStatement = {type: 'i', name: 'MVI', ops: ['b', 7]};
// console.log(mov.encode(asmStatement));
// console.log(mvi.encode(asmStatement));

function i(name, template, disas, size) {
  return new Instruction(name, template, disas, size);
}

var instructionList = [
  i('NOP', '00000000', 'NOP', 1),
  i('LXI', '00RP0001', 'LXI RP, arg16', 3),
  i('DAD', '00RP1001', 'DAD', 1),
  i('STAX_B', '00000010', 'STAX bc', 1),
  i('STAX_D', '00010010', 'STAX de', 1),
  i('SHLD', '00100010', 'SHLD addr', 3),
  i('STA', '00110010', 'STA addr', 3),
  i('LDAX_BC', '00001010', 'LDAX RP', 1),
  i('LDAX_DE', '00011010', 'LDAX RP', 1),
  i('LHLD', '00101010', 'LHLD addr', 3),
  i('LDA', '00111010', 'LDA addr', 3),
  i('INX', '00RP0011', 'INX RP', 1),
  i('DCX', '00RP1011', 'DCX RP', 1),
  i('INR', '00DDD100', 'INR DDD', 1),
  i('DCR', '00DDD101', 'DCR DDD', 1),
  i('MVI', '00DDD110', 'MVI DDD, db', 2),
  i('RLC', '00000111', 'RLC', 1),
  i('RRC', '00001111', 'RRC', 1),
  i('RAL', '00010111', 'RAL', 1),
  i('RAR', '00011111', 'RAR', 1),
  i('DAA', '00100111', 'DAA', 1),
  i('CMA', '00101111', 'CMA', 1),
  i('STC', '00110111', 'STC', 1),
  i('CMC', '00111111', 'CMC', 1),
  i('HLT', '01110110', 'HLT', 1),
  i('MOV', '01DDDSSS', 'MOV DDD, SSS', 1),
  i('ADD', '10000SSS', 'ADD SSS', 1),
  i('ADC', '10001SSS', 'ADC SSS', 1),
  i('SUB', '10010SSS', 'SUB SSS', 1),
  i('SBB', '10011SSS', 'SBB', 1),
  i('ANA', '10100SSS', 'ANA', 1),
  i('XRA', '10101SSS', 'XRA', 1),
  i('ORA', '10110SSS', 'ORA', 1),
  i('CMP', '10111SSS', 'CMP SSS', 1),
  i('RET', '11CCC000', 'R CCC', 1),
  i('POP', '11RP0001', 'POP RP', 1),
  i('RET', '11001001', 'RET', 1),
  i('NOT_USED', '11011001', 'NOT_USED', 1),
  i('PCHL', '11101001', 'PCHL', 1),
  i('SPHL', '11111001', 'SPHL', 1),
  i('JMP', '11CCC010', 'J CCC', 3),
  i('JMP', '11000011', 'JMP addr', 3),
  i('NOT_USED', '11001011', 'NOT_USED', 1),
  i('OUT', '11010011', 'OUT', 1),
  i('IN', '11011011', 'IN', 1),
  i('XTHL', '11100011', 'XTHL', 1),
  i('XCHG', '11101011', 'XCHG', 1),
  i('DI', '11110011', 'DI', 1),
  i('EI', '11111011', 'EI', 1),
  i('CALL', '11CCC100', 'C CCC addr', 3),
  i('PUSH', '11RP0101', 'PUSH RP', 1),
  i('CALL', '11001101', 'CALL addr', 3),
  i('NOT_USED', '11011101', 'NOT_USED', 1),
  i('NOT_USED', '11101101', 'NOT_USED', 1),
  i('NOT_USED', '11111101', 'NOT_USED', 1),
  i('ADI', '11000110', 'ADI', 2),
  i('ACI', '11001110', 'ACI', 2),
  i('SUI', '11010110', 'SUI', 2),
  i('SBI', '11011110', 'SBI', 2),
  i('ANI', '11100110', 'ANI', 2),
  i('XRI', '11101110', 'XRI', 2),
  i('ORI', '11110110', 'ORI', 2),
  i('CPI', '11111110', 'CPI', 2),
  i('RST_P', '11PPP111', 'RST_P', 1),
  i('UNK', 'xxxxxxxx', 'UNK', 1),
];

function lookupInstruction(name) {
  name = name.toUpperCase();
  for (var i = 0; i < instructionList.length; i++) {
    var ins = instructionList[i];
    if (ins.name == name)
      return ins;
  }
  return null;
}

function Assembler(parsed) {
  this.parsed = parsed;
  this.bytes = [];
};
Assembler.prototype.assemble = function() {
  for (var i = 0; i < this.parsed.length; i++) {
    var p = this.parsed[i];
    switch (p.type) {
    case 'i':
      this.handleInstruction(p);
      break;
    case 'label':
      // TODO(koz): Implement.
      break;
    }
  }
  return this.bytes;
};
Assembler.prototype.handleInstruction = function(p) {
  var i = lookupInstruction(p.name);
  this.addBytes(i.encode(p));
};
Assembler.prototype.addBytes = function(bs) {
  for (var i = 0; i < bs.length; i++)
    this.bytes.push(bs[i]);
};

var program = 'mov a, b';
console.log('assembler.js test');
console.log('assembling program "' + program + '"');
var a = new Assembler(parser.parse('mov a, b'));
var bytes = a.assemble();
console.log(bytes);
