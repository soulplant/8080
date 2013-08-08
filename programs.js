
var programs = {
  'push/pop': [
    // MVI a, 0xfe
    0x3e, 0xfe,  // 0011 1110
    // PUSH fa
    0xf5,        // 1111 0101
    // MVI a, 0x0e
    0x3e, 0x0e,  // 0011 1110
    // POP fa
    0xf1         // 1111 0001
  ],
  'rar-carry': [
    // MVI a, 0xfe
    0x3e, 0xfe,  // 0011 1110
    // STC
    0x37,        // 0011 0111
    // RAR
    0x1f,        // 0001 1111
  ],
  'rar': [
    // MVI a, 0xfe
    0x3e, 0xfe,  // 0011 1110
    // RAR
    0x1f,        // 0001 1111
  ],
  'ral': [
    // MVI a, 0xfe
    0x3e, 0xfe,  // 0011 1110
    // RAL
    0x17,        // 0001 0111
  ],
  'rrc': [
    // MVI a, 0xfe
    0x3e, 0xfe,  // 0011 1110
    // RRC
    0x0f,        // 0000 1111
  ],
  'rlc': [
    // MVI a, 0xfe
    0x3e, 0xfe,  // 0011 1110
    // RLC
    0x07,        // 0000 0111
  ],
  'cmp-4': [
    // MVI a, 0xe5
    0x3e, 0xe5,  // 0011 1110
    // MVI b, 0x05
    0x06, 0x05,  // 0110 0010
    // CMP b
    0xb8,        // 1011 1000
  ],
  'cmp-3': [
    // MVI a, 0x02
    0x3e, 0x02,  // 0011 1110
    // MVI b, 0x05
    0x06, 0x05,  // 0110 0010
    // CMP b
    0xb8,        // 1011 1000
  ],
  'cmp-2': [
    // MVI a, 0x0a
    0x3e, 0x0a,  // 0011 1110
    // MVI b, 0x05
    0x06, 0x05,  // 0110 0010
    // CMP b
    0xb8,        // 1011 1000
  ],
  'cmp': [
    // MVI a, 0x04
    0x3e, 0x04,  // 0011 1110
    // MVI b, 0x02
    0x06, 0x02,  // 0110 0010
    // CMP b
    0xb8,        // 1011 1000
  ],
  'sbb': [
    // MVI a, 0x04
    0x3e, 0x04,  // 0011 1110
    // MVI b, 0x02
    0x06, 0x02,  // 0110 0010
    // CMC
    0x3f,        // 0011 1111
    // SBB b
    0x98,        // 1001 1000
  ],
  'mov-mem': [
    // MOV a, [hl]
    0x7e,        // 0111 1110
    // MVI a, 0xff
    0x3e, 0xff,  // 0011 1110
    // MOV [hl], a
    0x77,        // 0111 0111
  ],
  'sub-mem': [
    // MVI a, 0xff
    0x3e, 0xff,  // 0011 1110
    // SUB [hl]
    0x96,        // 1001 0110
  ],
  'sub-zero': [
    // MVI a, 0xff
    0x3e, 0xff,  // 0011 1110
    // SUB b
    0x90,        // 1001 0000
  ],
  'sub': [
    // MVI a, 0xff
    0x3e, 0xff,  // 0011 1110
    // SUB a
    0x97,        // 1001 0111
  ],
  'adc': [
    // MVI a, 0xff
    0x3e, 0xff,  // 0011 1110
    // MVI b, 0x01
    0x06, 0x01,  // 0000 0110
    // ADC b
    0x88,        // 1000 1000
    // ADC b
    0x88,        // 1000 1000
  ],
  'add': [
    // MVI a, 0xff
    0x3e, 0xff,  // 0011 1110
    // ADD a
    0x87,        // 1000 0111
  ],
  'daa': [
    // MVI a, 0x19
    0x3e, 0x19,  // 0011 1110
    // DAA
    0x27,        // 0010 0111
    // INR a
    0x3c,        // 0011 1100
    // DAA
    0x27,        // 0010 0111
    // DAA
    0x27,        // 0010 0111
    // DAA
    0x27,        // 0010 0111
    // DAA
    0x27,        // 0010 0111
  ],
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
