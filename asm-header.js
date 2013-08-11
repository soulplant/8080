if (typeof require !== 'undefined')
  parser = require('./asm-parser.js');

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
Arg.prototype.encodeCondition = function(op) {
  var conditions = ['nz', 'z', 'nc', 'c', 'po', 'pe', 'p', 'm'];
  var i = conditions.indexOf(op.toLowerCase());
  if (i < 0)
    return null;
  return new Bits(i, 3, 3);
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
    case 'CCC':
      return this.encodeCondition(op);
    default:
      return null;
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

  if (this.args.length != asmStatement.ops.length)
    throw this.name + " xpected " + this.args.length + " args, got " + asmStatement.ops.length;

  this.args.forEach(function(arg, i) {
    var encodedArg = arg.encode(asmStatement.ops[i]);
    if (!encodedArg)
      throw this.name + " couldn't encode arg " + i + " - " + asmStatement.ops[i];
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

///var instructionList;

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
  if (!i)
    throw "Unknown instruction: " + p.name;
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
