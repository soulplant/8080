#!/bin/bash
if which nodejs ; then
  NODE=nodejs
else
  NODE=node
fi
python gen-cpu.py > cpu.js
python gen-asm.py > asm.js
$NODE cpu.js
$NODE asm.js
