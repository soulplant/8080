#!/usr/bin/python
import re
import sys

def bin2dec(bs):
  result = 0
  for c in bs:
    result *= 2
    if c == '1':
      result += 1
  return result

def baseSwitch(n, base, size):
  result = ''
  b = len(base)
  for i in range(size):
    result = base[n % b] + result
    n /= b
  return result

def int2bin(n, size):
  return baseSwitch(n, '01', size)

def int2hex(n, size):
  return baseSwitch(n, '0123456789abcdef', size)

def ints2bin(ns, size):
  result = ''
  for n in ns:
    prefix = '' if result == '' else ' '
    result += prefix + int2bin(n, size)
  return result

def hex2bin(n):
  dec = '0123456789abcdef'.index(n)
  result = ''
  for i in range(4):
    result = str(dec % 2) + result
    dec /= 2
  return result
  
def hex2binCmd():
  while True:
    r = sys.stdin.readline()
    if r == '':
      break
    s = ''
    for c in r:
      if c == '\n':
        break
      s += hex2bin(c)
    print s

program = [0x0e, 0x09,  # mvi c, 9
           0x4a,        # mov c, d
           0x0e, 0x64,  # mvi c, 100
           0x91,        # sub c, 5
           ]
# program = [0x0e, 0x09]  # mvi c, 9

def parseTable(lines):
  for line in lines:
    parts = line.split(' ')

class Instruction:
  def __init__(self, prefix, p1, p2, name, size, skip):
    self.prefix = prefix
    self.p1 = p1
    self.p2 = p2
    self.name = name
    self.size = size
    self.skip = skip
    self.notes = []

  def template(self):
    r = self.prefix + self.p1 + self.p2
    return re.sub(r'[a-zA-Z]', '0', r)

  def templateMask(self):
    r = self.prefix + self.p1 + self.p2
    r = re.sub(r'[01]', '1', r)
    return re.sub(r'[a-zA-Z]', '0', r)

  def match(self, b):
    tm = bin2dec(self.templateMask())
    t = bin2dec(self.template())
    return (tm & b) == t

  def kompile(self, b):
    regs = ['b', 'c', 'd', 'e', 'h', 'l', 'm', 'a']
    class K:
      def __init__(self, note):
        self.note = note

      def reg(self, i):
        return 'this.' + regs[i]

      def ddd(self):
        return self.reg((b & (0x7 << 3)) >> 3)

      def sss(self):
        return self.reg(b & 0x7)

      def db(self):
        return 'this.mem[this.pc+1]'

      def addr(self):
        # return 'this.addr()'
        return 'this.mem[(this.mem[this.pc+1] << 8) | (this.mem[this.pc+2])]'

      def hl(self):
        return 'this.mem[(this.H << 8) | (this.L)]'

      def go(self):
        note = self.note
        if re.search('RRR', note):
          note = re.sub('RRR', self.rrr(), note)
        if re.search('SSS', note):
          note = re.sub('SSS', self.sss(), note)
        if re.search('DDD', note):
          note = re.sub('DDD', self.ddd(), note)
        if re.search('db', note):
          note = re.sub('db', self.db(), note)
        if re.search('addr', note):
          note = re.sub('addr', self.addr(), note)
        if re.search('HL', note):
          note = re.sub('HL', self.hl(), note)
        return note

    result = []
    for note in self.notes:
      result.append(K(note).go())
    if self.skip > 0:
      result.append('this.pc += ' + str(self.skip) + ';')
    return result

  def __repr__(self):
    return '%s [%s%s%s]' % (self.name, self.prefix, self.p1, self.p2)

instructions = []
with open('decoder_table') as f:
  prefix = '00'
  notes = []
  for line in f:
    line = line.rstrip()
    if line == '':
      continue
    if line[0] == ' ':
      notes.append(line.strip())
      continue
    if len(notes) > 0:
      instructions[-1].notes = notes
      notes = []
    parts = line.split(' ')
    if len(parts) == 1:
      prefix = parts[0]
      continue
    size = 1
    if len(parts) >= 4:
      size = int(parts[3])
    skip = size
    if len(parts) >= 5:
      skip = int(parts[4])
    instruction = Instruction(prefix, parts[0], parts[1], parts[2], size, skip)
    instructions.append(instruction)
  if len(notes) > 0:
    instructions[-1].notes = notes
    notes = []

def lookupInstruction(b):
  for i in instructions:
    if i.match(b):
      return i

class Compiler:
  def __init__(self):
    self.output = []
    self.indent_level = 0

  def run(self):
    self.p('CPU.prototype.execute = function() {')
    self.indent()
    self.p('var i = this.mem[this.pc];')
    self.generateSwitch()
    self.outdent()
    self.p('};')
    return self.output

  def indent(self):
    self.indent_level += 2

  def outdent(self):
    self.indent_level -= 2

  def p(self, line):
    self.output.append(self.getIndent() + line)

  def getIndent(self):
    return self.indent_level * ' '

  def generateSwitch(self):
    self.p('switch (i) {')
    for b in range(256):
      i = lookupInstruction(b)
      if i is None:
        # print 'failed to lookup %s' % int2bin(b, 8)
        continue
      self.p('case 0x%s:  // %s' % (int2hex(b, 2), i.name))
      self.indent()
      for line in i.kompile(b):
        self.p('%s' % line)
      self.p('break;')
      self.outdent()
    self.p('}')

def disas(bts):
  print 'disassembling %s' % ints2bin(bts, 8)
  pc = 0
  while True:
    i = lookupInstruction(bts[pc])
    pc += i.size
    print i
    if pc >= len(bts):
      break

def test():
  while True:
    r = sys.stdin.readline().rstrip()
    if r == '':
      break
    n = bin2dec(r)
    print int2hex(n, 2)
    print int2bin(n, 8)
    print 'hi'
    i = lookupInstruction(n)
    print i.kompile(1, 2)
    print i
    print i.notes

# disas(program)
# generateSwitch()
# test()
import string
t = string.Template('$x $x, $a')
d = {'x':'y',
     'a': 'b'}
# print t.substitute(d)
# print int2bin(0x0e, 8)
mvi = [0x0e, 0x09,]  # mvi c, 9
mov = [0x4a]         # mov c, d

def test2(bs):
  i = lookupInstruction(bs[0])
  print ints2bin(bs, 8)
  print i
  i.kompile(bs[0])

with open('cpu_header.js') as f:
  for line in f:
    if line == '///\n':
      output = Compiler().run()
      for l in output:
        print l
      continue
    print line,

# test2(mvi)
# test2(mov)
# test2([0xc9])
# test2([bin2dec('11101001')])
# print int2hex(bin2dec('11001001'), 2)
