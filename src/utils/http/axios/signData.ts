/**
 * 对响应和请求的`敏感数据`进行签名和验证签名
 *
 * 加密解密的参数放在header['X-Cipher']中：
 * 1. 整体加密解密：`X-Cipher`值等于cipher，加密解密ciphertext参数或body数据；
 * 2. 细分加密解密：`X-Cipher`值不等于cipher，原始类型是一个数组，进行了json编码和base64编码；
 *
 * 加密解密的参数只能是请求或响应的`首层数据`
 * 空数据[0、''、null、空数组、空对象]不参与加密解密
 * Array或者Object类型的数据要标记`json:`标签
 */

import { HashingFactory, Signature, SignatureFactory } from '@/utils/cipher';
import { aesCipher, rsaCipher } from '@/settings/encryptionSetting';
import { SignatureTypeMode } from '#/axios';

export class SignData {
  private signature: Signature;

  constructor(signature: Signature) {
    this.signature = signature;
  }

  getSignStr(params: Recordable, signParams: string[], requestId: string, appId: string) {
    // 按ASCII编码顺序排序
    signParams.sort();
    let str = '';
    for (const param of signParams) {
      // 过滤不存在或空数据
      if (undefined === params[param] || '' === params[param] || null === params[param]) {
        continue;
      }

      str += param + '=' + params[param] + '&';
    }
    return str + 'key=' + HashingFactory.createMD5Hashing().hash(appId + '-' + requestId);
  }

  /**
   *  请求参数签名
   * @constructor
   * @param str
   */
  sign(str: string) {
    return this.signature.sign(str);
  }

  /**
   * 响应参数验证签名
   * @param str
   * @param sign
   */
  verify(str: string, sign: string) {
    return this.signature.verify(str, sign);
  }
}

/**
 * 获取签名、验签方式
 * @param signatureType M: MD5签名、验签；A: AES签名、验签；R: RSA签名、验签
 * @param isVerify true 验证签名， false 签名
 */
export function getSignature(signatureType: SignatureTypeMode, isVerify: boolean) {
  if (signatureType === 'M') {
    return SignatureFactory.createMD5Signature();
  } else if (signatureType === 'A') {
    return SignatureFactory.createAesSignature(aesCipher);
  } else if (signatureType === 'R') {
    return SignatureFactory.createRsaSignature({
      key: isVerify ? rsaCipher.publicKeyServer : rsaCipher.privateKey, // 公钥验签，私钥签名
      options: {
        // log: true,
      },
    });
  } else {
    console.error('系统异常：不支持的签名方式！', signatureType);
    // continue;
    throw new Error('系统异常：不支持的签名方式！');
  }
}
