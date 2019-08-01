import { KeyPair, PrivateKey, PublicKey } from './key';
import sodium from 'libsodium-wrappers';
import { sha256 as Sha256 } from 'sha.js';

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
  const seed = sodium.randombytes_buf(sodium.crypto_sign_SEEDBYTES);
  const keys = sodium.crypto_sign_seed_keypair(seed);

  const sk = new PrivateKey(keys.privateKey, seed);
  const pk = new PublicKey(keys.publicKey);
  return new KeyPair(sk, pk);
}

export function doubleSha256(msg: Uint8Array): Uint8Array {
  return hash(hash(msg));
}

function hash(msg: Uint8Array): Uint8Array {
  const hasher = new Sha256();
  hasher.update(msg);
  return hasher.digest();
}
