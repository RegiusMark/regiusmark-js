import { PublicKey, SigPair, ScriptHash } from './crypto';
import ByteBuffer from 'bytebuffer';
import { Script } from './script';
import { sign } from 'tweetnacl';
import { Asset } from './asset';
import Long from 'long';

export class TypeSerializer {
  public static buffer(buf: ByteBuffer, value: Uint8Array): void {
    let len = value.length;
    buf.writeUint32(len);
    buf.append(value);
  }

  public static sizedBuffer(buf: ByteBuffer, value: Uint8Array): void {
    buf.append(value);
  }

  public static string(buf: ByteBuffer, value: string): void {
    buf.writeUTF8String(value);
  }

  public static publicKey(buf: ByteBuffer, value: PublicKey): void {
    TypeSerializer.sizedBuffer(buf, value.buffer);
  }

  public static script(buf: ByteBuffer, value: Script): void {
    TypeSerializer.buffer(buf, value.bytes);
  }

  public static scriptHash(buf: ByteBuffer, value: ScriptHash): void {
    TypeSerializer.sizedBuffer(buf, value);
  }

  public static sigPair(buf: ByteBuffer, value: SigPair): void {
    TypeSerializer.publicKey(buf, value.publicKey);
    TypeSerializer.sizedBuffer(buf, value.signature);
  }

  public static asset(buf: ByteBuffer, value: Asset): void {
    let num = Long.fromString(value.amount.toFixed(0), false);
    buf.writeVarint64ZigZag(num);
  }
}

export class TypeDeserializer {
  public static buffer(buf: ByteBuffer): Uint8Array {
    const len = buf.readUint32();
    if (len === 0) return new Uint8Array();
    return TypeDeserializer.sizedBuffer(buf, len);
  }

  public static sizedBuffer(buf: ByteBuffer, len: number): Uint8Array {
    return new Uint8Array(buf.readBytes(len).toArrayBuffer());
  }

  public static string(buf: ByteBuffer): string {
    const len = buf.readUint32();
    if (len === 0) return '';
    let res = buf.readUTF8String(len);
    if (typeof res === 'string') {
      return res;
    } else {
      return res.string;
    }
  }

  public static publicKey(buf: ByteBuffer): PublicKey {
    const wif = TypeDeserializer.sizedBuffer(buf, sign.publicKeyLength);
    return new PublicKey(wif);
  }

  public static script(buf: ByteBuffer): Script {
    const bytes = TypeDeserializer.buffer(buf);
    return new Script(bytes);
  }

  public static scriptHash(buf: ByteBuffer): ScriptHash {
    // Sha256 Hash is 32-bytes
    return TypeDeserializer.sizedBuffer(buf, 32);
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
    const amt = Big(buf.readVarint64ZigZag().toString());
    return new Asset(amt);
  }
}
