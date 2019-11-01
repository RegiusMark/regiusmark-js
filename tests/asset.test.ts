import { Asset, AssetParseError, ArithmeticError } from '../src';
import bigInt from 'big.js';

test('parse valid input', (): void => {
  const c = (asset: string, amount: string): void => {
    expect(Asset.fromString(asset).amount.toString()).toBe(amount);
  };

  c('1.00000 MARK', '100000');
  c('-1.00000 MARK', '-100000');
  c('.10000 MARK', '10000');
  c('-.10000 MARK', '-10000');
  c('0.10000 MARK', '10000');
  c('0.00000 MARK', '0');
  c('-0.00000 MARK', '0');
});

test('fail parsing invalid input', (): void => {
  const c = (asset: string, err: string): void => {
    expect((): void => {
      Asset.fromString(asset);
    }).toThrowError(new AssetParseError(err));
  };

  c('1b10.00000 MARK', 'amount must be a valid number');
  c('a100.00000 MARK', 'amount must be a valid number');
  c('100.0000a MARK', 'amount must be a valid number');

  c('1 MARK', 'invalid format');
  c('0 MARK', 'invalid format');
  c('1.00000', 'invalid format');
  c('1.0000', 'invalid format');

  c('1. MARK', 'invalid precision');
  c('.1 MARK', 'invalid precision');
  c('-.1 MARK', 'invalid precision');
  c('0.1 MARK', 'invalid precision');
  c('1.0 MARK', 'invalid precision');
  c('-0.0 MARK', 'invalid precision');
  c('-1.0 MARK', 'invalid precision');
  c('1.0 MARK', 'invalid precision');
  c('1.000000 MARK', 'invalid precision');

  c('1234567890123456789012 MARK', 'input too large');

  c('1.00000 MARK a', 'invalid format');
  c('1.00000 mark', 'asset type must be MARK');
});

test('asset to string', (): void => {
  const c = (asset: string, s: string): void => {
    const a = Asset.fromString(asset);
    expect(a.toString()).toBe(s);
    expect(a.toString(false)).toBe(s.split(' ')[0]);
  };
  c('1.00001 MARK', '1.00001 MARK');
  c('0.00001 MARK', '0.00001 MARK');
  c('0.00010 MARK', '0.00010 MARK');
  c('-0.00001 MARK', '-0.00001 MARK');
  c('.00001 MARK', '0.00001 MARK');
  c('.10000 MARK', '0.10000 MARK');
  c('1.00000 MARK', '1.00000 MARK');
});

test('perform arithmetic', (): void => {
  const c = (asset: Asset, s: string): void => {
    expect(asset.toString()).toBe(s);
  };

  {
    const a = Asset.fromString('123.45600 MARK');
    c(a.add(Asset.fromString('2.00000 MARK')), '125.45600 MARK');
    c(a.add(Asset.fromString('-2.00000 MARK')), '121.45600 MARK');
    c(a.add(Asset.fromString('.00001 MARK')), '123.45601 MARK');
    c(a.sub(Asset.fromString('2.00000 MARK')), '121.45600 MARK');
    c(a.sub(Asset.fromString('-2.00000 MARK')), '125.45600 MARK');
    c(a.mul(Asset.fromString('100000.11111 MARK')), '12345613.71719 MARK');

    c(a.mul(Asset.fromString('-100000.11111 MARK')), '-12345613.71719 MARK');
    c(a.div(Asset.fromString('23.00000 MARK')), '5.36765 MARK');
    c(a.div(Asset.fromString('-23.00000 MARK')), '-5.36765 MARK');
    c(a.pow(2), '15241.38393 MARK');
    c(a.pow(3), '1881640.29520 MARK');
    c(a, '123.45600 MARK');

    c(Asset.fromString('1.00020 MARK').pow(1000), '1.22137 MARK');
    c(Asset.fromString('10.00000 MARK').div(Asset.fromString('2.00000 MARK')), '5.00000 MARK');
    c(Asset.fromString('5.00000 MARK').div(Asset.fromString('10.00000 MARK')), '0.50000 MARK');
  }

  // Test to ensure the constructor is overwritten with the proper DP and RM configs
  {
    const a = new Asset(bigInt(12345600));
    c(a.add(new Asset(bigInt(200000))), '125.45600 MARK');
    c(a.add(new Asset(bigInt(-200000))), '121.45600 MARK');
    c(a.add(new Asset(bigInt(1))), '123.45601 MARK');
    c(a.sub(new Asset(bigInt(200000))), '121.45600 MARK');
    c(a.sub(new Asset(bigInt(-200000))), '125.45600 MARK');
    c(a.mul(new Asset(bigInt(10000011111))), '12345613.71719 MARK');

    c(a.mul(new Asset(bigInt(-10000011111))), '-12345613.71719 MARK');
    c(a.div(new Asset(bigInt(2300000))), '5.36765 MARK');
    c(a.div(new Asset(bigInt(-2300000))), '-5.36765 MARK');
    c(a.pow(2), '15241.38393 MARK');
    c(a.pow(3), '1881640.29520 MARK');
    c(a, '123.45600 MARK');

    c(new Asset(bigInt(100020)).pow(1000), '1.22137 MARK');
    c(new Asset(bigInt(1000000)).div(new Asset(bigInt(200000))), '5.00000 MARK');
    c(new Asset(bigInt(500000)).div(new Asset(bigInt(1000000))), '0.50000 MARK');
  }
});

test('fail on invalid arithmetic', (): void => {
  expect((): void => {
    new Asset(bigInt(100000)).div(new Asset(bigInt(0)));
  }).toThrow(new ArithmeticError('divide by zero'));

  expect((): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new Asset(bigInt(100000)).pow('abc' as any);
  }).toThrow(new TypeError('input must be of type number'));

  expect((): void => {
    new Asset(bigInt(100000)).pow(1.75);
  }).toThrow(new TypeError('input must be an integer'));
});

test('asset comparison', (): void => {
  expect(Asset.fromString('1.00000 MARK').gt(Asset.fromString('0.50000 MARK'))).toBe(true);
  expect(Asset.fromString('1.00000 MARK').gt(Asset.fromString('0.99000 MARK'))).toBe(true);

  expect(Asset.fromString('1.00000 MARK').geq(Asset.fromString('1.00000 MARK'))).toBe(true);
  expect(Asset.fromString('0.10000 MARK').geq(Asset.fromString('1.00000 MARK'))).toBe(false);

  expect(Asset.fromString('1.00000 MARK').leq(Asset.fromString('1.00000 MARK'))).toBe(true);
  expect(Asset.fromString('0.10000 MARK').leq(Asset.fromString('1.00000 MARK'))).toBe(true);
  expect(Asset.fromString('5.00000 MARK').leq(Asset.fromString('10.00000 MARK'))).toBe(true);

  expect(Asset.fromString('1.00000 MARK').eq(Asset.fromString('1.00000 MARK'))).toBe(true);
  expect(Asset.fromString('1.00000 MARK').gt(Asset.fromString('1.00000 MARK'))).toBe(false);
  expect(Asset.fromString('1.00000 MARK').lt(Asset.fromString('1.00000 MARK'))).toBe(false);
});
