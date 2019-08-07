import { TypeSerializer } from './serializer';
import { PublicKey } from './crypto';
import ByteBuffer from 'bytebuffer';

export const MAX_SCRIPT_BYTE_SIZE = 2048;

export enum Operand {
  // Push value
  PushFalse = 0x00,
  PushTrue = 0x01,
  PushPubKey = 0x02,

  // Stack manipulation
  OpNot = 0x10,

  // Control
  OpIf = 0x20,
  OpElse = 0x21,
  OpEndIf = 0x22,
  OpReturn = 0x23,

  // Crypto
  OpCheckSig = 0x30,
  OpCheckSigFastFail = 0x31,
  OpCheckMultiSig = 0x32,
  OpCheckMultiSigFastFail = 0x33,
}

export class ScriptBuilder {
  private readonly bytes: ByteBuffer;
  private built: boolean;

  public constructor() {
    this.bytes = new ByteBuffer(MAX_SCRIPT_BYTE_SIZE, false);
    this.built = false;
  }

  public build(): Uint8Array {
    if (this.bytes.offset > MAX_SCRIPT_BYTE_SIZE) {
      throw new Error('maximum script size exceeded');
    }
    if (!this.built) this.bytes.flip();
    this.built = true;
    return new Uint8Array(this.bytes.toArrayBuffer());
  }

  public push(op: Operand): void {
    this.assertNotBuilt();
    this.bytes.writeUint8(op);
  }

  public pushPubKey(key: PublicKey): void {
    this.assertNotBuilt();
    this.push(Operand.PushPubKey);
    TypeSerializer.publicKey(this.bytes, key);
  }

  public pushCheckMultiSig(threshold: number, keyCount: number, fastFail: boolean = false): void {
    this.assertNotBuilt();
    if (fastFail) this.push(Operand.OpCheckMultiSigFastFail);
    else this.push(Operand.OpCheckMultiSig);
    this.bytes.writeUint8(threshold);
    this.bytes.writeUint8(keyCount);
  }

  private assertNotBuilt(): void {
    if (this.built) {
      throw new Error('script already built');
    }
  }
}
