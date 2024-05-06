import { isDevMode } from '@/utils/env';

// System default cache time, in seconds
export const DEFAULT_CACHE_TIME = 60 * 60 * 24 * 7;

// aes encryption key
export const cacheCipher = {
  key: import.meta.env.VITE_AES_KEY,
  iv: import.meta.env.VITE_AES_IV,
};

// Whether the system cache is encrypted using aes
export const SHOULD_ENABLE_STORAGE_ENCRYPTION = !isDevMode();

export const rsaCipher = {
  privateKey: import.meta.env.VITE_RSA_PRIVATE_KEY,
  publicKey: import.meta.env.VITE_RSA_PUBLIC_KEY,
  publicKeyServer: import.meta.env.VITE_RSA_PUBLIC_KEY_SERVER,
};
