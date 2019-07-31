import sodium from 'libsodium-wrappers-sumo';

export * from './crypto';

export async function init(): Promise<void> {
  await sodium.ready;
}
