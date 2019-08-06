import { PublicKey, SigPair, ScriptHash, Script } from './crypto';
import { TypeSerializer, TypeDeserializer } from './serializer';
import { Asset } from './asset';
import Long from 'long';

export enum TxType {
  OWNER = 0,
  MINT = 1,
  REWARD = 2,
  TRANSFER = 3,
}

export type TxVariant = OwnerTx | MintTx | RewardTx | TransferTx;

export interface TxData {
  timestamp: Long; // unsigned 64-bit integer, epoch time in ms
  fee: Asset;
  signaturePairs: SigPair[];
}

export abstract class Tx {
  public readonly type: TxType;
  public timestamp: Long;
  public fee: Asset;
  public signaturePairs: SigPair[];

  public constructor(type: TxType, data: TxData) {
    if (!data.timestamp.unsigned) {
      throw new Error('timestamp must be unsigned long');
    }
    this.type = type;
    this.timestamp = data.timestamp;
    this.fee = data.fee;
    this.signaturePairs = data.signaturePairs;
  }

  public abstract serializeData(buf: ByteBuffer): void;

  public serialize(buf: ByteBuffer, includeSigs: boolean = true): void {
    this.serializeHeader(buf);
    this.serializeData(buf);

    if (includeSigs) {
      buf.writeUint8(this.signaturePairs.length);
      for (const sig of this.signaturePairs) {
        TypeSerializer.sigPair(buf, sig);
      }
    }
  }

  public serializeHeader(buf: ByteBuffer): void {
    buf.writeUint8(this.type);
    buf.writeUint64(this.timestamp);
    TypeSerializer.asset(buf, this.fee);
  }

  public static deserialize(buf: ByteBuffer): TxVariant {
    const header = Tx.deserializeHeader(buf);

    switch (header[0]) {
      case TxType.OWNER: {
        const data = OwnerTx.deserializeData(buf);
        header[1].signaturePairs = Tx.deserializeSigs(buf);
        return new OwnerTx(header[1], data);
      }
      case TxType.MINT: {
        const data = MintTx.deserializeData(buf);
        header[1].signaturePairs = Tx.deserializeSigs(buf);
        return new MintTx(header[1], data);
      }
      case TxType.REWARD: {
        const data = RewardTx.deserializeData(buf);
        header[1].signaturePairs = Tx.deserializeSigs(buf);
        return new RewardTx(header[1], data);
      }
      case TxType.TRANSFER: {
        const data = TransferTx.deserializeData(buf);
        header[1].signaturePairs = Tx.deserializeSigs(buf);
        return new TransferTx(header[1], data);
      }
      default:
        throw new Error('unknown tx type deserializing tx: ' + header[0]);
    }
  }

  public static deserializeHeader(buf: ByteBuffer): [TxType, TxData] {
    const type = buf.readUint8() as TxType;
    switch (type) {
      case TxType.OWNER:
        break;
      case TxType.MINT:
        break;
      case TxType.REWARD:
        break;
      case TxType.TRANSFER:
        break;
      default:
        throw new Error('unknown tx type deserializing header: ' + type);
    }

    const timestamp = buf.readUint64();
    const fee = TypeDeserializer.asset(buf);
    const signaturePairs: SigPair[] = [];

    return [type, { timestamp, fee, signaturePairs }];
  }

  private static deserializeSigs(buf: ByteBuffer): SigPair[] {
    const sigLen = buf.readUint8();
    const sigs = [];
    for (let i = 0; i < sigLen; ++i) {
      sigs.push(TypeDeserializer.sigPair(buf));
    }
    return sigs;
  }
}

export interface OwnerTxData {
  minter: PublicKey; // Key that signs blocks
  wallet: ScriptHash; // Hot wallet that receives rewards
  script: Script; // Hot wallet previous script
}

export class OwnerTx extends Tx implements OwnerTxData {
  public minter: PublicKey;
  public wallet: ScriptHash;
  public script: Script;

  public constructor(base: TxData, data: OwnerTxData) {
    super(TxType.OWNER, base);
    this.minter = data.minter;
    this.wallet = data.wallet;
    this.script = data.script;
  }

