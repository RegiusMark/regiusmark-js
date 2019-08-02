import { Big } from 'big.js';

const big = Big();
big.DP = 0;
big.RM = 0;

export const ASSET_SYMBOL = 'GRAEL';

export class Asset {
  public static readonly MAX_STR_LEN = 26;
  public static readonly MAX_PRECISION = 5;

  public static fromString(str: string): Asset {
    if (str.length > Asset.MAX_STR_LEN) throw new AssetParseError('input too large');
    const split = str.split(' ');
    if (split.length !== 2) throw new AssetParseError('invalid format');
    if (!/^-?[0-9]*\.?[0-9]+\.?$/.test(split[0])) throw new AssetParseError('amount must be a valid number');
    if (split[1] !== ASSET_SYMBOL) throw new AssetParseError(`asset type must be ${ASSET_SYMBOL}`);

    const index = split[0].indexOf('.');
    if (index === -1) throw new AssetParseError('invalid format');

    const decimals = split[0].substring(index + 1).length;
    if (decimals !== Asset.MAX_PRECISION) {
      throw new AssetParseError(`invalid precision`);
    }
    const num = big(split[0].replace('.', ''));
    return new Asset(num);
  }

  public readonly amount: Big;

  public constructor(amount: Big) {
    if (!(amount instanceof Big)) throw new TypeError('input must be of type Big');
    amount.constructor = big;
    this.amount = amount;
  }

  public add(other: Asset): Asset {
    return new Asset(this.amount.add(other.amount));
  }

  public sub(other: Asset): Asset {
    return new Asset(this.amount.sub(other.amount));
  }

  public mul(other: Asset): Asset {
    const res = this.amount.mul(other.amount);
    const mult = setDecimals(res, Asset.MAX_PRECISION * 2, Asset.MAX_PRECISION);
    return new Asset(mult);
  }

  public div(other: Asset): Asset {
    if (other.amount.eq(0)) throw new ArithmeticError('divide by zero');
    const t = setDecimals(this.amount, Asset.MAX_PRECISION, Asset.MAX_PRECISION * 2);
    return new Asset(t.div(other.amount));
  }

  public pow(num: number): Asset {
    if (typeof num !== 'number') throw new TypeError('input must be of type number');
    if (num % 1 !== 0) throw new TypeError('input must be an integer');

    const dec = Asset.MAX_PRECISION * num;
    const pow = setDecimals(this.amount.pow(num), dec, Asset.MAX_PRECISION);

    return new Asset(pow);
  }

  public geq(other: Asset): boolean {
    return this.amount.gte(other.amount);
  }

  public gt(other: Asset): boolean {
    return this.amount.gt(other.amount);
  }

  public lt(other: Asset): boolean {
    return this.amount.lt(other.amount);
  }

  public leq(other: Asset): boolean {
    return this.amount.lte(other.amount);
  }

  public eq(other: Asset): boolean {
    return this.amount.eq(other.amount);
  }

  public toString(): string {
    let amount = this.amount.toString();
    const negative = this.amount.lt(0);
    if (negative) amount = amount.substring(1);

    const int = amount.substring(0, amount.length - Asset.MAX_PRECISION);
    let decimals = amount.substring(amount.length - Asset.MAX_PRECISION);
    decimals = (int ? '.' : '0.') + '0'.repeat(Asset.MAX_PRECISION - decimals.length) + decimals;

    return `${negative ? '-' : ''}${int}${decimals} ${ASSET_SYMBOL}`;
  }
}

export const EMPTY_GRAEL = new Asset(big(0));

export class AssetParseError extends Error {
  public constructor(msg: string) {
    super(msg);
  }
}

export class ArithmeticError extends Error {
  public constructor(msg: string) {
    super(msg);
  }
}

function setDecimals(old: Big, oldDecimals: number, newDecimals: number): Big {
  if (newDecimals > oldDecimals) {
    return old.mul(big('1' + '0'.repeat(newDecimals - oldDecimals)));
  } else if (newDecimals < oldDecimals) {
    return old.div(big('1' + '0'.repeat(oldDecimals - newDecimals)));
  }
  return old;
}
