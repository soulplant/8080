
var programs = {
  'inx': [
    // MVI c, 0xff
    0x0e, 0xff,  // 0000 1110
    // INX hl
    0x03,        // 0000 0011
  ],
  'dad': [
    // MVI h, 0xff
    0x26, 0xff,  // 0010 0110
    // MVI l, 0x01
    0x2e, 0x01,  // 0010 1110
    // DAD HL
    0x29,        // 0010 1001
  ],
  'shld': [
    // MVI h, 1
    0x26, 0x01,        // 0010 0110
    // MVI l, 2
    0x2e, 0x02,        // 0010 1110
    // SHLD [0x0102]
    0x22, 0x02, 0x01,  // 0010 0010
    // MVI h, 8
    0x26, 0x08,        // 0010 0110
    // MVI l, 8
    0x2e, 0x08,        // 0010 1110
    // LHLD [0x0102]
    0x2a, 0x02, 0x01,  // 0010 1010
  ],
  'lda': [
    // LDA [0x0000]
    0x3a, 0x00, 0x00,  // 0011 1010
    // STA [0x0008]
    0x32, 0x08, 0x00,  // 0011 0010
  ],
  'stax': [
    // MVI A, 8
    0x3e, 0x08,   // 0011 1110
    // MVI C, 8
    0x0e, 0x08,   // 0000 1110
    // STAX B
    0x2,          // 0000 0010
    // MVI A, 3
    0x3e, 0x03,   // 0011 1110
    // LDAX B
    0x0a          // 0000 1010
  ],
  'lxi': [
    // LXI b, 258
    0x1, 0x1, 0x2,

    // LXI c, 258
    0x31, 0x1, 0x2
  ],
  'inr': [
  // MVI c, 0xff
  0x0e, 0xff,
  // MOV b, c
  0x41,
  // INR b
  0x04,
  // INR b
  0x04,
  // INR b
  0x04,
  // INR hl
  0x34,
  // hlt
  0x76,
  ],
};