  public serializeData(buf: ByteBuffer): void {
    TypeSerializer.publicKey(buf, this.minter);
    TypeSerializer.scriptHash(buf, this.wallet);
    TypeSerializer.buffer(buf, this.script);
  }

  public static deserializeData(buf: ByteBuffer): OwnerTxData {
    const minter = TypeDeserializer.publicKey(buf);
    const wallet = TypeDeserializer.scriptHash(buf);
    const script = TypeDeserializer.buffer(buf);

    return {
      minter,
      wallet,
      script,
    };
  }
}

export interface MintTxData {
  to: ScriptHash;
  amount: Asset;
  attachment: Uint8Array;
  attachmentName: string;
  script: Script;
}

export class MintTx extends Tx implements MintTxData {
  public to: ScriptHash;
  public amount: Asset;
  public attachment: Uint8Array;
  public attachmentName: string;
  public script: Script;

  public constructor(base: TxData, data: MintTxData) {
    super(TxType.MINT, base);
    this.to = data.to;
    this.amount = data.amount;
    this.attachment = data.attachment;
    this.attachmentName = data.attachmentName;
    this.script = data.script;
  }

  public serializeData(buf: ByteBuffer): void {
    TypeSerializer.scriptHash(buf, this.to);
    TypeSerializer.asset(buf, this.amount);
    TypeSerializer.buffer(buf, this.attachment);
    TypeSerializer.string(buf, this.attachmentName);
    TypeSerializer.buffer(buf, this.script);
  }

  public static deserializeData(buf: ByteBuffer): MintTxData {
    const to = TypeDeserializer.scriptHash(buf);
    const amount = TypeDeserializer.asset(buf);
    const attachment = TypeDeserializer.buffer(buf);
    const attachmentName = TypeDeserializer.string(buf);
    const script = TypeDeserializer.buffer(buf);

    return {
      to,
      amount,
      attachment,
      attachmentName,
      script,
    };
  }
}

export interface RewardTxData {
  to: ScriptHash;
  rewards: Asset;
}

export class RewardTx extends Tx implements RewardTxData {
  public to: ScriptHash;
  public rewards: Asset;

  public constructor(base: TxData, data: RewardTxData) {
    super(TxType.REWARD, base);
    this.to = data.to;
    this.rewards = data.rewards;
  }

  public serializeData(buf: ByteBuffer): void {
    TypeSerializer.scriptHash(buf, this.to);
    TypeSerializer.asset(buf, this.rewards);
  }

  public static deserializeData(buf: ByteBuffer): RewardTxData {
    const to = TypeDeserializer.scriptHash(buf);
    const rewards = TypeDeserializer.asset(buf);

    return {
      to,
      rewards,
    };
  }
}

export interface TransferTxData {
  from: ScriptHash;
  to: ScriptHash;
  script: Script;
  amount: Asset;
  memo: Uint8Array;
}

export class TransferTx extends Tx implements TransferTxData {
  public from: ScriptHash;
  public to: ScriptHash;
  public script: Script;
  public amount: Asset;
  public memo: Uint8Array;

  public constructor(base: TxData, data: TransferTxData) {
    super(TxType.TRANSFER, base);
    this.from = data.from;
    this.to = data.to;
    this.script = data.script;
    this.amount = data.amount;
    this.memo = data.memo;
  }

  public serializeData(buf: ByteBuffer): void {
    TypeSerializer.scriptHash(buf, this.from);
    TypeSerializer.scriptHash(buf, this.to);
    TypeSerializer.buffer(buf, this.script);
    TypeSerializer.asset(buf, this.amount);
    TypeSerializer.buffer(buf, this.memo);
  }

  public static deserializeData(buf: ByteBuffer): TransferTxData {
    const from = TypeDeserializer.scriptHash(buf);
    const to = TypeDeserializer.scriptHash(buf);
    const script = TypeDeserializer.buffer(buf);
    const amount = TypeDeserializer.asset(buf);
    const memo = TypeDeserializer.buffer(buf);

    return {
      from,
      to,
      script,
      amount,
      memo,
    };
  }
}
