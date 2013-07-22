#!/usr/bin/python
import sys

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
