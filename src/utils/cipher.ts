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
import { b64tohex, hex2b64 } from 'jsencrypt/lib/lib/jsbn/base64';

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

export interface Signature {
  sign(plainText: string): string | false;

  verify(str: string, signature: string): boolean;
}

export interface AesOptions extends EncryptionParams {
  mode?: any;
}

export interface RsaOptions {
  key: string; // 公钥验签和加密, 私钥验签和解密
  digestMethod?: (str: string) => string;
  digestName?: string;
  options?: IJSEncryptOptions;
}

class Aes implements Encryption, Signature {
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

  sign(str: string) {
    return this.encrypt(SHA256(str).toString());
  }

  verify(str: string, signature: string) {
    return SHA256(str).toString() == this.decrypt(signature);
  }
}

class Rsa implements Encryption, Signature {
  private readonly digestMethod: (str: string) => string;
  private readonly digestName: string;
  private readonly rsa: JSEncrypt;

  constructor({ key, digestMethod, digestName, options }: RsaOptions) {
    const encrypt = options ? new JSEncrypt(options) : new JSEncrypt();
    encrypt.setKey(key);

    this.digestMethod =
      digestMethod ||
      function (str) {
        return SHA256(str).toString();
      };

    this.digestName = digestName || 'sha256';
    this.rsa = encrypt;
  }

  encrypt(plainText: string) {
    try {
      const keyObj = this.rsa.getKey();
      // 获取公钥长度（以位为单位）并计算最大加密长度（以字节为单位）
      const keyLengthInBits = keyObj['n'].bitLength();
      const keyLengthInBytes = keyLengthInBits / 8; // 等同于 (keyLengthInBits + 7) >> 3
      const chunkSize = keyLengthInBytes - 11;

      let encrypted = '';
      const encoder = new TextEncoder();

      let n = 0;
      let chunk = '';
      for (let i = 0; i < plainText.length; i++) {
        const word = plainText.slice(i, i + 1);
        const bytes = encoder.encode(word); // 转字节

        // 计算字节长度
        if (n + bytes.length > chunkSize) {
          encrypted += keyObj.encrypt(chunk); // 加密

          n = bytes.length; // 重置 n
          chunk = word; // 重置 chunk
        } else {
          n += bytes.length; // 计算总长度
          chunk += word; // 拼接字符
        }

        // 最后一次加密
        if (plainText.length - 1 === i && chunk.length > 0) {
          encrypted += keyObj.encrypt(chunk); // 加密
        }
      }
      return hex2b64(encrypted);
    } catch (ex) {
      console.error(ex);
      return '';
    }
  }

  decrypt(cipherText: string) {
    try {
      const keyObj = this.rsa.getKey();
      const chunkSize = keyObj['n'].bitLength() / 4;

      let decrypted = '';
      const plainText = b64tohex(cipherText);
      for (let i = 0; i < plainText.length; i += chunkSize) {
        const chunk = plainText.slice(i, i + chunkSize);
        const deChunk = keyObj.decrypt(chunk);
        decrypted += deChunk;
      }
      return decrypted;
    } catch (ex) {
      console.error(ex);
      return '';
    }
  }

  sign(str: string) {
    return this.rsa.sign(str, this.digestMethod, this.digestName);
  }

  verify(str: string, signature: string) {
    return this.rsa.verify(str, signature, this.digestMethod);
  }
}

class MD5Signature implements Signature {
  hash(plainText: string) {
    return MD5(plainText).toString();
  }

  sign(str: string) {
    return this.hash(str);
  }

  verify(str: string, signature: string) {
    return this.hash(str) == signature;
  }
}

// 加密(编码)，解密(解码)
export class EncryptionFactory {
  // AES 加密、解密
  public static createAesEncryption(params: EncryptionParams): Encryption {
    return new AesEncryption(params);
  }

  // AES 加密、解密
  public static createAesCrypto(params: AesOptions): Encryption {
    return new Aes(params);
  }

  // RSA 公钥加密，私钥解密
  public static createRsaCrypto(params: RsaOptions): Encryption {
    return new Rsa(params);
  }

  // Base64 编码，解码
  public static createBase64Encryption(): Encryption {
    return Base64Encryption.getInstance();
  }
}

// 签名，验签
export class SignatureFactory {
  // RSA 私钥签名，公钥验证签名
  public static createRsaSignature(params: RsaOptions): Signature {
    return new Rsa(params);
  }

  // AES 签名，验签
  public static createAesSignature(params: AesOptions): Signature {
    return new Aes(params);
  }

  // Md5 签名，验签
  public static createMD5Signature(): Signature {
    return new MD5Signature();
  }
}

// Hash
export class HashingFactory {
  // MD5
  public static createMD5Hashing(): Hashing {
    return MD5Hashing.getInstance();
  }

  // SHA256
  public static createSHA256Hashing(): Hashing {
    return SHA256Hashing.getInstance();
  }

  // SHA512
  public static createSHA512Hashing(): Hashing {
    return SHA512Hashing.getInstance();
  }
}
