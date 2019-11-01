import {
  generateKeyPair,
  ByteBuffer,
  TxVariant,
  BodyType,
  Asset,
  Response,
  NetworkError,
  NetErrorKind,
  OwnerTxV0,
  Block,
  BlockV0,
  BlockHeaderV0,
  doubleSha256,
  BlockHeader,
} from '../../src';
import Long from 'long';

test('fail to deserialize invalid type id response', (): void => {
  const buf = ByteBuffer.alloc(128)
    .writeUint32(0)
    .writeUint8(0xff)
    .resetOffset();
  expect((): void => {
    Response.deserialize(buf);
  }).toThrowError('unknown type id: 255');
});

test('serialize error response', (): void => {
  const res = new Response(1234, {
    type: BodyType.Error,
    error: new NetworkError(NetErrorKind.Io),
  });
  const buf = ByteBuffer.alloc(128);
  res.serialize(buf);
  buf.resetOffset();
  expect(Response.deserialize(buf)).toStrictEqual(res);
});

test('serialize broadcast response', (): void => {
  const res = new Response(0, {
    type: BodyType.Broadcast,
  });
  const buf = ByteBuffer.alloc(128);
  res.serialize(buf);
  buf.resetOffset();
  expect(Response.deserialize(buf)).toStrictEqual(res);
});

test('serialize set block filter response', (): void => {
  const res = new Response(0, {
    type: BodyType.SetBlockFilter,
  });
  const buf = ByteBuffer.alloc(128);
  res.serialize(buf);
  buf.resetOffset();
  expect(Response.deserialize(buf)).toStrictEqual(res);
});

test('serialize subscribe response', (): void => {
  const res = new Response(0, {
    type: BodyType.Subscribe,
  });
  const buf = ByteBuffer.alloc(128);
  res.serialize(buf);
  buf.resetOffset();
  expect(Response.deserialize(buf)).toStrictEqual(res);
});

test('serialize unsubscribe response', (): void => {
  const res = new Response(0, {
    type: BodyType.Unsubscribe,
  });
  const buf = ByteBuffer.alloc(128);
  res.serialize(buf);
  buf.resetOffset();
  expect(Response.deserialize(buf)).toStrictEqual(res);
});

test('serialize get properties response', (): void => {
  const minter = generateKeyPair();
  const wallet = generateKeyPair();

  const owner = new TxVariant(
    new OwnerTxV0(
      {
        timestamp: Long.fromNumber(12345, true),
        fee: Asset.fromString('1.00000 MARK'),
        signaturePairs: [],
      },
      {
        minter: minter.publicKey,
        wallet: wallet.publicKey.toScript().hash(),
        script: wallet.publicKey.toScript(),
      },
    ),
  );

  owner.sign(wallet);
  owner.sign(minter);

  const res = new Response(0, {
    type: BodyType.GetProperties,
    properties: {
      height: Long.fromNumber(123, true),
      owner,
      networkFee: Asset.fromString('1.12345 MARK'),
      tokenSupply: Asset.fromString('123456.00000 MARK'),
    },
  });

  const buf = ByteBuffer.alloc(128);
  res.serialize(buf);
  buf.resetOffset();
  expect(Response.deserialize(buf)).toStrictEqual(res);
});

test('serialize get block response', (): void => {
  const minter = generateKeyPair();
  const wallet = generateKeyPair();

  const tx = new TxVariant(
    new OwnerTxV0(
      {
        timestamp: Long.fromNumber(12345, true),
        fee: Asset.fromString('1.00000 MARK'),
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
        previousHash: doubleSha256(new Uint8Array([1, 2, 3])),
        txMerkleRoot: doubleSha256(new Uint8Array([4, 5, 6])),
      }),
      {
        signer: undefined,
        transactions: [tx],
      },
    ),
  );
  block.sign(minter);

  const res = new Response(1, {
    type: BodyType.GetBlock,
    block,
  });

  const buf = ByteBuffer.alloc(4096);
  res.serialize(buf);
  buf.resetOffset();
  expect(Response.deserialize(buf)).toStrictEqual(res);
});

test('serialize get block filtered response', (): void => {
  const minter = generateKeyPair();
  const wallet = generateKeyPair();

  const tx = new TxVariant(
    new OwnerTxV0(
      {
        timestamp: Long.fromNumber(12345, true),
        fee: Asset.fromString('1.00000 MARK'),
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

  const header = new BlockHeader(
    new BlockHeaderV0({
      timestamp: Long.fromNumber(12345, true),
      height: Long.fromNumber(12345, true),
      previousHash: doubleSha256(new Uint8Array([1, 2, 3])),
      txMerkleRoot: doubleSha256(new Uint8Array([4, 5, 6])),
    }),
  );
  const signer = minter.sign(header.calcHash());

  const res = new Response(1, {
    type: BodyType.GetBlock,
    block: [header, signer],
  });

  const buf = ByteBuffer.alloc(4096);
  res.serialize(buf);
  buf.resetOffset();
  expect(Response.deserialize(buf)).toStrictEqual(res);
});

test('serialize get block header response', (): void => {
  const minter = generateKeyPair();
  const wallet = generateKeyPair();

  const tx = new TxVariant(
    new OwnerTxV0(
      {
        timestamp: Long.fromNumber(12345, true),
        fee: Asset.fromString('1.00000 MARK'),
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

  const header = new BlockHeader(
    new BlockHeaderV0({
      timestamp: Long.fromNumber(12345, true),
      height: Long.fromNumber(12345, true),
      previousHash: doubleSha256(new Uint8Array([1, 2, 3])),
      txMerkleRoot: doubleSha256(new Uint8Array([4, 5, 6])),
    }),
  );
  const signer = minter.sign(header.calcHash());

  const res = new Response(1, {
    type: BodyType.GetBlockHeader,
    header: [header, signer],
  });

  const buf = ByteBuffer.alloc(4096);
  res.serialize(buf);
  buf.resetOffset();
  expect(Response.deserialize(buf)).toStrictEqual(res);
});

test('serialize get address info response', (): void => {
  const res = new Response(2, {
    type: BodyType.GetAddressInfo,
    info: {
      netFee: Asset.fromString('1.00000 MARK'),
      addrFee: Asset.fromString('0.00010 MARK'),
      balance: Asset.fromString('100000000.00000 MARK'),
    },
  });

  const buf = ByteBuffer.alloc(4096);
  res.serialize(buf);
  buf.resetOffset();
  expect(Response.deserialize(buf)).toStrictEqual(res);
});
