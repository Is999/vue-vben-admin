import { decrypt as aesDecrypt, encrypt as aesEncrypt } from 'crypto-js/aes';
import UTF8, { parse } from 'crypto-js/enc-utf8';
import pkcs7 from 'crypto-js/pad-pkcs7';
import CTR from 'crypto-js/mode-ctr';
import Base64 from 'crypto-js/enc-base64';
import MD5 from 'crypto-js/md5';
import SHA256 from 'crypto-js/sha256';
import SHA512 from 'crypto-js/sha512';
import { isEmpty } from '@/utils/is';
import JSEncrypt from 'jsencrypt';
import { IJSEncryptOptions } from 'jsencrypt/lib/JSEncrypt';

// Define an interface for encryption
// 定义一个加密器的接口
export interface Encryption {
  encrypt(plainText: string): string;

  decrypt(cipherText: string): string;
}

// Define an interface for Hashing
// 定义一个哈希算法的接口
export interface Hashing {
  hash(data: string): string;
}

export interface EncryptionParams {
  key: string;
  iv: string;
}

class AesEncryption implements Encryption {
  private readonly key;
  private readonly iv;

  constructor({ key, iv }: EncryptionParams) {
    this.key = parse(key);
    this.iv = parse(iv);
  }

  get getOptions() {
    return {
      mode: CTR,
      padding: pkcs7,
      iv: this.iv,
    };
  }

  encrypt(plainText: string) {
    return aesEncrypt(plainText, this.key, this.getOptions).toString();
  }

  decrypt(cipherText: string) {
    return aesDecrypt(cipherText, this.key, this.getOptions).toString(UTF8);
  }
}

// Define a singleton class for Base64 encryption
class Base64Encryption implements Encryption {
  private static instance: Base64Encryption;

  private constructor() {}

  // Get the singleton instance
  // 获取单例实例
  public static getInstance(): Base64Encryption {
    if (!Base64Encryption.instance) {
      Base64Encryption.instance = new Base64Encryption();
    }
    return Base64Encryption.instance;
  }

  encrypt(plainText: string) {
    return UTF8.parse(plainText).toString(Base64);
  }

  decrypt(cipherText: string) {
    return Base64.parse(cipherText).toString(UTF8);
  }
}

// Define a singleton class for MD5 Hashing
class MD5Hashing implements Hashing {
  private static instance: MD5Hashing;

  private constructor() {}

  // Get the singleton instance
  // 获取单例实例
  public static getInstance(): MD5Hashing {
    if (!MD5Hashing.instance) {
      MD5Hashing.instance = new MD5Hashing();
    }
    return MD5Hashing.instance;
  }

  hash(plainText: string) {
    return MD5(plainText).toString();
  }
}

// Define a singleton class for SHA256 Hashing
class SHA256Hashing implements Hashing {
  private static instance: SHA256Hashing;

  private constructor() {}

  // Get the singleton instance
  // 获取单例实例
  public static getInstance(): SHA256Hashing {
    if (!SHA256Hashing.instance) {
      SHA256Hashing.instance = new SHA256Hashing();
    }
    return SHA256Hashing.instance;
  }

  hash(plainText: string) {
    return SHA256(plainText).toString();
  }
}

// Define a singleton class for SHA512 Hashing
class SHA512Hashing implements Hashing {
  private static instance: SHA512Hashing;

  private constructor() {}

  // Get the singleton instance
  // 获取单例实例
  public static getInstance(): SHA256Hashing {
    if (!SHA512Hashing.instance) {
      SHA512Hashing.instance = new SHA512Hashing();
    }
    return SHA512Hashing.instance;
  }

  hash(plainText: string) {
    return SHA512(plainText).toString();
  }
}

export interface Crypto extends Encryption {
  isErr(): boolean;
}

export interface Signature {
  sign(plainText: string): string | false;

  verify(str: string, signature: string): boolean;
}

export interface AesOptions extends EncryptionParams {
  mode?: any;
}

export interface RsaOptions {
  key: string;
  digestMethod?: (str: string) => string;
  digestName?: string;
  options?: IJSEncryptOptions;
}

class AesCrypto implements Crypto {
  private readonly key;
  private readonly iv;
  private readonly mode;

  constructor({ key, iv, mode }: AesOptions) {
    this.key = parse(key);
    this.iv = parse(iv);
    this.mode = mode;
  }

  get getOptions() {
    const opt = {
      padding: pkcs7,
      iv: this.iv,
    } as { [key: string]: any };

    if (this.mode !== undefined && !isEmpty(this.mode)) {
      opt.mode = this.mode;
    }
    return opt;
  }

  encrypt(plainText: string) {
    return aesEncrypt(plainText, this.key, this.getOptions).toString();
  }

  decrypt(cipherText: string) {
    return aesDecrypt(cipherText, this.key, this.getOptions).toString(UTF8);
  }

  isErr(): boolean {
    return false;
  }
}

class RsaEncryption implements Encryption {
  private readonly key: string;
  private readonly options: IJSEncryptOptions;
  private err: boolean = false;

  constructor({ key, options }: RsaOptions) {
    this.key = key;
    this.options = options || ({} as IJSEncryptOptions);
  }

  encrypt(plainText: string) {
    // 重置err
    this.err = false;

    const rsa = new JSEncrypt(this.options);
    rsa.setKey(this.key);
    const res = rsa.encrypt(plainText);
    if (typeof res === 'boolean') {
      return '';
    }
    return res;
  }

  decrypt(cipherText: string) {
    // 重置err
    this.err = false;

    const rsa = new JSEncrypt(this.options);
    rsa.setKey(this.key);
    const res = rsa.decrypt(cipherText);
    if (typeof res === 'boolean') {
      return '';
    }
    return res;
  }

  isErr(): boolean {
    return this.err;
  }
}

class RsaSignature implements Signature {
  private readonly key: string;
  private readonly digestMethod: (str: string) => string;
  private readonly digestName: string;
  private readonly options: IJSEncryptOptions;

  constructor({ key, digestMethod, digestName, options }: RsaOptions) {
    this.key = key;
    this.digestMethod =
      digestMethod ||
      function (str) {
        return SHA256(str).toString();
      };

    this.digestName = digestName || 'sha256';
    this.options = options || ({} as IJSEncryptOptions);
  }

  sign(str: string) {
    const rsa = new JSEncrypt(this.options);
    rsa.setKey(this.key);
    return rsa.sign(str, this.digestMethod, this.digestName);
  }

  verify(str: string, signature: string) {
    const rsa = new JSEncrypt(this.options);
    rsa.setKey(this.key);
    return rsa.verify(str, signature, this.digestMethod);
  }
}

export class EncryptionFactory {
  public static createAesEncryption(params: EncryptionParams): Encryption {
    return new AesEncryption(params);
  }

  public static createAesCrypto(params: AesOptions): Crypto {
    return new AesCrypto(params);
  }

  // 公钥加密，私钥解密
  public static createRsaEncryption(params: RsaOptions): Crypto {
    return new RsaEncryption(params);
  }

  public static createBase64Encryption(): Encryption {
    return Base64Encryption.getInstance();
  }
}

export class SignatureFactory {
  // 私钥签名，公钥验证签名
  public static createRsaSignature(params: RsaOptions): Signature {
    return new RsaSignature(params);
  }
}

export class HashingFactory {
  public static createMD5Hashing(): Hashing {
    return MD5Hashing.getInstance();
  }

  public static createSHA256Hashing(): Hashing {
    return SHA256Hashing.getInstance();
  }

  public static createSHA512Hashing(): Hashing {
    return SHA512Hashing.getInstance();
  }
}
