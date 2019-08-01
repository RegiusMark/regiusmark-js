import sodium from 'libsodium-wrappers';

export * from './crypto';

export async function init(): Promise<void> {
  await sodium.ready;
}
