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
