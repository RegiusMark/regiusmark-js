import { ByteBuffer } from '../bytebuffer';
import { TxVerifyError } from '../tx';

export enum NetErrorKind {
  Io = 0x00,
  BytesRemaining = 0x01,
  InvalidRequest = 0x02,
  InvalidHeight = 0x03,
  TxValidation = 0x04,
}

export class NetworkError extends Error {
  public kind: NetErrorKind;
  public meta?: Error;

  public constructor(kind: NetErrorKind, meta?: Error) {
    super();
    Object.setPrototypeOf(this, NetworkError.prototype);
    this.kind = kind;
    switch (this.kind) {
      case NetErrorKind.Io:
        this.message = 'io error';
        break;
      case NetErrorKind.BytesRemaining:
        this.message = 'bytes remaining';
        break;
      case NetErrorKind.InvalidRequest:
        this.message = 'invalid request';
        break;
      case NetErrorKind.InvalidHeight:
        this.message = 'invalid block height';
        break;
      case NetErrorKind.TxValidation:
        if (!(meta instanceof TxVerifyError)) throw new Error('invalid error type for TxValidation');
        this.meta = meta;
        this.message = 'tx validation: ' + this.meta.message;
        break;
      /* istanbul ignore next */
      default:
        const _exhaustiveCheck: never = this.kind;
        throw new Error(_exhaustiveCheck);
    }
  }

  public serialize(buf: ByteBuffer): void {
    buf.writeUint8(this.kind);
    if (this.kind === NetErrorKind.TxValidation) {
      const err = this.meta as TxVerifyError;
      err.serialize(buf);
    }
  }

  public static deserialize(buf: ByteBuffer): NetworkError {
    const kind = buf.readUint8() as NetErrorKind;
    if (!(kind in NetErrorKind)) throw new Error('unknown error kind: ' + kind);
    let meta: Error | undefined;
    if (kind === NetErrorKind.TxValidation) {
      meta = TxVerifyError.deserialize(buf);
    }
    return new NetworkError(kind, meta);
  }
}
