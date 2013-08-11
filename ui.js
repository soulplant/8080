var stepButton = document.getElementById('step');
var addressInput = document.getElementById('address');
var memDumpOutput = document.getElementById('memdump');
var stackDumpOutput = document.getElementById('stackdump');
var instructionDumpOutput = document.getElementById('idump');
var programListElem = document.getElementById('program-list');
var asmInput = document.getElementById('asm');
var asmOutput = document.getElementById('asm-out');
var asmRunButton = document.getElementById('asm-run');

var registers = ['b', 'c', 'd', 'e', 'h', 'l', 'a', 'f', 'pc', 'sp'];
var flags = {'s': SIGN, 'z': ZERO, 'a': AUX_CARRY, 'p': PARITY, 'c': CARRY};
var regElems = {};

for (var i in registers) {
  var r = registers[i];
  var elem = document.getElementById(r);
  regElems[r] = elem;
}

var cpu = new CPU();

function updateRegViews() {
  for (var i in registers) {
    var r = registers[i];
    var hexChars = r.length * 2;
    regElems[r].innerText = int2hex(cpu[r], hexChars);
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

function int2base(n, digits, len) {
  var result = '';
  for (var i = 0; i < len; i++) {
    result = digits[(n % digits.length)] + result;
    n /= digits.length;
  }
  return result;
}

function int2bin(n, len) {
  return int2base(n, '01', len);
}

function int2hex(n, len) {
  return int2base(n, '0123456789abcdef', len);
}

function updateMemoryDump() {
  var addr = hex2int(addressInput.value);
  var text = '<invalid>';
  if (addr != -1)
    text = getMemoryDump(cpu, addr, 4, 8, 1);
  memDumpOutput.innerText = text;
}

function updateStackDump() {
  var addr = cpu.sp;
  var size = 0xffff - cpu.sp;
  var rows = size / 2;
  stackDumpOutput.innerText = getMemoryDump(cpu, addr, rows, 1, 2);
}

function updateIDump() {
  var disas = '';
  var addr = cpu.pc;
  for (var i = 0; i < 10; i++) {
    if (addr >= cpu.mem.length)
      break;
    var addrString = int2hex(addr, 4);
    var r = cpu.disas(addr);
    disas += addrString + '| ' + r[0] + '\n';
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

function getMemoryDump(cpu, addr, rows, columns, wordSize) {
  var text = '';
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < columns; c++) {
      var num = 0;
      var bits = 0;
      for (var i = 0; i < wordSize; i++) {
        var mem = cpu.mem[addr + (r * columns * wordSize) + (c * wordSize) + i];
        num += mem << bits;
        bits += 8;
      }
      text += int2hex(num, wordSize * 2);
      text += ' ';
    }
    text += '\n';
  }
  return text;
}

function updateView() {
  updateRegViews();
  updateMemoryDump();
  updateStackDump();
  updateIDump();
}

function step() {
  cpu.execute();
  updateView();
}

function resetAndLoad(bs) {
  cpu.reset();
  cpu.load(bs);
  updateView();
}

function createProgramOptions() {
  var programNameList = [];
  var programList = [];
  programListElem.addEventListener('change', function(e) {
    resetAndLoad(programList[programListElem.selectedIndex]);
    localStorage['last-program'] = programNameList[programListElem.selectedIndex];
  });
  for (var name in programs) {
    programNameList.push(name);
    programList.push(programs[name]);
    var o = document.createElement('option');
    o.innerText = name;
    programListElem.appendChild(o);
  }
}

addressInput.addEventListener('change', function() {
  updateMemoryDump();
});

stepButton.addEventListener('click', step);

document.addEventListener('keypress', function(e) {
  if (e.keyCode == 's'.charCodeAt(0)) {
    cpu.execute();
    updateView();
  } else if (e.keyCode == 'r'.charCodeAt(0)) {
    assembleAndRun();
  }
});

createProgramOptions();

if (!localStorage['last-program']) {
  localStorage['last-program'] = 'daa';
}
resetAndLoad(programs[localStorage['last-program']]);

function assembleAndRun() {
  var bytes = new Assembler(parser.parse(asmInput.value)).assemble();
  resetAndLoad(bytes);
}

if (localStorage['last-asm-program']) {
  asmInput.value = localStorage['last-asm-program'];
  assembleAndRun();
}

asmInput.addEventListener('keypress', function(e) {
  e.cancelBubble = true;
  if (e.charCode == '13' && e.shiftKey) {
    localStorage['last-asm-program'] = asmInput.value;
    e.preventDefault();
    assembleAndRun();
  }
});
asmRunButton.addEventListener('click', function() {
  assembleAndRun();
});
