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

import { HashingFactory, Signature } from '@/utils/cipher';

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
