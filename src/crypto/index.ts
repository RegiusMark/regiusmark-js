import { KeyPair, PrivateKey, PublicKey, PUB_ADDRESS_PREFIX, wifToArray } from './key';
import { randomBytes, sign } from 'tweetnacl';
import Sha256 from 'sha.js/sha256';
import { Buffer } from 'buffer';
import bs58 from 'bs58';

export { KeyPair, PrivateKey, PublicKey };

const SCRIPT_HASH_BUF_PREFIX = 0x03;
const SHA256_BUF_LEN = 32;

export class InvalidWif extends Error {
  public constructor(msg: string) {
    /* istanbul ignore next */
    super(msg);
    Object.setPrototypeOf(this, InvalidWif.prototype);
  }
}

export class ScriptHash {
  public bytes: Uint8Array;

  public constructor(buffer: Uint8Array) {
    if (buffer.length !== SHA256_BUF_LEN) {
      throw new InvalidWif(`invalid hash length (got ${buffer.length} bytes)`);
    }
    this.bytes = buffer;
  }

  public toWif(): string {
    const wifBuf = Buffer.alloc(this.bytes.length + 5);
    wifBuf[0] = SCRIPT_HASH_BUF_PREFIX;
    wifBuf.set(this.bytes, 1);

    const checksum = doubleSha256(wifBuf.slice(0, this.bytes.length + 1)).slice(0, 4);
    wifBuf.set(checksum, this.bytes.length + 1);

    return PUB_ADDRESS_PREFIX + bs58.encode(wifBuf);
  }

  public static fromWif(wif: string): ScriptHash {
    if (!(wif && wif.startsWith(PUB_ADDRESS_PREFIX))) {
      throw new InvalidWif('wif must start with ' + PUB_ADDRESS_PREFIX);
    }

    wif = wif.slice(PUB_ADDRESS_PREFIX.length);
    return new ScriptHash(wifToArray(wif, SCRIPT_HASH_BUF_PREFIX));
  }
}

export interface SigPair {
  publicKey: PublicKey;
  signature: Uint8Array;
}

export function generateKeyPair(): KeyPair {
  const seed = randomBytes(sign.seedLength);
  const keys = sign.keyPair.fromSeed(seed);

  const sk = new PrivateKey(keys.secretKey, seed);
  const pk = new PublicKey(keys.publicKey);
  return new KeyPair(sk, pk);
}

export function doubleSha256(msg: Uint8Array): Uint8Array {
  // This is a hack to return a true Uint8Array instead of a Buffer
  const buf = new Uint8Array(32);
  buf.set(_hash(_hash(msg)));
  return buf;
}

function _hash(msg: Uint8Array | Buffer): Buffer {
  const hasher = new Sha256();
  hasher.update(msg);
  return hasher.digest();
}
