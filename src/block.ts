import { TypeSerializer, TypeDeserializer } from './serializer';
import { ByteBuffer } from './bytebuffer';
import { SigPair } from './crypto';
import { TxVariant } from './tx';
import Long from 'long';

export type BlockVer = BlockV0;
export type BlockHeaderVer = BlockHeaderV0;

export class Block {
  public block: BlockVer;

  public constructor(block: BlockVer) {
    this.block = block;
  }

  public serialize(buf?: ByteBuffer): ByteBuffer {
    if (!buf) buf = ByteBuffer.alloc(1_048_576);
    /* istanbul ignore next */
    if (this.block instanceof BlockV0) {
      this.block.header.serialize(buf);
      this.block.serializeData(buf);
    } else {
      /* istanbul ignore next */
      throw new Error('unknown block version');
    }
    return buf;
  }

  public static deserialize(buf: ByteBuffer): Block {
    const header = BlockHeader.deserialize(buf).header;
    /* istanbul ignore next */
    if (header instanceof BlockHeaderV0) {
      const data = BlockV0.deserializeData(buf);
      return new Block(new BlockV0(header, data));
    } else {
      /* istanbul ignore next */
      throw new Error('unknown block header: ' + header);
    }
  }
}

export interface BlockDataV0 {
  signer: SigPair | undefined;
  transactions: TxVariant[];
}

export class BlockV0 {
  public header: BlockHeaderV0;
  public signer: SigPair | undefined;
  public transactions: TxVariant[];

  public constructor(header: BlockHeaderV0, data: BlockDataV0) {
    this.header = header;
    this.signer = data.signer;
    this.transactions = data.transactions;
  }

  public serializeData(buf: ByteBuffer): void {
    if (!this.signer) throw new Error('block must be signed to serialize');
    TypeSerializer.sigPair(buf, this.signer);
    buf.writeUint32(this.transactions.length);
    for (const tx of this.transactions) {
      tx.serialize(buf);
    }
  }

  public static deserializeData(buf: ByteBuffer): BlockDataV0 {
    const signer = TypeDeserializer.sigPair(buf);
    const txLen = buf.readUint32();
    const transactions = [];
    for (let i = 0; i < txLen; ++i) {
      transactions.push(TxVariant.deserialize(buf));
    }
    return {
      signer,
      transactions,
    };
  }
}

export class BlockHeader {
  public header: BlockHeaderVer;

  public constructor(header: BlockHeaderVer) {
    this.header = header;
  }

  public serialize(buf: ByteBuffer): void {
    /* istanbul ignore next */
    if (this.header instanceof BlockHeaderV0) {
      this.header.serialize(buf);
    } else {
      /* istanbul ignore next */
      throw new Error('unknown block header version');
    }
  }

  public static deserialize(buf: ByteBuffer): BlockHeader {
    const ver = buf.readUint16();
    switch (ver) {
      case 0:
        return new BlockHeader(BlockHeaderV0.deserialize(buf));
      default:
        throw new Error('unknown block version: ' + ver);
    }
  }
}

export interface BlockHeaderDataV0 {
  previousHash: Uint8Array;
  height: Long;
  timestamp: Long;
  txMerkleRoot: Uint8Array;
}

export class BlockHeaderV0 implements BlockHeaderDataV0 {
  public previousHash: Uint8Array;
  public height: Long;
  public timestamp: Long;
  public txMerkleRoot: Uint8Array;

  public constructor(data: BlockHeaderDataV0) {
    this.previousHash = data.previousHash;
    this.height = data.height;
    this.timestamp = data.timestamp;
    this.txMerkleRoot = data.txMerkleRoot;
  }

  public serialize(buf: ByteBuffer): void {
    // Version (2 bytes)
    buf.writeUint16(0);

    TypeSerializer.digest(buf, this.previousHash);
    buf.writeUint64(this.height);
    buf.writeUint64(this.timestamp);
    TypeSerializer.digest(buf, this.txMerkleRoot);
  }

  public static deserialize(buf: ByteBuffer): BlockHeaderV0 {
    // We expect the version to be known here

    const previousHash = TypeDeserializer.digest(buf);
    const height = buf.readUint64();
    const timestamp = buf.readUint64();
    const txMerkleRoot = TypeDeserializer.digest(buf);
    return new BlockHeaderV0({
      previousHash,
      height,
      timestamp,
      txMerkleRoot,
    });
  }
}
