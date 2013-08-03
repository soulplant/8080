#!/bin/bash
if which nodejs ; then
  NODE=nodejs
else
  NODE=node
fi
python b.py > cpu.js
$NODE cpu.js
