var stepButton = document.getElementById('step');
var addressInput = document.getElementById('address');
var memDumpOutput = document.getElementById('memdump');
var instructionDumpOutput = document.getElementById('idump');

var registers = ['b', 'c', 'd', 'e', 'h', 'l', 'a', 'pc'];
var regElems = {};

for (var i in registers) {
  var r = registers[i];
  var elem = document.getElementById(r);
  regElems[r] = elem;
}

function updateRegViews() {
  for (var i in registers) {
    var r = registers[i];
    regElems[r].innerText = cpu[r];
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

function getMemoryDump(cpu, addr) {
  var text = '';
  for (var i = 0; i < 16; i++) {
    text += cpu.mem[addr + i];
    text += ' ';
  }
  return text;
}

addressInput.addEventListener('change', function() {
  updateMemoryDump();
});

stepButton.addEventListener('click', function() {
  cpu.execute();
  updateRegViews();
  updateMemoryDump();
  updateIDump();
});

updateMemoryDump();
updateIDump();
