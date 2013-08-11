#!/bin/bash
if which nodejs ; then
  NODE=nodejs
else
  NODE=node
fi
python gen-cpu.py > cpu.js
$NODE cpu.js
