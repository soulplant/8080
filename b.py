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
  def __init__(self, prefix, p1, p2, name, size):
    self.prefix = prefix
    self.p1 = p1
    self.p2 = p2
    self.name = name
    self.size = size

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

  def __repr__(self):
    return '%s [%s%s%s]' % (self.name, self.prefix, self.p1, self.p2)

instructions = []
with open('decoder_table') as f:
  prefix = '00'
  for line in f:
    line = line.rstrip()
    if line == '':
      continue
    parts = line.split(' ')
    if len(parts) == 1:
      prefix = parts[0]
      continue
    size = 1
    if len(parts) == 4:
      size = int(parts[3])
    instruction = Instruction(prefix, parts[0], parts[1], parts[2], size)
    instructions.append(instruction)

def lookupInstruction(b):
  for i in instructions:
    if i.match(b):
      return i

def generateSwitch():
  print 'switch (i) {'
  for b in range(256):
    i = lookupInstruction(b)
    if i is None:
      # print 'failed to lookup %s' % int2bin(b, 8)
      continue
    print 'case 0x%s:' % int2hex(b, 2)
    print '  this.%s();' % i.name
    print '  break;'

def disas(bts):
  print 'disassembling %s' % ints2bin(bts, 8)
  pc = 0
  while True:
    i = lookupInstruction(bts[pc])
    pc += i.size
    print i
    if pc >= len(bts):
      break

# disas(program)
generateSwitch()
