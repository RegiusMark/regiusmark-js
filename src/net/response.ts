import { TypeDeserializer, TypeSerializer } from '../serializer';
import { ChainProperties, AddressInfo } from '../chain';
import { BlockHeader, Block } from '../block';
import { ByteBuffer } from '../bytebuffer';
import { TxVariant, TxType } from '../tx';
import { NetworkError } from './error';
import { SigPair } from '../crypto';
import { BodyType } from '.';

export type ResponseBody =
  | ErrorRes
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

export class Response {
  /// A 32-bit unsigned integer max value represents an IO error during processing the request. Note that sending a
  /// request with a max value will be treated as an IO error regardless if the request is valid.
  public id: number;
  public body: ResponseBody;

  public constructor(id: number, body: ResponseBody) {
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
      case BodyType.Broadcast:
        break;
      case BodyType.SetBlockFilter:
        break;
      case BodyType.ClearBlockFilter:
        break;
      case BodyType.Subscribe:
        break;
      case BodyType.Unsubscribe:
        break;
      case BodyType.GetProperties: {
        const props = this.body.properties;
        buf.writeUint64(props.height);
        props.owner.serialize(buf);
        TypeSerializer.asset(buf, props.networkFee);
        TypeSerializer.asset(buf, props.tokenSupply);
        break;
      }
      case BodyType.GetBlock:
        if (this.body.block instanceof Block) {
          buf.writeUint8(1);
          this.body.block.serialize(buf);
        } else {
          buf.writeUint8(0);
          this.body.block[0].serialize(buf);
          TypeSerializer.sigPair(buf, this.body.block[1]);
        }
        break;
      case BodyType.GetFullBlock:
        this.body.block.serialize(buf);
        break;
      case BodyType.GetBlockRange:
        break;
      case BodyType.GetAddressInfo: {
        const info = this.body.info;
        TypeSerializer.asset(buf, info.netFee);
        TypeSerializer.asset(buf, info.addrFee);
        TypeSerializer.asset(buf, info.balance);
        break;
      }
      /* istanbul ignore next */
      default:
        const _exhaustiveCheck: never = this.body;
        return _exhaustiveCheck;
    }
  }

  public static deserialize(buf: ByteBuffer): Response {
    const id = buf.readUint32();
    const type = buf.readUint8() as BodyType;
    if (!(type in BodyType)) throw new Error('unknown type id: ' + type);
    switch (type) {
      case BodyType.Error: {
        const error = NetworkError.deserialize(buf);
        const body: ErrorRes = {
          type: BodyType.Error,
          error,
        };
        return new Response(id, body);
      }
      case BodyType.Broadcast: {
        const body: BroadcastRes = {
          type: BodyType.Broadcast,
        };
        return new Response(id, body);
      }
      case BodyType.SetBlockFilter: {
        const body: SetBlockFilterRes = {
          type: BodyType.SetBlockFilter,
        };
        return new Response(id, body);
      }
      case BodyType.ClearBlockFilter: {
        const body: ClearBlockFilterRes = {
          type: BodyType.ClearBlockFilter,
        };
        return new Response(id, body);
      }
      case BodyType.Subscribe: {
        const body: SubscribeRes = {
          type: BodyType.Subscribe,
        };
        return new Response(id, body);
      }
      case BodyType.Unsubscribe: {
        const body: UnsubscribeRes = {
          type: BodyType.Unsubscribe,
        };
        return new Response(id, body);
      }
      case BodyType.GetProperties: {
        const height = buf.readUint64();
        const owner = TxVariant.deserialize(buf);
        if (owner.tx.type !== TxType.OWNER) {
          throw new Error('expected owner tx');
        }
        const networkFee = TypeDeserializer.asset(buf);
        const tokenSupply = TypeDeserializer.asset(buf);

        const body: GetPropertiesRes = {
          type: BodyType.GetProperties,
          properties: {
            height,
            owner,
            networkFee,
            tokenSupply,
          },
        };

        return new Response(id, body);
      }
      case BodyType.GetBlock: {
        const filteredBlockType = buf.readUint8();
        let filteredBlock: [BlockHeader, SigPair] | Block;
        if (filteredBlockType === 0) {
          const header = BlockHeader.deserialize(buf);
          const signer = TypeDeserializer.sigPair(buf);
          filteredBlock = [header, signer];
        } else if (filteredBlockType === 1) {
          filteredBlock = Block.deserialize(buf);
        } else {
          throw new Error('invalid filtered block type');
        }
        const body: GetBlockRes = {
          type: BodyType.GetBlock,
          block: filteredBlock,
        };
        return new Response(id, body);
      }
      case BodyType.GetFullBlock: {
        const block = Block.deserialize(buf);
        const body: GetFullBlockRes = {
          type: BodyType.GetFullBlock,
          block,
        };
        return new Response(id, body);
      }
      case BodyType.GetBlockRange: {
        const body: GetBlockRangeRes = {
          type: BodyType.GetBlockRange,
        };
        return new Response(id, body);
      }
      case BodyType.GetAddressInfo: {
        const netFee = TypeDeserializer.asset(buf);
        const addrFee = TypeDeserializer.asset(buf);
        const balance = TypeDeserializer.asset(buf);
        const info: AddressInfo = {
          netFee,
          addrFee,
          balance,
        };
        const body: GetAddressInfoRes = {
          type: BodyType.GetAddressInfo,
          info,
        };
        return new Response(id, body);
      }
      /* istanbul ignore next */
      default:
        const _exhaustiveCheck: never = type;
        return _exhaustiveCheck;
    }
  }
}

export interface ErrorRes {
  type: BodyType.Error;
  error: NetworkError;
}

export interface BroadcastRes {
  type: BodyType.Broadcast;
}

export interface SetBlockFilterRes {
  type: BodyType.SetBlockFilter;
}

export interface ClearBlockFilterRes {
  type: BodyType.ClearBlockFilter;
}

export interface SubscribeRes {
  type: BodyType.Subscribe;
}

export interface UnsubscribeRes {
  type: BodyType.Unsubscribe;
}

export interface GetPropertiesRes {
  type: BodyType.GetProperties;
  properties: ChainProperties;
}

export interface GetBlockRes {
  type: BodyType.GetBlock;
  block: [BlockHeader, SigPair] | Block;
}

export interface GetFullBlockRes {
  type: BodyType.GetFullBlock;
  block: Block;
}

export interface GetBlockRangeRes {
  type: BodyType.GetBlockRange;
}

export interface GetAddressInfoRes {
  type: BodyType.GetAddressInfo;
  info: AddressInfo;
}
