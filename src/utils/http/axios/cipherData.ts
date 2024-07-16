/**
 * 对响应和请求的`敏感数据`进行加密解密
 *
 * 加密解密的参数放在header['X-Cipher']中：
 * 1. 整体加密解密：`X-Cipher`值等于cipher，加密解密ciphertext参数或body数据；
 * 2. 细分加密解密：`X-Cipher`值不等于cipher，原始类型是一个数组，进行了json编码和base64编码；
 *
 * 加密解密的参数只能是请求或响应的`首层数据`
 * 空数据[0、''、null、空数组、空对象]不参与加密解密
 * Array或者Object类型的数据要标记`json:`标签
 */

import { Encryption, EncryptionFactory } from '@/utils/cipher';
import { isEmpty, isObject, isArray, isUndefined, isString } from '@/utils/is';
import type { AxiosRequestConfig } from 'axios';
import { toLower } from 'lodash-es';
import { RequestEnum } from '@/enums/httpEnum';
import { CryptoTypeMode, Result } from '#/axios';
import { aesCipher, rsaCipher } from '@/settings/encryptionSetting';

export class CipherData {
  private cipher: Encryption;

  constructor(cipher: Encryption) {
    this.cipher = cipher;
  }

  encryptData(params: any, cipherParams: string[]) {
    // 判断数据格式
    if (!(isArray(params) || isObject(params))) {
      return params;
    }

    // 判断数据长度
    const length = Array.isArray(params) ? params.length : Object.keys(params).length;
    if (length === 0) {
      return params;
    }

    for (let param of cipherParams) {
      // 参数是否需要json处理
      const isJson = param.startsWith('json:');

      // 去掉json标签
      if (isJson) {
        param = param.replace(/^[json:]+/g, '');
      }

      // 判断数据是否存在该参数
      let originalData = params[param];
      if (undefined !== originalData && originalData !== '') {
        // 对json数据处理进行编码
        if (isJson) {
          // 判断数据类型，Array或者Object类型的数据才需要json编码
          if (!(isArray(params[param]) || isObject(params[param]))) {
            console.error(
              param + '参数，数据类型不是Array或者Object类型，无须Json编码！',
              ' isJson: ',
              isJson,
              ' originalData: ',
              originalData,
            );

            // continue;
            throw new Error('【100100】系统异常：加密数据类型格式错误！');
          }
          originalData = JSON.stringify(params[param]);
        }

        // 数据加密
        const encryptData = this.cipher.encrypt(originalData);

        // 验证加密是否有错误
        if (encryptData === '') {
          console.error(param + '参数，数据加密失败！', isJson, originalData);
          // continue;
          throw new Error('【100100】系统异常：' + param + ' 参数，数据加密失败！');
        }

        // 重新赋值
        params[param] = encryptData;
      }
    }

    return params;
  }

  decryptData(params: any, cipherParams: string[]) {
    // 判断数据格式
    if (!(isArray(params) || isObject(params))) {
      return params;
    }

    // 判断数据长度
    const length = Array.isArray(params) ? params.length : Object.keys(params).length;
    if (length === 0) {
      return params;
    }

    for (let param of cipherParams) {
      // 参数是否需要json处理
      const isJson = param.startsWith('json:');

      // 去掉json标签
      if (isJson) {
        param = param.replace(/^[json:]+/g, '');
      }

      // 判断数据是否存在该参数
      const originalData = params[param];
      if (undefined !== originalData && isString(originalData) && originalData.length > 0) {
        // 解密
        let decryptedData = this.cipher.decrypt(originalData);

        // 验证解密是否有错误
        if (decryptedData === '') {
          console.error(param + '参数，数据解密失败！', isJson, originalData);
          // // 解密失败跳过后面步骤
          // continue;
          throw new Error('【100100】系统异常：数据解密失败!');
        }

        // 对json数据处理进行解码
        if (isJson && '' !== decryptedData) {
          decryptedData = JSON.parse(decryptedData);
          // 判断数据类型，Array或者Object类型的数据才需要json编码
          if (!(isArray(decryptedData) || isObject(decryptedData))) {
            console.error(
              param + '参数数据类型不是Array或者Object类型，无须Json解码',
              isJson,
              decryptedData,
            );
          }
        }

        // 重新赋值
        params[param] = decryptedData;
      }
    }

    return params;
  }

