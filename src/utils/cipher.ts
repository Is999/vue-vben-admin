import { encrypt, decrypt } from 'crypto-js/aes';
import UTF8, { parse } from 'crypto-js/enc-utf8';
import pkcs7 from 'crypto-js/pad-pkcs7';
// import ECB from 'crypto-js/mode-ecb';
import md5 from 'crypto-js/md5';
import Base64 from 'crypto-js/enc-base64';
import JSEncrypt from 'jsencrypt';
import sha256 from 'crypto-js/sha256';

export interface EncryptionParams {
  key: string;
  iv: string;
}

export class AesEncryption {
  private key;
  private iv;

  constructor(opt: Partial<EncryptionParams> = {}) {
    const { key, iv } = opt;
    if (key) {
      this.key = parse(key);
    }
    if (iv) {
      this.iv = parse(iv);
    }
  }

  get getOptions() {
    return {
      // mode: ECB, 默认使用CBC模式
      padding: pkcs7,
      iv: this.iv,
    };
  }

  encryptByAES(cipherText: string) {
    return encrypt(cipherText, this.key, this.getOptions).toString();
  }

  decryptByAES(cipherText: string) {
    return decrypt(cipherText, this.key, this.getOptions).toString(UTF8);
  }
}

export function encryptByBase64(cipherText: string) {
  return UTF8.parse(cipherText).toString(Base64);
}

export function decodeByBase64(cipherText: string) {
  return Base64.parse(cipherText).toString(UTF8);
}

export function encryptByMd5(password: string) {
  return md5(password).toString();
}

export function signData(data: string, privateKey: string) {
  const rsa = new JSEncrypt();
  rsa.setPrivateKey(privateKey); // 设置私钥
  return rsa.sign(data, sha256, 'sha256'); // 使用SHA-256算法进行签名
}

export function verifySignature(data: string, signature: string, publicKey: string): boolean {
  const rsa = new JSEncrypt();
  rsa.setPublicKey(publicKey); // 设置公钥
  return rsa.verify(data, signature, sha256); // 使用SHA-256算法进行验证签名
}

export function generateKeyPair() {
  const rsa = new JSEncrypt();
  rsa.getKey(); // 生成RSA密钥对
  return {
    publicKey: rsa.getPublicKey(), // 获取公钥
    privateKey: rsa.getPrivateKey(), // 获取私钥
  };
}
export function encryptByRSA(data: string, pubKey: string) {
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(pubKey);
  return encrypt.encrypt(data);
}

export function decryptByAES(encrypted: string, privkey: string) {
  const decrypt = new JSEncrypt();
  decrypt.setPrivateKey(privkey);
  return decrypt.decrypt(encrypted);
}
