import { PublicKey, SigPair } from './crypto';
import { ByteBuffer } from './bytebuffer';
import { Script } from './script';
import { sign } from 'tweetnacl';
import { Asset } from './asset';
import { Big } from 'big.js';
import Long from 'long';

export class TypeSerializer {
  public static buffer(buf: ByteBuffer, value: Uint8Array): void {
    let len = value.byteLength;
    buf.writeUint32(len);
    buf.writeBytes(value);
  }

  public static sizedBuffer(buf: ByteBuffer, value: Uint8Array): void {
    buf.writeBytes(value);
  }

  public static digest(buf: ByteBuffer, value: Uint8Array): void {
    if (value.byteLength !== 32) throw new Error('expected sha256 digest length');
    TypeSerializer.sizedBuffer(buf, value);
  }

  public static string(buf: ByteBuffer, value: string): void {
    buf.writeUint32(value.length);
    buf.writeUTF8String(value);
  }

  public static publicKey(buf: ByteBuffer, value: PublicKey): void {
    TypeSerializer.sizedBuffer(buf, value.buffer);
  }

  public static script(buf: ByteBuffer, value: Script): void {
    TypeSerializer.buffer(buf, value.bytes);
  }

  public static sigPair(buf: ByteBuffer, value: SigPair): void {
    TypeSerializer.publicKey(buf, value.publicKey);
    TypeSerializer.sizedBuffer(buf, value.signature);
  }

  public static asset(buf: ByteBuffer, value: Asset): void {
    let num = Long.fromString(value.amount.toFixed(0), false);
    buf.writeVarI64ZigZag(num);
  }
}

export class TypeDeserializer {
  public static buffer(buf: ByteBuffer): Uint8Array {
    const len = buf.readUint32();
    if (len === 0) return new Uint8Array();
    return TypeDeserializer.sizedBuffer(buf, len);
  }

  public static sizedBuffer(buf: ByteBuffer, len: number): Uint8Array {
    return buf.readBytes(len);
  }

  public static digest(buf: ByteBuffer): Uint8Array {
    // Sha256 Hash is 32-bytes
    return TypeDeserializer.sizedBuffer(buf, 32);
  }

  public static string(buf: ByteBuffer): string {
    const len = buf.readUint32();
    if (len === 0) return '';
    return buf.readUTF8String(len);
  }

  public static publicKey(buf: ByteBuffer): PublicKey {
    const wif = TypeDeserializer.sizedBuffer(buf, sign.publicKeyLength);
    return new PublicKey(wif);
  }

  public static script(buf: ByteBuffer): Script {
    const bytes = TypeDeserializer.buffer(buf);
    return new Script(bytes);
  }

  public static sigPair(buf: ByteBuffer): SigPair {
    const publicKey = TypeDeserializer.publicKey(buf);
    const signature = TypeDeserializer.sizedBuffer(buf, sign.signatureLength);
    return {
      publicKey,
      signature,
    };
  }

  public static asset(buf: ByteBuffer): Asset {
    const amt = Big(buf.readVarI64ZigZag().toString());
    return new Asset(amt);
  }
}
