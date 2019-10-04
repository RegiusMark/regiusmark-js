declare module 'sha.js/sha256' {
  import { Hash } from 'crypto';

  export interface Sha256Hash {
    new (): Hash;
  }

  const sha256: Sha256Hash;
  export default sha256;
}