  /**
   *  请求参数加密
   * @constructor
   * @param config
   * @param cipher
   */
  requestEncryptData(config: AxiosRequestConfig, cipher: string | string[]) {
    if (cipher.length === 0) {
      return;
    }

    // cipher is array 部分参数加密, 否则所有参数都加密
    if (isArray(cipher)) {
      // params 参加加密
      if (undefined !== config.params) {
        config.params = this.encryptData(config.params, cipher);
      }

      // data 参加加密
      if (undefined !== config.data) {
        config.data = this.encryptData(config.data, cipher);
      }
    } else if (toLower(cipher) === 'cipher') {
      // 将所有参数合并
      const all = Object.assign({}, config.params, config.data);

      // 加密数据
      const encryptedData = this.cipher.encrypt(JSON.stringify(all));

      // 验证加密是否有错误
      if (encryptedData === '') {
        console.error('请求数据加密失败！', all, JSON.stringify(all));
        throw new Error('请求数据加密失败！');
      }

      // post 请求加密数据放在data, 其它请求加密数据放在params
      if (config.method?.toUpperCase() === RequestEnum.POST) {
        config.data = { ciphertext: encryptedData };
        config.params = undefined;
      } else {
        config.data = { ciphertext: encryptedData };
        config.params = config.data;
      }
    }
  }

  /**
   * 响应参数解密
   * @param result
   * @param cipher
   */
  responseDecryptData(result: Result | string, cipher: string) {
    // 判断cipher
    if (cipher.length === 0) {
      return result;
    }

    // 判断响应数据
    if (isUndefined(result) || isEmpty(result)) {
      return result;
    }

    // 响应的整个body需要解密
    if (toLower(cipher) === 'cipher') {
      if (isString(result)) {
        const decryptData = this.cipher.decrypt(result);

        // 验证解密是否有错误
        if (decryptData === '') {
          console.error('响应数据解密失败，result: ', result, ' decryptData: ', decryptData);
          throw new Error('【100100】系统异常：数据解密失败!');
        }

        return JSON.parse(decryptData) || decryptData;
      } else {
        console.error('响应待解密数据格式错误，result: ', result, ' cipher: ', cipher);
        throw new Error('【100101】系统异常：待解密数据格式错误!');
      }
    }

    if (isObject(result)) {
      //  判断返回的数据是成功还是失败数据,数据类型是否符合,数据是否为空
      const { success, data } = result;
      if (!success || !(isArray(data) || isObject(data)) || isEmpty(data)) {
        return result;
      }

      // 指定的参数需要解密
      const cipherParams = JSON.parse(
        EncryptionFactory.createBase64Encryption().decrypt(cipher),
      ) as Array<string>;

      result.data = this.decryptData(data, cipherParams);

      return result;
    }

    return result;
  }
}

/**
 * 获取加密、解密方式
 * @param cryptoType A: AES加密、解密；R: RSA加密、解密
 * @param isEncrypt true 加密， false 解密
 */
export function getCrypto(cryptoType: CryptoTypeMode, isEncrypt: boolean) {
  if (cryptoType === 'R') {
    return EncryptionFactory.createRsaCrypto({
      key: isEncrypt ? rsaCipher.publicKeyServer : rsaCipher.privateKey, // 公钥加密，私钥解密
      options: {
        // log: true,
      },
    });
  } else if (cryptoType === 'A') {
    return EncryptionFactory.createAesCrypto(aesCipher);
  } else {
    console.error('系统异常：不支持的加密方式！', cryptoType);
    // continue;
    throw new Error('系统异常：不支持的加密方式！');
  }
}
