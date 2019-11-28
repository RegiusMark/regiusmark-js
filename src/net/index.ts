export * from './response';
export * from './request';
export * from './error';

export enum BodyType {
  // Returned to clients when an error occurred processing a request
  Error = 0x01,

  // Operations that can update the connection or blockchain state
  Broadcast = 0x10,
  SetBlockFilter = 0x11,
  ClearBlockFilter = 0x12,
  Subscribe = 0x13,
  Unsubscribe = 0x14,

  // Getters
  GetProperties = 0x20,
  GetBlock = 0x21,
  GetFullBlock = 0x22,
  GetBlockRange = 0x23,
  GetAddressInfo = 0x24,
}
