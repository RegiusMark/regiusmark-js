import { TypeSerializer, TypeDeserializer } from '../serializer';
import { ByteBuffer } from '../bytebuffer';
import { ScriptHash } from '../crypto';
import { TxVariant } from '../tx';
import { BodyType } from '.';
import Long from 'long';

export type RequestBody =
  | BroadcastReq
  | SetBlockFilterReq
  | ClearBlockFilterReq
  | SubscribeReq
  | UnsubscribeReq
  | GetPropertiesReq
  | GetBlockReq
  | GetFullBlockReq
  | GetBlockRangeReq
  | GetAddressInfoReq;

export class Request {
  /// A 32-bit unsigned integer max value is reserved for deserialization errors that occur during request processing.
  /// When a request is received with a reserved id, an IO error is returned regardless if the request is valid.
  public id: number;
  public body: RequestBody;

  public constructor(id: number, body: RequestBody) {
    this.id = id;
    this.body = body;
  }

  public serialize(buf: ByteBuffer): void {
    buf.writeUint32(this.id);
    buf.writeUint8(this.body.type);
    switch (this.body.type) {
      case BodyType.Broadcast:
        this.body.tx.serialize(buf);
        break;
      case BodyType.SetBlockFilter:
        if (!this.body.addrs) {
          // No addresses (len)
          buf.writeUint8(0);
        } else {
          buf.writeUint8(this.body.addrs.length);
          for (const addr of this.body.addrs) {
            TypeSerializer.digest(buf, addr.bytes);
          }
        }
        break;
      case BodyType.ClearBlockFilter:
        // No properties to serialize
        break;
      case BodyType.Subscribe:
        // No properties to serialize
        break;
      case BodyType.Unsubscribe:
        // No properties to serialize
        break;
      case BodyType.GetProperties:
        // No properties to serialize
        break;
      case BodyType.GetBlock:
        buf.writeUint64(this.body.height);
        break;
      case BodyType.GetFullBlock:
        buf.writeUint64(this.body.height);
        break;
      case BodyType.GetBlockRange:
        buf.writeUint64(this.body.minHeight);
        buf.writeUint64(this.body.maxHeight);
        break;
      case BodyType.GetAddressInfo:
        TypeSerializer.digest(buf, this.body.addr.bytes);
        break;
      /* istanbul ignore next */
      default:
        const _exhaustiveCheck: never = this.body;
        throw new Error(_exhaustiveCheck);
    }
  }

  public static deserialize(buf: ByteBuffer): Request {
    const id = buf.readUint32();
    const type = buf.readUint8() as BodyType;
    if (!(type in BodyType)) throw new Error('unknown type id: ' + type);
    switch (type) {
      case BodyType.Error: {
        throw new Error('cannot deserialize error requests');
      }
      case BodyType.Broadcast: {
        const tx = TxVariant.deserialize(buf);
        const req: BroadcastReq = {
          type: BodyType.Broadcast,
          tx,
        };
        return new Request(id, req);
      }
      case BodyType.SetBlockFilter: {
        const addrLen = buf.readUint8();
        let addrs: ScriptHash[] | undefined;
        if (addrLen > 0) {
          addrs = [];
          for (let i = 0; i < addrLen; ++i) {
            addrs.push(new ScriptHash(TypeDeserializer.digest(buf)));
          }
        }
        const req: SetBlockFilterReq = {
          type: BodyType.SetBlockFilter,
          addrs,
        };
        return new Request(id, req);
      }
      case BodyType.ClearBlockFilter: {
        const req: ClearBlockFilterReq = {
          type: BodyType.ClearBlockFilter,
        };
        return new Request(id, req);
      }
      case BodyType.Subscribe: {
        const req: SubscribeReq = {
          type: BodyType.Subscribe,
        };
        return new Request(id, req);
      }
      case BodyType.Unsubscribe: {
        const req: UnsubscribeReq = {
          type: BodyType.Unsubscribe,
        };
        return new Request(id, req);
      }
      case BodyType.GetProperties: {
        const req: GetPropertiesReq = {
          type: BodyType.GetProperties,
        };
        return new Request(id, req);
      }
      case BodyType.GetBlock: {
        const height = buf.readUint64();
        const req: GetBlockReq = {
          type: BodyType.GetBlock,
          height,
        };
        return new Request(id, req);
      }
      case BodyType.GetFullBlock: {
        const height = buf.readUint64();
        const req: GetFullBlockReq = {
          type: BodyType.GetFullBlock,
          height,
        };
        return new Request(id, req);
      }
      case BodyType.GetBlockRange: {
        const minHeight = buf.readUint64();
        const maxHeight = buf.readUint64();
        const req: GetBlockRangeReq = {
          type: BodyType.GetBlockRange,
          minHeight,
          maxHeight,
        };
        return new Request(id, req);
      }
      case BodyType.GetAddressInfo: {
        const addr = new ScriptHash(TypeDeserializer.digest(buf));
        const req: GetAddressInfoReq = {
          type: BodyType.GetAddressInfo,
          addr,
        };
        return new Request(id, req);
      }
      /* istanbul ignore next */
      default:
        const _exhaustiveCheck: never = type;
        throw new Error(_exhaustiveCheck);
    }
  }
}

export interface BroadcastReq {
  type: BodyType.Broadcast;
  tx: TxVariant;
}

export interface SetBlockFilterReq {
  type: BodyType.SetBlockFilter;
  /// Setting to undefined or an empty array will filter all addresses
  addrs: ScriptHash[] | undefined;
}

export interface ClearBlockFilterReq {
  type: BodyType.ClearBlockFilter;
}

export interface SubscribeReq {
  type: BodyType.Subscribe;
}

export interface UnsubscribeReq {
  type: BodyType.Unsubscribe;
}

export interface GetPropertiesReq {
  type: BodyType.GetProperties;
}

export interface GetBlockReq {
  type: BodyType.GetBlock;
  height: Long;
}

export interface GetFullBlockReq {
  type: BodyType.GetFullBlock;
  height: Long;
}

export interface GetBlockRangeReq {
  type: BodyType.GetBlockRange;
  minHeight: Long;
  maxHeight: Long;
}

export interface GetAddressInfoReq {
  type: BodyType.GetAddressInfo;
  addr: ScriptHash;
}
