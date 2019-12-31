import { TypeSerializer, TypeDeserializer } from '../serializer';
import { ByteBuffer } from '../bytebuffer';
import { ScriptHash } from '../crypto';
import { TxVariant } from '../tx';
import { RpcType } from '.';
import Long from 'long';

export type Request =
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

export interface BroadcastReq {
  type: RpcType.Broadcast;
  tx: TxVariant;
}

export interface SetBlockFilterReq {
  type: RpcType.SetBlockFilter;
  /// Setting to undefined or an empty array will filter all addresses
  addrs: ScriptHash[] | undefined;
}

export interface ClearBlockFilterReq {
  type: RpcType.ClearBlockFilter;
}

export interface SubscribeReq {
  type: RpcType.Subscribe;
}

export interface UnsubscribeReq {
  type: RpcType.Unsubscribe;
}

export interface GetPropertiesReq {
  type: RpcType.GetProperties;
}

export interface GetBlockReq {
  type: RpcType.GetBlock;
  height: Long;
}

export interface GetFullBlockReq {
  type: RpcType.GetFullBlock;
  height: Long;
}

export interface GetBlockRangeReq {
  type: RpcType.GetBlockRange;
  minHeight: Long;
  maxHeight: Long;
}

export interface GetAddressInfoReq {
  type: RpcType.GetAddressInfo;
  addr: ScriptHash;
}

export function serializeReq(buf: ByteBuffer, req: Request): void {
  buf.writeUint8(req.type);
  switch (req.type) {
    case RpcType.Broadcast:
      req.tx.serialize(buf);
      break;
    case RpcType.SetBlockFilter:
      if (!req.addrs) {
        // No addresses (len)
        buf.writeUint8(0);
      } else {
        buf.writeUint8(req.addrs.length);
        for (const addr of req.addrs) {
          TypeSerializer.digest(buf, addr.bytes);
        }
      }
      break;
    case RpcType.ClearBlockFilter:
      // No properties to serialize
      break;
    case RpcType.Subscribe:
      // No properties to serialize
      break;
    case RpcType.Unsubscribe:
      // No properties to serialize
      break;
    case RpcType.GetProperties:
      // No properties to serialize
      break;
    case RpcType.GetBlock:
      buf.writeUint64(req.height);
      break;
    case RpcType.GetFullBlock:
      buf.writeUint64(req.height);
      break;
    case RpcType.GetBlockRange:
      buf.writeUint64(req.minHeight);
      buf.writeUint64(req.maxHeight);
      break;
    case RpcType.GetAddressInfo:
      TypeSerializer.digest(buf, req.addr.bytes);
      break;
    /* istanbul ignore next */
    default:
      const _exhaustiveCheck: never = req;
      throw new Error(_exhaustiveCheck);
  }
}

export function deserializeReq(buf: ByteBuffer): Request {
  const type = buf.readUint8() as RpcType;
  if (!(type in RpcType)) throw new Error('unknown request id: ' + type);
  switch (type) {
    case RpcType.Broadcast: {
      const tx = TxVariant.deserialize(buf);
      const req: BroadcastReq = {
        type: RpcType.Broadcast,
        tx,
      };
      return req;
    }
    case RpcType.SetBlockFilter: {
      const addrLen = buf.readUint8();
      let addrs: ScriptHash[] | undefined;
      if (addrLen > 0) {
        addrs = [];
        for (let i = 0; i < addrLen; ++i) {
          addrs.push(new ScriptHash(TypeDeserializer.digest(buf)));
        }
      }
      const req: SetBlockFilterReq = {
        type: RpcType.SetBlockFilter,
        addrs,
      };
      return req;
    }
    case RpcType.ClearBlockFilter: {
      const req: ClearBlockFilterReq = {
        type: RpcType.ClearBlockFilter,
      };
      return req;
    }
    case RpcType.Subscribe: {
      const req: SubscribeReq = {
        type: RpcType.Subscribe,
      };
      return req;
    }
    case RpcType.Unsubscribe: {
      const req: UnsubscribeReq = {
        type: RpcType.Unsubscribe,
      };
      return req;
    }
    case RpcType.GetProperties: {
      const req: GetPropertiesReq = {
        type: RpcType.GetProperties,
      };
      return req;
    }
    case RpcType.GetBlock: {
      const height = buf.readUint64();
      const req: GetBlockReq = {
        type: RpcType.GetBlock,
        height,
      };
      return req;
    }
    case RpcType.GetFullBlock: {
      const height = buf.readUint64();
      const req: GetFullBlockReq = {
        type: RpcType.GetFullBlock,
        height,
      };
      return req;
    }
    case RpcType.GetBlockRange: {
      const minHeight = buf.readUint64();
      const maxHeight = buf.readUint64();
      const req: GetBlockRangeReq = {
        type: RpcType.GetBlockRange,
        minHeight,
        maxHeight,
      };
      return req;
    }
    case RpcType.GetAddressInfo: {
      const addr = new ScriptHash(TypeDeserializer.digest(buf));
      const req: GetAddressInfoReq = {
        type: RpcType.GetAddressInfo,
        addr,
      };
      return req;
    }
    /* istanbul ignore next */
    default:
      const _exhaustiveCheck: never = type;
      throw new Error(_exhaustiveCheck);
  }
}
