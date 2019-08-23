import {
  OwnerTxV0,
  ByteBuffer,
  Block,
  BlockV0,
  Asset,
  generateKeyPair,
  TxVariant,
  doubleSha256,
  BlockHeaderV0,
  BlockHeader,
} from '../src';
import Long from 'long';

test('serialize block v0', (): void => {
  const minter = generateKeyPair();
  const wallet = generateKeyPair();

  const previousHash = doubleSha256(new Uint8Array([1, 2, 3]));
  const txMerkleRoot = doubleSha256(new Uint8Array([4, 5, 6]));

  const tx = new TxVariant(
    new OwnerTxV0(
      {
        timestamp: Long.fromNumber(12345, true),
        fee: Asset.fromString('1.00000 GRAEL'),
        signaturePairs: [],
      },
      {
        minter: minter.publicKey,
        wallet: wallet.publicKey.toScript().hash(),
        script: wallet.publicKey.toScript(),
      },
    ),
  );

  tx.sign(wallet);
  tx.sign(minter);

  const block = new Block(
    new BlockV0(
      new BlockHeaderV0({
        timestamp: Long.fromNumber(12345, true),
        height: Long.fromNumber(12345, true),
        previousHash,
        txMerkleRoot,
      }),
      {
        signer: undefined,
        transactions: [tx],
      },
    ),
  );

  {
    // Sign the block
    const buf = ByteBuffer.alloc(256);
    block.block.header.serialize(buf);
    block.block.signer = minter.sign(buf.sharedView());
  }

  {
    // Test automatic buffer alloc
    const buf = block.serialize().resetOffset();
    const dec = Block.deserialize(buf);
    expect(dec).toEqual(block);
  }

  {
    // Test manual buffer alloc
    const buf = block.serialize(ByteBuffer.alloc(0)).resetOffset();
    const dec = Block.deserialize(buf);
    expect(dec).toEqual(block);
  }
});

test('serialize block header v0', (): void => {
  const previousHash = doubleSha256(new Uint8Array([1, 2, 3]));
  const txMerkleRoot = doubleSha256(new Uint8Array([4, 5, 6]));

  const header = new BlockHeader(
    new BlockHeaderV0({
      timestamp: Long.fromNumber(12345, true),
      height: Long.fromNumber(12345, true),
      previousHash,
      txMerkleRoot,
    }),
  );

  const buf = ByteBuffer.alloc(256);
  header.serialize(buf);
  buf.resetOffset();

  const dec = BlockHeader.deserialize(buf);
  expect(dec).toEqual(header);
});

test('fail to serialize unsigned block v0', (): void => {
  const previousHash = doubleSha256(new Uint8Array([1, 2, 3]));
  const txMerkleRoot = doubleSha256(new Uint8Array([4, 5, 6]));

  const block = new Block(
    new BlockV0(
      new BlockHeaderV0({
        timestamp: Long.fromNumber(12345, true),
        height: Long.fromNumber(12345, true),
        previousHash,
        txMerkleRoot,
      }),
      {
        signer: undefined,
        transactions: [],
      },
    ),
  );

  expect((): void => {
    block.serialize();
  }).toThrowError('block must be signed to serialize');
});

test('fail to serialize invalid digest length', (): void => {
  const minter = generateKeyPair();
  const wallet = generateKeyPair();

  const tx = new TxVariant(
    new OwnerTxV0(
      {
        timestamp: Long.fromNumber(12345, true),
        fee: Asset.fromString('1.00000 GRAEL'),
        signaturePairs: [],
      },
      {
        minter: minter.publicKey,
        wallet: wallet.publicKey.toScript().hash(),
        script: wallet.publicKey.toScript(),
      },
    ),
  );

  tx.sign(wallet);
  tx.sign(minter);

  const block = new Block(
    new BlockV0(
      new BlockHeaderV0({
        timestamp: Long.fromNumber(12345, true),
        height: Long.fromNumber(12345, true),
        previousHash: new Uint8Array(32),
        txMerkleRoot: new Uint8Array(32),
      }),
      {
        signer: undefined,
        transactions: [tx],
      },
    ),
  );

  {
    // Sign the block
    const buf = ByteBuffer.alloc(256);
    block.block.header.serialize(buf);
    block.block.signer = minter.sign(buf.sharedView());
  }

  // Set previousHash to have invalid length
  block.block.header.previousHash = new Uint8Array(33);
  expect((): void => {
    const buf = block.serialize().resetOffset();
    Block.deserialize(buf);
  }).toThrowError('expected sha256 digest length');
  // Restore previousHash length to test the next property
  block.block.header.previousHash = new Uint8Array(32);

  // Set txMerkleRoot to have invalid length
  block.block.header.txMerkleRoot = new Uint8Array(33);
  expect((): void => {
    const buf = block.serialize().resetOffset();
    Block.deserialize(buf);
  }).toThrowError('expected sha256 digest length');
});

test('fail to deserialize unknown block version', (): void => {
  expect((): void => {
    Block.deserialize(ByteBuffer.from(new Uint8Array([0xff, 0xff])));
  }).toThrowError('unknown block version: ' + 0xffff);
});
