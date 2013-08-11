#!/bin/bash
if which nodejs ; then
  NODE=nodejs
else
  NODE=node
fi
pegjs asm_parser.pegjs
python gen_cpu.py > cpu.js
python gen_asm.py > asm.js
$NODE cpu.js
$NODE asm.js
