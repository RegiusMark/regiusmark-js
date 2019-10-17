import {
  MAX_SCRIPT_BYTE_SIZE,
  Script,
  ScriptHash,
  ScriptBuilder,
  Operand,
  generateKeyPair,
  doubleSha256,
} from '../src';

test('convert public key to default script', (): void => {
  const key = generateKeyPair().publicKey;
  const builder = new ScriptBuilder();
  builder.pushPubKey(key);
  builder.push(Operand.OpCheckSig);

  expect(key.toScript()).toEqual(builder.build());
});

test('convert public key to default script hash', (): void => {
  const key = generateKeyPair().publicKey;
  const script = key.toScript();
  expect(script.hash()).toEqual(new ScriptHash(doubleSha256(script.bytes)));
});

test('build multiple times safely', (): void => {
  const builder = new ScriptBuilder();
  builder.push(Operand.OpCheckSig);
  builder.push(Operand.PushTrue);

  const expected = new Script(new Uint8Array([Operand.OpCheckSig, Operand.PushTrue]));
  const scriptA = builder.build();
  const scriptB = builder.build();
  expect(scriptA.bytes.length).toEqual(2);
  expect(scriptA).toEqual(expected);
  expect(scriptB).toEqual(expected);
});

test('throw error on exceeding max script size', (): void => {
  const builder = new ScriptBuilder();
  for (let i = 0; i <= MAX_SCRIPT_BYTE_SIZE; ++i) {
    builder.push(Operand.PushTrue);
  }
  expect((): void => {
    builder.build();
  }).toThrowError('maximum script size exceeded');
});

test('cannot push after building', (): void => {
  const builder = new ScriptBuilder();
  builder.build();
  expect((): void => {
    builder.push(Operand.PushTrue);
  }).toThrowError('script already built');
});

test('push public key', (): void => {
  const key = generateKeyPair().publicKey;
  const builder = new ScriptBuilder();
  builder.pushPubKey(key);

  const expected = new Script(new Uint8Array(1 + key.buffer.length));
  expected.bytes[0] = Operand.PushPubKey;
  expected.bytes.set(key.buffer, 1);
  expect(builder.build()).toEqual(expected);
});

test('push multisig op', (): void => {
  const builder = new ScriptBuilder();
  builder.pushCheckMultiSig(2, 3);
  const expected = new Script(new Uint8Array([Operand.OpCheckMultiSig, 0x02, 0x03]));
  expect(builder.build()).toEqual(expected);
});

test('push multisigfastfail op', (): void => {
  const builder = new ScriptBuilder();
  builder.pushCheckMultiSig(2, 3, true);
  const expected = new Script(new Uint8Array([Operand.OpCheckMultiSigFastFail, 0x02, 0x03]));
  expect(builder.build()).toEqual(expected);
});
