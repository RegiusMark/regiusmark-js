import { TxVariant } from './tx';
import { Asset } from './asset';
import Long from 'long';

export interface ChainProperties {
  height: Long;
  owner: TxVariant;
  networkFee: Asset;
  tokenSupply: Asset;
}

export interface AddressInfo {
  netFee: Asset;
  addrFee: Asset;
  balance: Asset;
}
