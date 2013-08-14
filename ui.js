var stepButton = document.getElementById('step');
var addressInput = document.getElementById('address');
var memDumpOutput = document.getElementById('memdump');
var stackDumpOutput = document.getElementById('stackdump');
var instructionDumpOutput = document.getElementById('idump');
var programListElem = document.getElementById('program-list');
var asmInput = document.getElementById('asm');
var asmOutput = document.getElementById('asm-out');
var asmRunButton = document.getElementById('asm-run');
var vidMemCanvas = document.getElementById('vidmem');
var toggleRunButton = document.getElementById('toggle-run');

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
  size = Math.min(size, 0x40);
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

var PALETTE_ENTRIES = 16;
var PALETTE_ENTRY_SIZE = 3;
var VID_MEM_START = 0x1000;
var VID_MEM_WIDTH = 128;
var VID_MEM_HEIGHT = 128;

// Palette is stored as 16 RGB triplets.
function readPalette(addr) {
  var colors = [];
  for (var i = 0; i < PALETTE_ENTRIES; i++) {
    var color = [];
    for (var j = 0; j < 3; j++) {
      color.push(cpu.mem[addr + (i * 3) + j]);
    }
    colors.push(color);
  }
  return colors;
}

function FPS(name) {
  this.name = name;
  this.samples = [];
  this.lastShown = new Date();
}

FPS.prototype.sample = function(s) {
  this.samples.push(s);
  while (s.length > 100)
    this.samples.splice(0, 1);
};
FPS.prototype.fps = function() {
  var total = 0;
  for (var i = 0; i < this.samples.length; i++) {
    total += this.samples[i];
  }
  return 1000 / (total / this.samples.length);
};
FPS.prototype.log = function() {
  var now = new Date();
  if ((now - this.lastShown) > 1000) {
    console.log(this.name, 'fps:', this.fps());
    this.lastShown = now;
  }
};

var vidMemFps = new FPS('updateVidMem');

function updateVidMem() {
  var startTime = new Date();
  var palette = readPalette(VID_MEM_START);
  var vidMemStart = VID_MEM_START + palette.length * 3;
  var ctx = vidMemCanvas.getContext('2d');
  var data = ctx.createImageData(VID_MEM_WIDTH, VID_MEM_HEIGHT);

  for (var i = 0; i < VID_MEM_HEIGHT; i++) {
    for (var j = 0; j < VID_MEM_WIDTH; j++) {
      var index = i * VID_MEM_WIDTH + j;
      var rgb = palette[cpu.mem[vidMemStart + index]];
      data.data[index*4+0] = rgb[0];
      data.data[index*4+1] = rgb[1];
      data.data[index*4+2] = rgb[2];
      data.data[index*4+3] = 0xff;
    }
  }
  ctx.putImageData(data, 0, 0);
  var endTime = new Date();
  vidMemFps.sample(endTime - startTime);
  vidMemFps.log();
}

function updateView() {
  updateRegViews();
  updateMemoryDump();
  updateStackDump();
  updateIDump();
  updateVidMem();
}

function Animator() {
  this.running = false;
  this.animFPS = new FPS('anim');
};
Animator.prototype.run = function() {
  this.running = true;
  this.lastRun = new Date();
  var self = this;
  requestAnimationFrame(function r() {
    if (!self.running)
      return;
    var runTime = new Date();
    var delta = runTime - self.lastRun;
    self.lastRun = runTime;
    self.animFPS.sample(delta);
    self.animFPS.log();

    step(80000);

    if (self.running)
      requestAnimationFrame(r);
  });
};
Animator.prototype.stop = function() {
  this.running = false;
};
Animator.prototype.toggle = function() {
  if (this.running)
    this.stop();
  else
    this.run();
};

var animator = new Animator();

var cpuFPS = new FPS('cpu');
function step(n) {
  if (!n)
    n = 1;
  var startTime = new Date();
  cpu.runN(n);
  updateView();
  var endTime = new Date();
  cpuFPS.sample(endTime - startTime);
  cpuFPS.log();
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

stepButton.addEventListener('click', step.bind(1));

document.addEventListener('keypress', function(e) {
  if (e.keyCode == 's'.charCodeAt(0)) {
    step(1);
  } else if (e.keyCode == 'S'.charCodeAt(0)) {
    step(80000);
  } else if (e.keyCode == 'r'.charCodeAt(0)) {
    animator.toggle();
  } else if (e.keyCode == 'R'.charCodeAt(0)) {
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

toggleRunButton.addEventListener('click', function() {
  animator.toggle();
});
