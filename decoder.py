import bintools
import re

class K:
  regs = ['b', 'c', 'd', 'e', 'h', 'l', 'm', 'a']
  regPairs = ['bc', 'de', 'hl', 'sp']
  condNames = ['NZ', 'Z', 'NC', 'C', 'PO', 'PE', 'P', 'M']
  def __init__(self, b, addrExpr):
    self.b = b
    self.addrExpr = addrExpr

  def reg(self, i):
    return 'this.' + K.regs[i]

  def ccc_I(self):
    return self.ddd_I()

  def ccc(self):
    return str(self.ccc_I())

  def cccName(self, i):
    return self.jsQuote(K.condNames[i])

  def ddd(self):
    i = self.ddd_I()
    if i == 0x6:
      return self.hl()
    return self.reg(i)

  def ddd_I(self):
    return (self.b & (0x7 << 3)) >> 3

  def sss(self):
    i = self.sss_I()
    if i == 0x6:
      return self.hl()
    return self.reg(i)

  def sss_I(self):
    return self.b & 0x7

  def db(self):
    return 'this.mem[' + self.addrExpr + '+1]'

  def arg16(self):
    return '((this.mem[' + self.addrExpr + '+1]) | (this.mem[' + self.addrExpr + '+2] << 8))'

  def mem(self, expr):
    return 'this.mem[' + expr + ']';

  def hl(self):
    return self.mem('(this.h << 8) | (this.l)')

  def regName(self, i):
    return '"' + K.regs[i] + '"'

  def addrName(self):
    return '"[" + int2hex(' + self.arg16() + ', 4) + "]"'

  def arg16Name(self):
    return self.arg16()

  def rpIndex(self):
    return (self.b >> 4) & 0x3

  def rpName(self):
    return self.jsQuote(K.regPairs[self.rpIndex()])

  def rpValue(self):
    return 'this.rpValue(' + self.rpName() + ')'

  def rpMem(self):
    return self.mem(self.rpValue())

  def jsQuote(self, s):
    return '"' + s + '"'

  # TODO: Prefix these variables with $.
  def go(self, note):
    if re.search('SSS', note):
      note = re.sub('SSS', self.sss(), note)
    if re.search('DDD', note):
      note = re.sub('DDD', self.ddd(), note)
    if re.search('CCC', note):
      note = re.sub('CCC', self.ccc(), note)
    if re.search('db', note):
      note = re.sub('db', self.db(), note)
    if re.search('mref', note):
      note = re.sub('mref', self.mem(self.arg16()), note)
    if re.search('HL', note):
      note = re.sub('HL', self.hl(), note)
    if re.search('RP_VAL', note):
      note = re.sub('RP_VAL', self.rpValue(), note)
    if re.search('RP_NAME', note):
      note = re.sub('RP_NAME', self.rpName(), note)
    if re.search('RP_MEM', note):
      note = re.sub('RP_MEM', self.rpMem(), note)
    if re.search('arg16', note):
      note = re.sub('arg16', self.arg16(), note)
    return note

  def subWord(self, word):
    if word == 'SSS':
      return self.regName(self.sss_I())
    elif word == 'DDD':
      return self.regName(self.ddd_I())
    elif word == 'CCC':
      return self.cccName(self.ccc_I())
    elif word == 'addr':
      return self.addrName()
    elif word == 'db':
      return self.db()
    elif word == 'RP':
      return self.rpName()
    elif word == 'arg16':
      return self.arg16Name()
    else:
      return '"' + word + '"'

class Instruction:
  def __init__(self, prefix, p1, p2, name, size, skip):
    self.prefix = prefix
    self.p1 = p1
    self.p2 = p2
    self.name = name
    self.size = size
    self.skip = skip
    self.notes = []
    self.disas = None

  def template(self):
    r = self.prefix + self.p1 + self.p2
    return re.sub(r'[a-zA-Z]', '0', r)

  def templateMask(self):
    r = self.prefix + self.p1 + self.p2
    r = re.sub(r'[01]', '1', r)
    return re.sub(r'[a-zA-Z]', '0', r)

  def match(self, b):
    tm = bintools.bin2dec(self.templateMask())
    t = bintools.bin2dec(self.template())
    return (tm & b) == t

  # TODO(koz): This should live outside this class.
  def kompile(self, b):
    result = []
    k = K(b, 'this.pc')
    for note in self.notes:
      result.append(k.go(note))
    if self.skip > 0:
      result.append('this.pc += ' + str(self.skip) + ';')
    return result

  # TODO(koz): This should live outside this class.
  def genDisas(self, b):
    result = []
    k = K(b, 'addr')
    if self.disas is None:
      return ['return ["' + self.name + '", ' + str(self.size) + '];']
    d = self.disas
    d = re.sub(',', '', d)
    parts = [k.subWord(word) for word in d.split(' ')]
    jsDisas = ' + " " + '.join(parts)
    result.append('return [' + jsDisas + ', ' + str(self.size) + '];')
    return result

  def __repr__(self):
    return '%s [%s%s%s]' % (self.name, self.prefix, self.p1, self.p2)

class DecoderTable:
  def __init__(self, filename):
    self.instructions = []
    with open('decoder_table') as f:
      disas = None
      notes = []
      for line in f:
        line = line.rstrip()
        if line == '':
          continue
        if line[0] == ' ':
          sline = line.strip()
          if sline[0] == '#':
            disas = sline[1:].strip()
          else:
            notes.append(sline)
          continue
        if len(notes) > 0:
          self.instructions[-1].notes = notes
          notes = []
        if disas is not None:
          self.instructions[-1].disas = disas
          disas = None
        parts = line.split(' ')
        size = 1
        if len(parts) >= 5:
          size = int(parts[4])
        skip = size
        if len(parts) >= 6:
          skip = int(parts[5])
        instruction = Instruction(parts[0], parts[1], parts[2], parts[3], size, skip)
        self.instructions.append(instruction)
      if len(notes) > 0:
        self.instructions[-1].notes = notes
        notes = []
      if disas is not None:
        self.instructions[-1].disas = disas

  def lookupInstruction(self, b):
    for i in self.instructions:
      if i.match(b):
        return i