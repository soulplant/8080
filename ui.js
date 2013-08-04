var stepButton = document.getElementById('step');
var addressInput = document.getElementById('address');
var memDumpOutput = document.getElementById('memdump');
var instructionDumpOutput = document.getElementById('idump');

var registers = ['b', 'c', 'd', 'e', 'h', 'l', 'a', 'f', 'pc', 'sp'];
var flags = {'s': SIGN, 'z': ZERO, 'a': AUX_CARRY, 'p': PARITY, 'c': CARRY};
var regElems = {};

for (var i in registers) {
  var r = registers[i];
  var elem = document.getElementById(r);
  regElems[r] = elem;
}

var cpu = new CPU();
cpu.load(programs['inx']);

function updateRegViews() {
  for (var i in registers) {
    var r = registers[i];
    regElems[r].innerText = cpu[r];
  }
  for (var f in flags) {
    var x = (cpu.f & flags[f]) > 0;
    document.getElementById('flag-' + f).innerText = x ? '1' : '0';
  }
}

function hex2int(str) {
  var letters = '0123456789abcdef';
  var total = 0;
  for (var i in str) {
    total *= 16;
    var c = str[i];
    var x = letters.indexOf(c);
    if (x == -1)
      return -1;
    total += x;
  }
  return total;
}

function updateMemoryDump() {
  var addr = hex2int(addressInput.value);
  var text = '<invalid>';
  if (addr != -1)
    text = getMemoryDump(cpu, addr);
  memDumpOutput.innerText = text;
}

function updateIDump() {
  var disas = '';
  var addr = cpu.pc;
  for (var i = 0; i < 10; i++) {
    if (addr >= cpu.mem.length)
      break;
    var r = cpu.disas(addr);
    disas += r[0] + '\n';
    addr += r[1];
  }
  instructionDumpOutput.innerText = disas;
}

// TODO: Move to separate js file as this is needed by cpu.js.
function int2hex(n, len) {
  var digits = '0123456789abcdef';
  var base = digits.length;
  var result = '';
  for (var i = 0; i < len; i++) {
    result = digits[n % base] + result;
    n = Math.floor(n / base);
  }
  return result;
}

function getMemoryDump(cpu, addr) {
  var text = '';
  for (var page = 0; page < 4; page++) {
    for (var i = 0; i < 8; i++) {
      text += int2hex(cpu.mem[addr + (page * 8) + i], 2);
      text += ' ';
    }
    text += '\n';
  }
  return text;
}

function updateView() {
  updateRegViews();
  updateMemoryDump();
  updateIDump();
}

function step() {
  cpu.execute();
  updateView();
}

addressInput.addEventListener('change', function() {
  updateMemoryDump();
});

stepButton.addEventListener('click', step);

updateMemoryDump();
updateIDump();

document.addEventListener('keypress', function(e) {
  if (e.keyCode == 's'.charCodeAt(0)) {
    cpu.execute();
    updateView();
  } else if (e.keyCode == 'r'.charCodeAt(0)) {
    cpu.reset();
    cpu.load(programs['inx']);
    updateView();
  }
});
