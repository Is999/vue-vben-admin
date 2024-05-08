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
import { isEmpty, isObject, isArray } from '@/utils/is';
import type { AxiosResponse, AxiosRequestConfig } from 'axios';
import { toLower } from 'lodash-es';
import { RequestEnum } from '@/enums/httpEnum';
import { RequestOptions } from '#/axios';

export class CipherData {
  private cipher: Encryption;

  constructor(cipher: Encryption) {
    this.cipher = cipher;
  }

  encryptData(params: any, cipherParams: string[]) {
    // 判断数据格式
    if (!(isArray(params) || isObject(params))) {
      return;
    }

    // 判断数据长度
    const length = Array.isArray(params) ? params.length : Object.keys(params).length;
    if (length === 0) {
      return;
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
      if (undefined !== originalData) {
        // 对json数据处理进行编码
        if (isJson) {
          // 判断数据类型，Array或者Object类型的数据才需要json编码
          if (!(isArray(params[param]) || isObject(params[param]))) {
            console.error(
              param + '参数，数据类型不是Array或者Object类型，无须Json编码！',
              isJson,
              originalData,
            );
            // eslint-disable-next-line no-irregular-whitespace
            //throw new Error(' （◐ˍ◑）好大一个🪳, 快快消灭它');
            continue;
          }
          originalData = JSON.stringify(params[param]);
        }

        // 数据加密
        const encryptData = this.cipher.encrypt(originalData);

        // 验证加密是否有错误
        if (this.cipher.isErr()) {
          console.error(param + '参数，数据加密失败！', isJson, originalData);
          //throw new Error(param + '参数，数据加密失败！');
          continue;
        }

        // 重新赋值
        params[param] = encryptData;
      }
    }
  }

  decryptData(params: any, cipherParams: string[]) {
    // 判断数据格式
    if (!(isArray(params) || isObject(params))) {
      return;
    }

    // 判断数据长度
    const length = Array.isArray(params) ? params.length : Object.keys(params).length;
    if (length === 0) {
      return;
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
      if (undefined !== originalData) {
        // 解密
        let decryptedData = this.cipher.decrypt(originalData);

        // 验证解密是否有错误
        if (this.cipher.isErr()) {
          console.error(param + '参数，数据解密失败！', isJson, originalData);
          // 解密失败跳过后面步骤
          continue;
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
  }

  /**
   *  请求参数加密
   * @constructor
   * @param config
   * @param options
   */
  requestEncryptData(config: AxiosRequestConfig, options: RequestOptions) {
    const cipher = options.cipherParams;
    if (!cipher || cipher.length === 0) {
      return;
    }

    // cipher is array 部分参数加密, 否则所有参数都加密
    if (isArray(cipher)) {
      // params 参加加密
      if (undefined !== config.params) {
        this.encryptData(config.params, cipher);
      }

      // data 参加加密
      if (undefined !== config.data) {
        this.encryptData(config.data, cipher);
      }
    } else if (toLower(cipher) === 'cipher') {
      // 将所有参数合并
      const all = Object.assign({}, config.params, config.data);

      // 加密数据
      const encryptedData = this.cipher.encrypt(JSON.stringify(all));

      // 验证加密是否有错误
      if (this.cipher.isErr()) {
        console.error('请求数据加密失败！', all, JSON.stringify(all));
        // throw new Error('请求数据加密失败！');
        return;
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
   * @param res
   * @param cipher
   */
  responseDecryptData(res: AxiosResponse<any>, cipher: string) {
    // 判断cipher
    if (cipher.length === 0) {
      return;
    }

    // 判断响应数据
    const { data } = res;
    if (!data) {
      return;
    }

    // 响应的整个body需要解密
    if (toLower(cipher) === 'cipher') {
      const decryptData = this.cipher.decrypt(data);

      // 验证解密是否有错误
      if (this.cipher.isErr()) {
        console.error('响应数据解密失败！', data, decryptData);
        return;
      }

      res.data = JSON.parse(decryptData) || {};
      return;
    }

    //  判断返回的数据是成功还是失败数据,数据类型是否符合,数据是否为空
    const { success, data: result } = data;
    if (!success || !(isArray(result) || isObject(result)) || isEmpty(result)) {
      return;
    }

    // 指定的参数需要解密
    const cipherParams = JSON.parse(
      EncryptionFactory.createBase64Encryption().decrypt(cipher),
    ) as Array<string>;

    this.decryptData(result, cipherParams);
  }
}
