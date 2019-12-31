import { Response, serializeRes, deserializeRes } from './response';
import { Request, serializeReq, deserializeReq } from './request';
import { ByteBuffer } from '../bytebuffer';
import { NetworkError } from './error';
import Long from 'long';

export * from './response';
export * from './request';
export * from './error';

export class Msg {
  /// Max value is reserved for subscription updates or other generic messages. Using max value for RPC requests may
  /// cause your application to misbehave. Requests always expect a response and should use a proper id.
  public readonly id: number;
  public readonly body: Body;

  public constructor(id: number, body: Body) {
    this.id = id;
    this.body = body;
  }

  public serialize(buf: ByteBuffer): void {
    buf.writeUint32(this.id);
    buf.writeUint8(this.body.type);
    switch (this.body.type) {
      case BodyType.Error:
        this.body.error.serialize(buf);
        break;
      case BodyType.Request:
        serializeReq(buf, this.body.req);
        break;
      case BodyType.Response:
        serializeRes(buf, this.body.res);
        break;
      case BodyType.Ping:
        buf.writeUint64(this.body.nonce);
        break;
      case BodyType.Pong:
        buf.writeUint64(this.body.nonce);
        break;
      /* istanbul ignore next */
      default:
        const _exhaustiveCheck: never = this.body;
        throw new Error(_exhaustiveCheck);
    }
  }

  public static deserialize(buf: ByteBuffer): Msg {
    const id = buf.readUint32();
    const type = buf.readUint8() as BodyType;
    if (!(type in BodyType)) throw new Error('unknown msg body id: ' + type);

    let body: Body;

    switch (type) {
      case BodyType.Error: {
        body = {
          type: BodyType.Error,
          error: NetworkError.deserialize(buf),
        };
        break;
      }
      case BodyType.Request:
        body = {
          type: BodyType.Request,
          req: deserializeReq(buf),
        };
        break;
      case BodyType.Response:
        body = {
          type: BodyType.Response,
          res: deserializeRes(buf),
        };
        break;
      case BodyType.Ping:
        body = {
          type: BodyType.Ping,
          nonce: buf.readUint64(),
        };
        break;
      case BodyType.Pong:
        body = {
          type: BodyType.Pong,
          nonce: buf.readUint64(),
        };
        break;
      /* istanbul ignore next */
      default:
        const _exhaustiveCheck: never = type;
        throw new Error(_exhaustiveCheck);
    }

    return new Msg(id, body);
  }
}

export enum BodyType {
  // Error message
  Error = 0x00,
  // RPC request
  Request = 0x01,
  // RPC response
  Response = 0x02,
  // Ping is used to test whether a connection is alive
  Ping = 0x03,
  // Pong is used to confirm a connection is alive
  Pong = 0x04,
}

export type Body = ErrorBody | RequestBody | ResponseBody | PingBody | PongBody;

export interface ErrorBody {
  type: BodyType.Error;
  error: NetworkError;
}

export interface RequestBody {
  type: BodyType.Request;
  req: Request;
}

export interface ResponseBody {
  type: BodyType.Response;
  res: Response;
}

export interface PingBody {
  type: BodyType.Ping;
  nonce: Long;
}

export interface PongBody {
  type: BodyType.Pong;
  nonce: Long;
}

export enum RpcType {
  // Operations that can update the connection or blockchain state
  Broadcast = 0x10,
  SetBlockFilter = 0x11,
  ClearBlockFilter = 0x12,
  Subscribe = 0x13,
  Unsubscribe = 0x14,

  // Getters
  GetProperties = 0x20,
  GetBlock = 0x21,
  GetFullBlock = 0x22,
  GetBlockRange = 0x23,
  GetAddressInfo = 0x24,
}
