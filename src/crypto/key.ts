import { doubleSha256, InvalidWif, SigPair } from './index';
import { Script, ScriptBuilder, Operand } from '../script';
import { sign, verify } from 'tweetnacl';
import { Buffer } from 'buffer';
import bs58 from 'bs58';

export const PRIV_BUF_PREFIX = 0x01;
export const PUB_BUF_PREFIX = 0x02;
export const PUB_ADDRESS_PREFIX = 'GOD';

function wifToArray(wif: string, prefix: number): Uint8Array {
  if (!wif) {
    throw new InvalidWif('wif not provided');
  }
  const raw = Uint8Array.from(bs58.decode(wif));
  if (raw[0] !== prefix) {
    throw new InvalidWif('invalid prefix');
  }
  const checksum = raw.slice(-4);
  const key = raw.slice(0, -4);
  if (!verify(doubleSha256(key).slice(0, 4), checksum)) {
    throw new InvalidWif('invalid checksum');
  }

  return key.slice(1);
}

export abstract class Key {
  public readonly buffer: Uint8Array;

  public constructor(buffer: Uint8Array) {
    this.buffer = buffer;
  }

  abstract toWif(): string;

  public equals(other: Key): boolean {
    return verify(this.buffer, other.buffer);
  }

  public toString(): string {
    return this.toWif();
  }
}

export class PrivateKey extends Key {
  public readonly seed: Uint8Array;

  public constructor(buffer: Uint8Array, seed: Uint8Array) {
    super(buffer);
    if (buffer.length !== sign.secretKeyLength) {
      throw new InvalidWif(`invalid key length (got ${buffer.length} bytes)`);
    } else if (seed.length !== sign.seedLength) {
      throw new InvalidWif(`invalid seed length (got ${seed.length} bytes)`);
    }
    this.seed = seed;
  }

  public toWif(): string {
    const wifBuf = new Uint8Array(this.seed.length + 5);
    wifBuf[0] = PRIV_BUF_PREFIX;
    wifBuf.set(this.seed, 1);

    const checksum = doubleSha256(wifBuf.slice(0, this.seed.length + 1)).slice(0, 4);
    wifBuf.set(checksum, this.seed.length + 1);

    return bs58.encode(Buffer.from(wifBuf.buffer));
  }
}

export class PublicKey extends Key {
  public static fromWif(wif: string): PublicKey {
    if (!(wif && wif.startsWith(PUB_ADDRESS_PREFIX))) {
      throw new InvalidWif('wif must start with ' + PUB_ADDRESS_PREFIX);
    }
    wif = wif.slice(PUB_ADDRESS_PREFIX.length);
    return new PublicKey(wifToArray(wif, PUB_BUF_PREFIX));
  }

  public constructor(buffer: Uint8Array) {
    super(buffer);
    if (buffer.length !== sign.publicKeyLength) {
      throw new InvalidWif(`invalid key length (got ${buffer.length} bytes)`);
    }
  }

  public toWif(): string {
    const wifBuf = new Uint8Array(this.buffer.length + 5);
    wifBuf[0] = PUB_BUF_PREFIX;
    wifBuf.set(this.buffer, 1);

    const checksum = doubleSha256(wifBuf.slice(0, this.buffer.length + 1)).slice(0, 4);
    wifBuf.set(checksum, this.buffer.length + 1);

    return PUB_ADDRESS_PREFIX + bs58.encode(Buffer.from(wifBuf.buffer));
  }

  public toScript(): Script {
    const builder = new ScriptBuilder();
    builder.pushPubKey(this);
    builder.push(Operand.OpCheckSig);
    return builder.build();
  }

  public verify(signature: Uint8Array, msg: Uint8Array): boolean {
    return sign.detached.verify(msg, signature, this.buffer) === true;
  }
}

export class KeyPair {
  public static fromWif(wif: string): KeyPair {
    const seed = wifToArray(wif, PRIV_BUF_PREFIX);
    const keys = sign.keyPair.fromSeed(seed);

    const sk = new PrivateKey(keys.secretKey, seed);
    const pk = new PublicKey(keys.publicKey);
    return new KeyPair(sk, pk);
  }

  public readonly privateKey: PrivateKey;
  public readonly publicKey: PublicKey;

  public constructor(privateKey: PrivateKey, publicKey: PublicKey) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  public sign(msg: Uint8Array): SigPair {
    return {
      publicKey: this.publicKey,
      signature: sign.detached(msg, this.privateKey.buffer),
    };
  }
}
