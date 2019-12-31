import { TypeDeserializer, TypeSerializer } from '../serializer';
import { ChainProperties, AddressInfo } from '../chain';
import { BlockHeader, Block } from '../block';
import { ByteBuffer } from '../bytebuffer';
import { TxVariant, TxType } from '../tx';
import { SigPair } from '../crypto';
import { RpcType } from '.';

export type Response =
  | BroadcastRes
  | SetBlockFilterRes
  | ClearBlockFilterRes
  | SubscribeRes
  | UnsubscribeRes
  | GetPropertiesRes
  | GetBlockRes
  | GetFullBlockRes
  | GetBlockRangeRes
  | GetAddressInfoRes;

export interface BroadcastRes {
  type: RpcType.Broadcast;
}

export interface SetBlockFilterRes {
  type: RpcType.SetBlockFilter;
}

export interface ClearBlockFilterRes {
  type: RpcType.ClearBlockFilter;
}

export interface SubscribeRes {
  type: RpcType.Subscribe;
}

export interface UnsubscribeRes {
  type: RpcType.Unsubscribe;
}

export interface GetPropertiesRes {
  type: RpcType.GetProperties;
  properties: ChainProperties;
}

export interface GetBlockRes {
  type: RpcType.GetBlock;
  block: [BlockHeader, SigPair] | Block;
}

export interface GetFullBlockRes {
  type: RpcType.GetFullBlock;
  block: Block;
}

export interface GetBlockRangeRes {
  type: RpcType.GetBlockRange;
}

export interface GetAddressInfoRes {
  type: RpcType.GetAddressInfo;
  info: AddressInfo;
}

export function serializeRes(buf: ByteBuffer, res: Response): void {
  buf.writeUint8(res.type);
  switch (res.type) {
    case RpcType.Broadcast:
      break;
    case RpcType.SetBlockFilter:
      break;
    case RpcType.ClearBlockFilter:
      break;
    case RpcType.Subscribe:
      break;
    case RpcType.Unsubscribe:
      break;
    case RpcType.GetProperties: {
      const props = res.properties;
      buf.writeUint64(props.height);
      props.owner.serialize(buf);
      TypeSerializer.asset(buf, props.networkFee);
      TypeSerializer.asset(buf, props.tokenSupply);
      break;
    }
    case RpcType.GetBlock:
      if (res.block instanceof Block) {
        buf.writeUint8(1);
        res.block.serialize(buf);
      } else {
        buf.writeUint8(0);
        res.block[0].serialize(buf);
        TypeSerializer.sigPair(buf, res.block[1]);
      }
      break;
    case RpcType.GetFullBlock:
      res.block.serialize(buf);
      break;
    case RpcType.GetBlockRange:
      break;
    case RpcType.GetAddressInfo: {
      const info = res.info;
      TypeSerializer.asset(buf, info.netFee);
      TypeSerializer.asset(buf, info.addrFee);
      TypeSerializer.asset(buf, info.balance);
      break;
    }
    /* istanbul ignore next */
    default:
      const _exhaustiveCheck: never = res;
      throw new Error(_exhaustiveCheck);
  }
}

export function deserializeRes(buf: ByteBuffer): Response {
  const type = buf.readUint8() as RpcType;
  if (!(type in RpcType)) throw new Error('unknown response id: ' + type);
  switch (type) {
    case RpcType.Broadcast: {
      const body: BroadcastRes = {
        type: RpcType.Broadcast,
      };
      return body;
    }
    case RpcType.SetBlockFilter: {
      const body: SetBlockFilterRes = {
        type: RpcType.SetBlockFilter,
      };
      return body;
    }
    case RpcType.ClearBlockFilter: {
      const body: ClearBlockFilterRes = {
        type: RpcType.ClearBlockFilter,
      };
      return body;
    }
    case RpcType.Subscribe: {
      const body: SubscribeRes = {
        type: RpcType.Subscribe,
      };
      return body;
    }
    case RpcType.Unsubscribe: {
      const body: UnsubscribeRes = {
        type: RpcType.Unsubscribe,
      };
      return body;
    }
    case RpcType.GetProperties: {
      const height = buf.readUint64();
      const owner = TxVariant.deserialize(buf);
      if (owner.tx.type !== TxType.OWNER) {
        throw new Error('expected owner tx');
      }
      const networkFee = TypeDeserializer.asset(buf);
      const tokenSupply = TypeDeserializer.asset(buf);

      const body: GetPropertiesRes = {
        type: RpcType.GetProperties,
        properties: {
          height,
          owner,
          networkFee,
          tokenSupply,
        },
      };

      return body;
    }
    case RpcType.GetBlock: {
      const filteredBlockType = buf.readUint8();
      let filteredBlock: [BlockHeader, SigPair] | Block;
      if (filteredBlockType === 0) {
        const header = BlockHeader.deserialize(buf);
        const signer = TypeDeserializer.sigPair(buf);
        filteredBlock = [header, signer];
      } else if (filteredBlockType === 1) {
        filteredBlock = Block.deserialize(buf);
      } else {
        throw new Error('invalid filtered block type: ' + filteredBlockType);
      }
      const body: GetBlockRes = {
        type: RpcType.GetBlock,
        block: filteredBlock,
      };
      return body;
    }
    case RpcType.GetFullBlock: {
      const block = Block.deserialize(buf);
      const body: GetFullBlockRes = {
        type: RpcType.GetFullBlock,
        block,
      };
      return body;
    }
    case RpcType.GetBlockRange: {
      const body: GetBlockRangeRes = {
        type: RpcType.GetBlockRange,
      };
      return body;
    }
    case RpcType.GetAddressInfo: {
      const netFee = TypeDeserializer.asset(buf);
      const addrFee = TypeDeserializer.asset(buf);
      const balance = TypeDeserializer.asset(buf);
      const info: AddressInfo = {
        netFee,
        addrFee,
        balance,
      };
      const body: GetAddressInfoRes = {
        type: RpcType.GetAddressInfo,
        info,
      };
      return body;
    }
    /* istanbul ignore next */
    default:
      const _exhaustiveCheck: never = type;
      throw new Error(_exhaustiveCheck);
  }
}
