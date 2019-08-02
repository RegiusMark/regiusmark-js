import { Asset, AssetParseError, ArithmeticError } from '../src';
import bigInt from 'big-integer';

test('parse valid input', () => {
  const c = (asset: string, amount: string) => {
    expect(Asset.fromString(asset).amount.toString()).toBe(amount);
  };

  c('1.00000 GRAEL', '100000');
  c('-1.00000 GRAEL', '-100000');
  c('.10000 GRAEL', '10000');
  c('-.10000 GRAEL', '-10000');
  c('0.10000 GRAEL', '10000');
  c('0.00000 GRAEL', '0');
  c('-0.00000 GRAEL', '0');
});

test('fail parsing invalid input', () => {
  const c = (asset: string, err: string) => {
    expect(() => {
      Asset.fromString(asset);
    }).toThrowError(new AssetParseError(err));
  };

  c('1b10.00000 GRAEL', 'amount must be a valid number');
  c('a100.00000 GRAEL', 'amount must be a valid number');
  c('100.0000a GRAEL', 'amount must be a valid number');

  c('1 GRAEL', 'invalid format');
  c('0 GRAEL', 'invalid format');
  c('1.00000', 'invalid format');
  c('1.0000', 'invalid format');

  c('1. GRAEL', 'invalid precision');
  c('.1 GRAEL', 'invalid precision');
  c('-.1 GRAEL', 'invalid precision');
  c('0.1 GRAEL', 'invalid precision');
  c('1.0 GRAEL', 'invalid precision');
  c('-0.0 GRAEL', 'invalid precision');
  c('-1.0 GRAEL', 'invalid precision');
  c('1.0 GRAEL', 'invalid precision');
  c('1.000000 GRAEL', 'invalid precision');

  c('123456789012345678901 GRAEL', 'input too large');

  c('1.00000 GRAEL a', 'invalid format');
  c('1.00000 grael', 'asset type must be GRAEL');
});

test('asset to string', () => {
  const c = (asset: string, s: string) => {
    expect(Asset.fromString(asset).toString()).toBe(s);
  };
  c('1.00001 GRAEL', '1.00001 GRAEL');
  c('0.00001 GRAEL', '0.00001 GRAEL');
  c('0.00010 GRAEL', '0.00010 GRAEL');
  c('-0.00001 GRAEL', '-0.00001 GRAEL');
  c('.00001 GRAEL', '0.00001 GRAEL');
  c('.10000 GRAEL', '0.10000 GRAEL');
  c('1.00000 GRAEL', '1.00000 GRAEL');
});

test('perform arithmetic', () => {
  const c = (asset: Asset, s: string) => {
    expect(asset.toString()).toBe(s);
  };

  const a = Asset.fromString('123.45600 GRAEL');
  c(a.add(Asset.fromString('2.00000 GRAEL')), '125.45600 GRAEL');
  c(a.add(Asset.fromString('-2.00000 GRAEL')), '121.45600 GRAEL');
  c(a.add(Asset.fromString('.00001 GRAEL')), '123.45601 GRAEL');
  c(a.sub(Asset.fromString('2.00000 GRAEL')), '121.45600 GRAEL');
  c(a.sub(Asset.fromString('-2.00000 GRAEL')), '125.45600 GRAEL');
  c(a.mul(Asset.fromString('100000.11111 GRAEL')), '12345613.71719 GRAEL');

  c(a.mul(Asset.fromString('-100000.11111 GRAEL')), '-12345613.71719 GRAEL');
  c(a.div(Asset.fromString('23.00000 GRAEL')), '5.36765 GRAEL');
  c(a.div(Asset.fromString('-23.00000 GRAEL')), '-5.36765 GRAEL');
  c(a.pow(2), '15241.38393 GRAEL');
  c(a.pow(3), '1881640.29520 GRAEL');
  c(a, '123.45600 GRAEL');

  c(Asset.fromString('1.00020 GRAEL').pow(1000), '1.22137 GRAEL');
  c(Asset.fromString('10.00000 GRAEL').div(Asset.fromString('2.00000 GRAEL')), '5.00000 GRAEL');
  c(Asset.fromString('5.00000 GRAEL').div(Asset.fromString('10.00000 GRAEL')), '0.50000 GRAEL');
});

test('fail on invalid arithmetic', () => {
  expect(() => {
    new Asset(bigInt(100000)).div(new Asset(bigInt(0)));
  }).toThrow(new ArithmeticError('divide by zero'));

  expect(() => {
    new Asset(bigInt(100000)).pow('abc' as any);
  }).toThrow(new TypeError('input must be of type number'));

  expect(() => {
    new Asset(bigInt(100000)).pow(1.75);
  }).toThrow(new TypeError('input must be an integer'));
});

test('asset comparison', () => {
  expect(Asset.fromString('1.00000 GRAEL').gt(Asset.fromString('0.50000 GRAEL'))).toBe(true);
  expect(Asset.fromString('1.00000 GRAEL').gt(Asset.fromString('0.99000 GRAEL'))).toBe(true);

  expect(Asset.fromString('1.00000 GRAEL').geq(Asset.fromString('1.00000 GRAEL'))).toBe(true);
  expect(Asset.fromString('0.10000 GRAEL').geq(Asset.fromString('1.00000 GRAEL'))).toBe(false);

  expect(Asset.fromString('1.00000 GRAEL').leq(Asset.fromString('1.00000 GRAEL'))).toBe(true);
  expect(Asset.fromString('0.10000 GRAEL').leq(Asset.fromString('1.00000 GRAEL'))).toBe(true);
  expect(Asset.fromString('5.00000 GRAEL').leq(Asset.fromString('10.00000 GRAEL'))).toBe(true);

  expect(Asset.fromString('1.00000 GRAEL').eq(Asset.fromString('1.00000 GRAEL'))).toBe(true);
  expect(Asset.fromString('1.00000 GRAEL').gt(Asset.fromString('1.00000 GRAEL'))).toBe(false);
  expect(Asset.fromString('1.00000 GRAEL').lt(Asset.fromString('1.00000 GRAEL'))).toBe(false);
});
