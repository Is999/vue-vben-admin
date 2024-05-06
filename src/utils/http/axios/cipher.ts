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

import { Encryption, EncryptionFactory, EncryptionParams } from '@/utils/cipher';
import { isEmpty, isObject, isArray } from '@/utils/is';
import type { AxiosResponse, AxiosRequestConfig } from 'axios';
import { toLower } from 'lodash-es';
import { RequestEnum } from '@/enums/httpEnum';
import { RequestOptions } from '#/axios';

export class Cipher {
  private aes: Encryption;

  constructor(opt: EncryptionParams = {} as EncryptionParams) {
    this.aes = EncryptionFactory.createAesEncryption(opt);
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

    cipherParams.forEach((param) => {
      // 参数是否需要json处理
      const isJson = param.startsWith('json:');
      // 去掉json标签
      if (isJson) {
        param = param.replace(/^[json:]+/g, '');
      }
      // 判断数据是否存在该参数
      let originalData = params[param];
      if (undefined !== originalData) {
        // 对json数据处理进行编码在加密
        if (isJson) {
          // 判断数据类型，Array或者Object类型的数据才需要json编码
          if (!(isArray(params[param]) || isObject(params[param]))) {
            console.error(
              '标签参数param数据类型不是Array或者Object类型，无须Json编码',
              isJson,
              param,
            );
            throw new Error(' （◐ˍ◑）好大一个🪳, 快快消灭它');
          }
          originalData = JSON.stringify(params[param]);
        }
        params[param] = this.aes.encrypt(originalData);
      }
    });
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

    cipherParams.forEach((param) => {
      // 参数是否需要json处理
      const isJson = param.startsWith('json:');
      // 去掉json标签
      if (isJson) {
        param = param.replace(/^[json:]+/g, '');
      }
      // 判断数据是否存在该参数
      const originalData = params[param];
      if (undefined !== originalData) {
        let decryptedData = this.aes.decrypt(originalData);
        // 对json数据处理进行编码在加密
        if (isJson && '' !== decryptedData) {
          decryptedData = JSON.parse(decryptedData);
          // 判断数据类型，Array或者Object类型的数据才需要json编码
          if (!(isArray(decryptedData) || isObject(decryptedData))) {
            console.error(
              '标签参数param数据类型不是Array或者Object类型，无须Json解码',
              isJson,
              param,
            );
          }
        }
        params[param] = decryptedData;
      }
    });
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

    if (isArray(cipher)) {
      if (undefined !== config.params) {
        this.encryptData(config.params, cipher);
      }

      if (undefined !== config.data) {
        this.encryptData(config.data, cipher);
      }
    } else if (toLower(cipher) === 'cipher') {
      const all = Object.assign({}, config.params, config.data);
      const encryptedData = this.aes.encrypt(JSON.stringify(all));
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
   */
  responseDecryptData(res: AxiosResponse<any>) {
    // 判断响应数据
    const { data } = res;
    if (!data) {
      return;
    }

    // 判断响应头
    const cipher = res.headers['x-cipher'];
    if (undefined === cipher) {
      return;
    }

    // 响应的整个body需要解密
    if (toLower(cipher) === 'cipher') {
      res.data = JSON.parse(this.aes.decrypt(data)) || {};
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
