import { TypeSerializer, TypeDeserializer } from '../serializer';
import { ByteBuffer } from '../bytebuffer';
import { ScriptHash } from '../crypto';
import { TxVariant } from '../tx';
import { BodyType } from '.';
import Long from 'long';

export type RequestBody =
  | BroadcastReq
  | SetBlockFilterReq
  | GetPropertiesReq
  | GetBlockReq
  | GetBlockHeaderReq
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
            TypeSerializer.digest(buf, addr);
          }
        }
        break;
      case BodyType.GetProperties:
        // No properties to serialize
        break;
      case BodyType.GetBlock:
        buf.writeUint64(this.body.height);
        break;
      case BodyType.GetBlockHeader:
        buf.writeUint64(this.body.height);
        break;
      case BodyType.GetAddressInfo:
        TypeSerializer.digest(buf, this.body.addr);
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
            addrs.push(TypeDeserializer.digest(buf));
          }
        }
        const req: SetBlockFilterReq = {
          type: BodyType.SetBlockFilter,
          addrs,
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
      case BodyType.GetBlockHeader: {
        const height = buf.readUint64();
        const req: GetBlockHeaderReq = {
          type: BodyType.GetBlockHeader,
          height,
        };
        return new Request(id, req);
      }
      case BodyType.GetAddressInfo: {
        const addr = TypeDeserializer.digest(buf);
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
  /// Setting to undefined will remove any applied filter
  addrs: ScriptHash[] | undefined;
}

export interface GetPropertiesReq {
  type: BodyType.GetProperties;
}

export interface GetBlockReq {
  type: BodyType.GetBlock;
  height: Long;
}

export interface GetBlockHeaderReq {
  type: BodyType.GetBlockHeader;
  height: Long;
}

export interface GetAddressInfoReq {
  type: BodyType.GetAddressInfo;
  addr: ScriptHash;
}
