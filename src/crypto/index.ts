import { KeyPair, PrivateKey, PublicKey } from './key';
import sodium from 'libsodium-wrappers-sumo';

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
  return sodium.crypto_hash_sha256(sodium.crypto_hash_sha256(msg));
}
