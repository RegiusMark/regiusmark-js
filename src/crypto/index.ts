import { KeyPair, PrivateKey, PublicKey } from './key';
import { randomBytes, sign } from 'tweetnacl';

//@ts-ignore
import Sha256 from 'sha.js/sha256';

export { KeyPair, PrivateKey, PublicKey };

export class InvalidWif extends Error {
  public constructor(msg: string) {
    /* istanbul ignore next */
    super(msg);
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
