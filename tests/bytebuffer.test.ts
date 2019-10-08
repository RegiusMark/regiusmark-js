import { zigzagEncode, zigzagDecode, ByteBuffer } from '../src/bytebuffer';
import Long from 'long';

test('zigzag', (): void => {
  function cmp(decoded: string, encoded: string): void {
    const dec = Long.fromString(decoded, false);
    const enc = Long.fromString(encoded, true);
    expect(dec).toEqual(zigzagDecode(enc));
    expect(enc).toEqual(zigzagEncode(dec));
  }

  cmp('0', '0');
  cmp('-1', '1');
  cmp('1', '2');
  cmp('-2', '3');
  cmp('2147483647', '4294967294');
  cmp('-2147483648', '4294967295');
  cmp('9223372036854775807', '18446744073709551614');
  cmp('-9223372036854775808', '18446744073709551615');
});

test('buffer setting invalid offset', (): void => {
  const buf = ByteBuffer.alloc(5);
  expect((): void => {
    buf.offset = buf.capacity + 1;
  }).toThrowError('Offset is outside the bounds of this ByteBuffer');

  expect((): void => {
    buf.offset = -1;
  }).toThrowError('Offset is outside the bounds of this ByteBuffer');
});

test('buffer write bytes with length', (): void => {
  const buf = ByteBuffer.alloc(32);

  const bytes = new Uint8Array(32);
  bytes.fill(0xff);
  buf.writeUint32(bytes.byteLength);
  buf.writeBytes(bytes);
  buf.resetOffset();

  expect(buf.readUint32()).toEqual(bytes.byteLength);

  const readBytes = buf.readBytes(bytes.byteLength);
  expect(readBytes.byteLength).toEqual(bytes.byteLength);
  expect(readBytes).toEqual(bytes);
});

test('buffer u32 serialization', (): void => {
  const buf = ByteBuffer.alloc(4096);
  buf.writeUint32(0);
  buf.writeUint32(300);
  buf.writeUint32(100000);
  buf.writeUint32(0xffff_ffff);

  buf.resetOffset();

  expect(buf.readUint32()).toEqual(0);
  expect(buf.readUint32()).toEqual(300);
  expect(buf.readUint32()).toEqual(100000);
  expect(buf.readUint32()).toEqual(0xffff_ffff);
});

test('buffer u64 serialization', (): void => {
  const buf = ByteBuffer.alloc(4096);
  buf.writeUint64(0);
  buf.writeUint64(300);
  buf.writeUint64(-300);
  buf.writeUint64(Long.MAX_UNSIGNED_VALUE);
  buf.writeUint64(Long.MIN_VALUE.toUnsigned());

  buf.resetOffset();

  expect(buf.readUint64()).toEqual(Long.UZERO);
  expect(buf.readUint64()).toEqual(Long.fromNumber(300, true));
  expect(buf.readUint64()).toEqual(Long.fromNumber(-300, true));
  expect(buf.readUint64()).toEqual(Long.MAX_UNSIGNED_VALUE);
  expect(buf.readUint64()).toEqual(Long.MIN_VALUE.toUnsigned());
});

test('buffer var i64 serialization', (): void => {
  const buf = ByteBuffer.alloc(4096);
  buf.writeVarI64ZigZag(0);
  buf.writeVarI64ZigZag(300);
  buf.writeVarI64ZigZag(-300);
  buf.writeVarI64ZigZag(Long.MAX_VALUE);
  buf.writeVarI64ZigZag(Long.MIN_VALUE);
  // Outputs 0 as only the first bit is checked on the final byte with a shift of 63
  buf.writeBytes(new Uint8Array([0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x7e]));
  // Outputs 1 << 62 as bit 62 is set
  buf.writeBytes(new Uint8Array([0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x01]));

  buf.resetOffset();

  expect(buf.readVarI64ZigZag()).toEqual(Long.ZERO);
  expect(buf.readVarI64ZigZag()).toEqual(Long.fromNumber(300));
  expect(buf.readVarI64ZigZag()).toEqual(Long.fromNumber(-300));
  expect(buf.readVarI64ZigZag()).toEqual(Long.MAX_VALUE);
  expect(buf.readVarI64ZigZag()).toEqual(Long.MIN_VALUE);
  expect(buf.readVarI64ZigZag()).toEqual(Long.ZERO);
  expect(buf.readVarI64ZigZag()).toEqual(Long.ONE.shiftLeft(62));
});

test('buffer var i64 serialization overflow', (): void => {
  const buf = ByteBuffer.from(new Uint8Array([0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0]));
  buf.resetOffset();

  expect((): void => {
    buf.readVarI64ZigZag();
  }).toThrowError('overflow reading varint');
});

test('buffer var i64 serialization eof', (): void => {
  const buf = ByteBuffer.from(new Uint8Array([0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80]));
  buf.resetOffset();
  expect((): void => {
    buf.readVarI64ZigZag();
  }).toThrowError(new RangeError('Offset is outside the bounds of the DataView'));
});

test('byte buffer from node buffer', (): void => {
  function testBuf(nodeBuffer: Buffer): void {
    const buf = ByteBuffer.from(nodeBuffer);
    buf.offset = 4;
    expect(new Uint8Array(buf.sharedView())).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff]));

    buf.resetOffset();
    expect(buf.readUint32()).toEqual(0xffff_ffff);
  }

  testBuf(Buffer.from([0xff, 0xff, 0xff, 0xff]));
  testBuf(Buffer.from(new Uint8Array([0xff, 0xff, 0xff, 0xff])));
});
