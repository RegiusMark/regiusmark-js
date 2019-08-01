import { generateKeyPair, KeyPair, PublicKey, PrivateKey, InvalidWif } from '../src';
import { PUB_ADDRESS_PREFIX } from '../src/crypto/key';
import { verify } from 'tweetnacl';
import bs58 from 'bs58';

test('create keys', (): void => {
  const keys = generateKeyPair();

  expect(keys).toBeDefined();
  expect(keys.publicKey).toBeDefined();
  expect(keys.privateKey).toBeDefined();
  expect(keys.privateKey.seed).toBeDefined();

  const pub = keys.publicKey.buffer;
  const priv = keys.privateKey.buffer;
  expect(verify(pub, priv.slice(0, 32))).toBe(false);
  expect(verify(pub, priv.slice(32, 64))).toBe(true);
});

test('recreate keys from a WIF', (): void => {
  const keys = generateKeyPair();
  const publicWif = keys.publicKey.toWif();
  const privateWif = keys.privateKey.toWif();

  expect(keys.publicKey.toString()).toBe(publicWif);
  expect(keys.privateKey.toString()).toBe(privateWif);

  const pubKey = PublicKey.fromWif(publicWif);
  const recKeys = KeyPair.fromWif(privateWif);

  expect(verify(pubKey.buffer, keys.publicKey.buffer)).toBe(true);
  expect(pubKey.equals(keys.publicKey)).toBe(true);

  expect(verify(recKeys.privateKey.buffer, keys.privateKey.buffer)).toBe(true);
  expect(verify(recKeys.privateKey.seed, keys.privateKey.seed)).toBe(true);
  expect(recKeys.privateKey.equals(keys.privateKey)).toBe(true);

  expect(pubKey.toWif()).toBe(publicWif);
  expect(recKeys.publicKey.toWif()).toBe(publicWif);
  expect(recKeys.privateKey.toWif()).toBe(privateWif);
});

test('import keys from WIF', (): void => {
  const { privateKey, publicKey } = KeyPair.fromWif('3GAD3otqozDorfu1iDpMQJ1gzWp8PRFEjVHZivZdedKW3i3KtM');
  expect(privateKey.toWif()).toBe('3GAD3otqozDorfu1iDpMQJ1gzWp8PRFEjVHZivZdedKW3i3KtM');
  expect(publicKey.toWif()).toBe('GOD52QZDBUStV5CudxvKf6bPsQeN7oeKTkEm2nAU1vAUqNVexGTb8');
});

test('throw on invalid key', (): void => {
  expect((): void => {
    KeyPair.fromWif('');
  }).toThrowError(new InvalidWif('wif not provided'));

  const keys = generateKeyPair();
  expect((): void => {
    const buf = bs58.decode(keys.privateKey.toWif());
    buf[0] = 0;
    KeyPair.fromWif(bs58.encode(buf));
  }).toThrowError(new InvalidWif('invalid prefix'));

  expect((): void => {
    // Private key and public key has a different prefix
    const buf = bs58.decode(keys.privateKey.toWif());
    PublicKey.fromWif('GOD' + bs58.encode(buf));
  }).toThrowError(new InvalidWif('invalid prefix'));

  expect((): void => {
    const buf = bs58.decode(keys.privateKey.toWif());
    for (let i = 0; i < 4; ++i) buf[buf.length - i - 1] = 0;
    KeyPair.fromWif(bs58.encode(buf));
  }).toThrowError(new InvalidWif('invalid checksum'));

  expect((): void => {
    const wif = keys.publicKey.toWif().slice(PUB_ADDRESS_PREFIX.length);
    PublicKey.fromWif(wif);
  }).toThrowError(new InvalidWif('wif must start with ' + PUB_ADDRESS_PREFIX));
});

test('properly sign and validate', (): void => {
  const keys = generateKeyPair();
  const msg = Uint8Array.from([0, 1, 2, 3, 4, 200, 230, 240]);
  const sig = keys.sign(msg);
  expect(keys.publicKey.verify(sig.signature, msg)).toBe(true);

  const badKeys = generateKeyPair();
  expect(badKeys.publicKey.verify(sig.signature, msg)).toBe(false);
});

test('throw on invalid key lengths', (): void => {
  expect((): void => {
    new PrivateKey(new Uint8Array(32), new Uint8Array(32));
  }).toThrow(new Error('invalid key length (got 32 bytes)'));

  expect((): void => {
    new PrivateKey(new Uint8Array(64), new Uint8Array(16));
  }).toThrowError(new Error('invalid seed length (got 16 bytes)'));

  expect((): void => {
    new PublicKey(new Uint8Array(64));
  }).toThrowError(new Error('invalid key length (got 64 bytes)'));
});
