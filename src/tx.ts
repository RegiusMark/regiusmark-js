import { PublicKey, SigPair, ScriptHash, Script } from './crypto';
import { Asset } from './asset';
import Long from 'long';

export enum TxType {
  OWNER = 0,
  MINT = 1,
  REWARD = 2,
  TRANSFER = 3,
}

export interface TxData {
  timestamp: Long; // unsigned 64-bit integer, epoch time in ms
  fee: Asset;
  signaturePairs: SigPair[];
}

export class Tx {
  public readonly type: TxType;
  public timestamp: Long;
  public fee: Asset;
  public signaturePairs: SigPair[];

  public constructor(type: TxType, data: TxData) {
    this.type = type;
    this.timestamp = data.timestamp;
    this.fee = data.fee;
    this.signaturePairs = data.signaturePairs;
  }
}

export interface OwnerTxData {
  minter: PublicKey; // Key that signs blocks
  wallet: ScriptHash; // Hot wallet that receives rewards
  script: Script; // Hot wallet previous script
}

export class OwnerTx extends Tx implements OwnerTxData {
  public minter: PublicKey;
  public wallet: Uint8Array;
  public script: Uint8Array;

  public constructor(base: TxData, data: OwnerTxData) {
    super(TxType.OWNER, base);
    this.minter = data.minter;
    this.wallet = data.wallet;
    this.script = data.script;
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
}
