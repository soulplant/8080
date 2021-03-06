#!/usr/bin/python
import decoder

dt = decoder.DecoderTable('decoder_table')

def generateInstructionList():
  print "var instructionList = ["
  for i in dt.instructions:
    print "  i('%s', '%s', '%s', %d)," % (i.getDisasName(), i.rawTemplate(), i.getDisas(), i.size)
  print "];"

with open('asm_header.js') as f:
  for line in f:
    if line == '///var instructionList;\n':
      generateInstructionList()
      continue
    print line,
