#!/usr/bin/python
import bintools
import decoder
import re
import sys

dt = decoder.DecoderTable('decoder_table')

class Compiler:
  def __init__(self):
    self.output = []
    self.indent_level = 0

  def indent(self):
    self.indent_level += 2

  def outdent(self):
    self.indent_level -= 2

  def p(self, line):
    self.output.append(self.getIndent() + line)

  def getIndent(self):
    return self.indent_level * ' '

  def run(self):
    pass

  def caseBody(self):
    pass

  def generateSwitch(self):
    self.p('switch (i) {')
    for b in range(256):
      i = dt.lookupInstruction(b)
      if i is None:
        # print 'failed to lookup %s' % int2bin(b, 8)
        continue
      self.p('case 0x%s:  // %s %s' % (bintools.int2hex(b, 2), bintools.int2bin(b, 8), i.getDisasName()))
      self.indent()
      self.caseBody(i, b)
      self.outdent()
    self.p('}')

# Generates a function to disassemble instructions.
class DisasCompiler(Compiler):
  def run(self):
    self.p('CPU.prototype.disas = function(addr) {')
    self.indent()
    self.p('var i = this.mem[addr];');
    self.generateSwitch()
    self.outdent()
    self.p('};')
    return self.output

  def caseBody(self, i, b):
    for line in i.genDisas(b):
      self.p(line)
    self.p('break;')

class ExecuteCompiler(Compiler):
  def run(self):
    self.p('CPU.prototype.execute = function() {')
    self.indent()
    self.p('var i = this.mem[this.pc];')
    self.generateSwitch()
    self.outdent()
    self.p('};')
    return self.output

  def caseBody(self, i, b):
    for line in i.kompile(b):
      self.p(line)
    self.p('break;')

with open('cpu_header.js') as f:
  for line in f:
    if line == '///\n':
      output = ExecuteCompiler().run()
      for l in output:
        print l
      output = DisasCompiler().run()
      for l in output:
        print l
      continue
    print line,
