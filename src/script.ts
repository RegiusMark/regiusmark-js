import { PublicKey, ScriptHash, doubleSha256 } from './crypto';
import { TypeSerializer } from './serializer';
import { ByteBuffer } from './bytebuffer';

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

export class Script {
  public readonly bytes: Uint8Array;

  public constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  public hash(): ScriptHash {
    return doubleSha256(this.bytes);
  }
}

export class ScriptBuilder {
  private readonly bytes: ByteBuffer;
  private built: boolean;

  public constructor() {
    this.bytes = ByteBuffer.alloc(MAX_SCRIPT_BYTE_SIZE);
    this.built = false;
  }

  public build(): Script {
    if (this.bytes.offset > MAX_SCRIPT_BYTE_SIZE) {
      throw new Error('maximum script size exceeded');
    }
    this.built = true;
    return new Script(this.bytes.sharedView());
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

  public pushCheckMultiSig(threshold: number, keyCount: number, fastFail = false): void {
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

export enum ScriptEvalErrorKind {
  UnexpectedEOF = 0x00,
  UnknownOp = 0x01,
  InvalidItemOnStack = 0x02,
  StackOverflow = 0x03,
  StackUnderflow = 0x04,
}

export class ScriptEvalError extends Error {
  public position: number;
  public kind: ScriptEvalErrorKind;

  public constructor(kind: ScriptEvalErrorKind, position: number) {
    super();
    Object.setPrototypeOf(this, ScriptEvalError.prototype);
    this.position = position;
    this.kind = kind;
    /* istanbul ignore next */
    switch (this.kind) {
      case ScriptEvalErrorKind.UnexpectedEOF:
        this.message = 'unexpected eof';
        break;
      case ScriptEvalErrorKind.UnknownOp:
        this.message = 'unknown op';
        break;
      case ScriptEvalErrorKind.InvalidItemOnStack:
        this.message = 'invalid item on stack';
        break;
      case ScriptEvalErrorKind.StackOverflow:
        this.message = 'stack overflow';
        break;
      case ScriptEvalErrorKind.StackUnderflow:
        this.message = 'stack underflow';
        break;
      default:
        const _exhaustiveCHeck: never = this.kind;
        throw new Error(_exhaustiveCHeck);
    }
    this.message += ' (pos: ' + this.position + ')';
  }
}
