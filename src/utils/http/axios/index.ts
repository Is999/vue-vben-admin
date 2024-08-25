// axios配置  可自行根据项目进行更改，只需更改该文件即可，其他文件可以不动
// The axios configuration can be changed according to the project, just change the file, other files can be left unchanged

import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';
import { clone } from 'lodash-es';
import type { RequestOptions, Result } from '#/axios';
import type { AxiosTransform, CreateAxiosOptions } from './axiosTransform';
import { VAxios } from './Axios';
import { checkStatus } from './checkStatus';
import { useGlobSetting } from '@/hooks/setting';
import { useMessage } from '@/hooks/web/useMessage';
import { RequestEnum, ResultEnum, ContentTypeEnum } from '@/enums/httpEnum';
import { isString, isUndefined, isNull, isEmpty } from '@/utils/is';
import { getToken } from '@/utils/auth';
import { setObjToUrlParams, deepMerge } from '@/utils';
import { useErrorLogStoreWithOut } from '@/store/modules/errorLog';
import { useI18n } from '@/hooks/web/useI18n';
import { joinTimestamp, formatRequestDate } from './helper';
import { useUserStoreWithOut } from '@/store/modules/user';
import { AxiosRetry } from './axiosRetry';
import { CipherData, getCrypto } from './cipherData';
import { buildUUID } from '@/utils/uuid';
import { useLocaleStoreWithOut } from '@/store/modules/locale';
import { trimParam } from './trimParam';
import { EncryptionFactory } from '@/utils/cipher';
import { getSignature, SignData } from './signData';
import { MfaInfo } from '#/store';
import { useMfaStore } from '@/store/modules/mfa';

const globSetting = useGlobSetting();
const urlPrefix = globSetting.urlPrefix;
const { createMessage, createErrorModal, createSuccessModal } = useMessage();

/**
 * @description: 数据处理，方便区分多种处理方式
 */
const transform: AxiosTransform = {
  /**
   * @description: 处理响应数据。如果数据不是预期格式，可直接抛出错误
   */
  transformResponseHook: (res: AxiosResponse<Result>, options: RequestOptions) => {
    // console.log('transformResponseHook', res, options);
    const { isTransformResponse, isReturnNativeResponse } = options;

    // 是否返回原生响应头 比如：需要获取响应头时使用该属性
    if (isReturnNativeResponse) {
      return res;
    }

    const { signParams, cryptoType, signatureType } = options;

    // 响应的数据先解密再验证签名
    // 返回数据解密
    const cipher = res.headers['x-cipher'];
    if (undefined !== cipher) {
      const xCryptoType = res.headers['x-crypto'] || cryptoType;
      const cipherData = new CipherData(getCrypto(xCryptoType, false));
      res.data = cipherData.responseDecryptData(res.data, cipher);
    }

    // 验证签名
    if (undefined !== signParams && undefined !== signParams.response) {
      // console.log('@@@signParams-response', signParams.response);
      // 判断响应数据
      const { data = undefined } = res;
      if (undefined === data) {
        const { t } = useI18n();
        throw new Error(t('sys.api.apiRequestFailed'));
      }

      //  这里 code，result，message为 后台统一的字段，需要在 types.ts内修改为项目自己的接口返回格式
      const { success, data: result } = data;
      if (success) {
        const { sign } = result;
        if (undefined !== sign) {
          const xSignatureType = res.headers['x-signature'] || signatureType;
          const signData = new SignData(getSignature(xSignatureType, true));

          let requestId = res.headers['X-Request-Id'];
          if (undefined === requestId) {
            requestId = res.config.headers['X-Request-Id'];
          }

          // 将所有参数合并
          const appId = import.meta.env.VITE_APP_ID;
          const signStr = signData.getSignStr(result, signParams.response, requestId, appId);
          const ok = signData.verify(signStr, result.sign);
          if (!ok) {
            console.error(
              '响应数据验证签名失败, data: ',
              result,
              ' signParams: ',
              signParams.response,
              ' requestId: ',
              requestId,
              ' signStr: ',
              signStr,
              ' URL: ',
              res.request?.responseURL,
            );
            throw new Error('【100100】系统异常：数据验证签名失败！');
          } else {
            // console.log('响应数据验证签名成功: ', res.request?.responseURL);
          }
        } else {
          console.error('响应数据sign不存在, data: ', result, ' URL: ', res.request?.responseURL);
          throw new Error('【100101】系统异常：数据sign不存在！');
        }
      }
    }

    // 不进行任何处理，直接返回
    // 用于页面代码可能需要直接获取code，data，message这些信息时开启
    if (!isTransformResponse) {
      return res.data;
    }

    const { t } = useI18n(); // 加载多语种

    // 对返回数据的处理
    const { data = undefined } = res;
    if (undefined === data) {
      // return '[HTTP] Request has no return value';
      throw new Error(t('sys.api.apiRequestFailed'));
    }

    //  这里 code，result，message为 后台统一的字段，需要在 types.ts内修改为项目自己的接口返回格式
    const { success, code, message, data: result } = data;

    // 判断响应数据是否成功
    // 成功数据处理
    if (success) {
      let successMsg = message;

      if (isNull(successMsg) || isUndefined(successMsg) || isEmpty(successMsg)) {
        successMsg = t(`sys.api.operationSuccess`);
      }

      // 判断是否直接弹框提示消息
      if (options.successMessageMode === 'modal') {
        createSuccessModal({ title: t('sys.api.successTip'), content: successMsg });
      } else if (options.successMessageMode === 'message') {
        createMessage.success(successMsg).then();
      }

      // 返回data数据
      return result;
    }

    // 错误数据处理
    // 在此处根据自己项目的实际情况对不同的code执行不同的操作
    // 如果不希望中断当前请求，请return数据，否则直接抛出异常即可
    let timeoutMsg = '';
    switch (code) {
      case ResultEnum.TIMEOUT: // 超时处理
        timeoutMsg = t('sys.api.timeoutMessage');
        const userStore = useUserStoreWithOut();
        userStore.setToken(undefined);
        // 被动登出，带redirect地址
        userStore.logout(false).then();
        break;
      case ResultEnum.CHECK_MFA_CODE: // 校验MFA设备验证码
        const mfaInfo: MfaInfo = useMfaStore().getMfaInfo;
        mfaInfo.scenarios = 0;
        mfaInfo.isTwoStepVerification = true;
        mfaInfo.isOff = false;
        useMfaStore().setMfaInfo(mfaInfo);
        break;
      default:
        if (message) {
          timeoutMsg = '【' + code + '】' + message;
        }
    }

    // errorMessageMode='modal'的时候会显示modal错误弹窗，而不是消息提示，用于一些比较重要的错误
    // errorMessageMode='none' 一般是调用时明确表示不希望自动弹出错误提示
    if (options.errorMessageMode === 'modal') {
      createErrorModal({ title: t('sys.api.errorTip'), content: timeoutMsg });
    } else if (options.errorMessageMode === 'message') {
      createMessage.error(timeoutMsg).then();
    }

    throw new Error(timeoutMsg || t('sys.api.apiRequestFailed'));
  },

  // 请求之前处理config
  beforeRequestHook: (config: AxiosRequestConfig, options: RequestOptions) => {
    // console.log('@@@-beforeRequestHook', config, options);
    const {
      apiUrl,
      joinPrefix,
      urlPrefix,
      joinParamsToUrl,
      formatDate,
      joinTime = true,
      trimEmpty = true,
      cryptoType = 'A',
      cipherParams = '',
      signatureType = 'R',
      signParams,
    } = options;

    // url 处理
    if (joinPrefix) {
      config.url = `${urlPrefix}${config.url}`;
    }
    if (apiUrl && isString(apiUrl)) {
      config.url = `${apiUrl}${config.url}`;
    }

    // headers 处理
    const headers = new AxiosHeaders();
    const base64 = EncryptionFactory.createBase64Encryption();
    // APP Key
    const appId = import.meta.env.VITE_APP_ID;
    headers.set('X-App-Id', base64.encrypt(appId));

    // 请求的唯一id
    const requestId = buildUUID();
    headers.set('X-Request-Id', requestId);

    // 加密方式
    headers.set('X-Crypto', cryptoType);
    // 加密字段写入header
    if (cipherParams?.length > 0) {
      headers.set(
        'X-Cipher',
        isString(cipherParams) ? 'cipher' : base64.encrypt(JSON.stringify(cipherParams)),
      );
    }
    // 签名方式
    headers.set('X-Signature', signatureType);
    // 语言
    const lang = useLocaleStoreWithOut().getLocale;
    headers.set('X-Language', lang == 'en' ? lang : 'zh');

    if (undefined === config.headers) {
      config.headers = headers;
    } else {
      config.headers = Object.assign(config.headers, headers);
    }

    // 数据处理
    const processing = function (datas: Recordable) {
      // 去除空格
      trimEmpty && trimParam(datas);

      // 时间处理
      formatDate && formatRequestDate(datas);
    };

    const { params = {} } = config;
    const paramsIsStr = isString(params);
    if (paramsIsStr) {
      // 兼容restful风格
      config.url = config.url + params;

      // 重写params
      config.params = {};
    }

    if (config.method?.toUpperCase() === RequestEnum.GET) {
      // 给 get 请求加上时间戳参数，避免从缓存中拿数据。
      config.params = Object.assign(config.params || {}, joinTimestamp(joinTime, false));
    }

    if (!isEmpty(config.params)) {
      processing(config.params);
    }

    let hasData = false;
    if (
      Reflect.has(config, 'data') &&
      config.data &&
      (Object.keys(config.data).length > 0 || config.data instanceof FormData)
    ) {
      hasData = true;
      processing(config.data);
    }

    // 请求的数据先签名再加密
    // 数据签名
    if (undefined !== signParams && undefined !== signParams.request) {
      const signData = new SignData(getSignature(signatureType, false));

      // 将所有参数合并
      let all = Object.assign({}, config.params);
      if (hasData) {
        all = Object.assign(all, config.data);
      }
      const signStr = signData.getSignStr(all, signParams.request, requestId, appId);
      const sign = signData.sign(signStr);
      if (false === sign) {
        console.error(
          '请求数据签名失败, data: ',
          all,
          ' signParams: ',
          signParams.request,
          ' requestId: ',
          requestId,
          ' signStr: ',
          signStr,
          ' URL: ',
          config.url,
        );
        throw new Error('【100001】系统异常：数据签名失败！');
      } else {
        config.params = Object.assign(config.params || {}, { sign: sign });
        // console.log('请求数据数据签名成功!');
      }
    }

    // 数据加密
    if (cipherParams.length > 0) {
      const cipherData = new CipherData(getCrypto(cryptoType, true));
      cipherData.requestEncryptData(config, cipherParams);
      // console.log('请求数据数据加密成功!');
    }

    // url 处理
    if (paramsIsStr) {
      // 兼容restful风格, GET 请求加上params参数时间
      if (config.method?.toUpperCase() === RequestEnum.GET) {
        config.url = setObjToUrlParams(config.url as string, config.params);
      }
      config.params = undefined; // 重置
    } else {
      if (!hasData && config.method?.toUpperCase() !== RequestEnum.GET) {
        // 非GET请求如果没有提供data，则将params视为data
        config.data = config.params;
        config.params = undefined;
      }

      if (joinParamsToUrl) {
        let all = Object({});
        if (config.params) {
          all = Object.assign(all, config.params);
        }

        if (config.data) {
          all = Object.assign(all, config.data);
        }

        config.url = setObjToUrlParams(config.url as string, all);
      }
    }

    return config;
  },

  /**
   * @description: 请求拦截器处理
   */
  requestInterceptors: (config: InternalAxiosRequestConfig, options: CreateAxiosOptions) => {
    // console.log('@@@-requestInterceptors', config, options);
    const { withToken = true } =
      ((config as Recordable).requestOptions as RequestOptions) || options.requestOptions;

    const { headers } = config;

    // 请求之前处理config
    if (withToken) {
      const token = getToken();
      if (token) {
        // jwt token
        const authorization = options.authenticationScheme
          ? options.authenticationScheme + ' ' + token
          : token;
        headers.set('Authorization', authorization as string);
      }
    }

    return config;
  },

  /**
   * @description: 响应拦截器处理
   */
  responseInterceptors: (res: AxiosResponse<any>) => {
    // console.log('responseInterceptors', res);

    return res;
  },

  /**
   * @description: 响应错误处理
   */
  responseInterceptorsCatch: (axiosInstance: AxiosInstance, error: any) => {
    // console.log('responseInterceptorsCatch', axiosInstance, error);

    const {
      response = {} as AxiosResponse,
      code = '',
      message = '',
      config = {} as InternalAxiosRequestConfig,
    } = (error || {}) as AxiosError;

    const { errorMessageMode = 'none', statusCodes = [200] } = ((config as Recordable)
      .requestOptions || {}) as RequestOptions;

    // 特殊状态码状态码处理
    if (undefined !== response.status && statusCodes.includes(response.status)) {
      return Promise.resolve(response);
    }

    const errorLogStore = useErrorLogStoreWithOut();
    errorLogStore.addAjaxErrorInfo(error);

    if (axios.isCancel(error)) {
      console.log('axios is cancel');
      return Promise.reject(error);
    }

    const err: string = error?.toString?.() ?? '';
    let errMessage = '';

    const { t } = useI18n();
    try {
      if (code === 'ECONNABORTED' && message.indexOf('timeout') !== -1) {
        errMessage = t('sys.api.apiTimeoutMessage');
      }

      if (err?.includes('Network Error')) {
        errMessage = t('sys.api.networkExceptionMsg');
      }

      if (errMessage) {
        if (errorMessageMode === 'modal') {
          createErrorModal({ title: t('sys.api.errorTip'), content: errMessage });
        } else if (errorMessageMode === 'message') {
          createMessage.error(errMessage).then();
        }
        return Promise.reject(error);
      }
    } catch (error) {
      throw new Error(error as unknown as string);
    }

    const { code: respCode = 0, message: respMsg = '' } = (response.data || {}) as Result;

    if (0 !== respCode) {
      errMessage = '【' + respCode + '】' + respMsg;
    } else {
      errMessage = respMsg;
    }

    checkStatus(response.status as number, errMessage, errorMessageMode);

    // 添加自动重试机制 保险起见 只针对GET请求
    const retryRequest = new AxiosRetry();
    const { isOpenRetry } = (config as Recordable)?.requestOptions?.retryRequest || {};
    config.method?.toUpperCase() === RequestEnum.GET &&
      isOpenRetry &&
      response.status !== 401 &&
      // @ts-ignore
      retryRequest.retry(axiosInstance, error);

    return Promise.reject(error);
  },
};

function createAxios(opt?: Partial<CreateAxiosOptions>) {
  return new VAxios(
    // 深度合并
    deepMerge(
      {
        // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#authentication_schemes
        // authentication schemes，e.g: Bearer
        // authenticationScheme: 'Bearer',
        authenticationScheme: '',
        timeout: 10 * 1000,
        // 基础接口地址
        // baseURL: globSetting.apiUrl,

        headers: { 'Content-Type': ContentTypeEnum.JSON },
        // 如果是form-data格式
        // headers: { 'Content-Type': ContentTypeEnum.FORM_URLENCODED },
        // 数据处理方式
        transform: clone(transform),
        // 配置项，下面的选项都可以在独立的接口请求中覆盖
        requestOptions: {
          // 默认将prefix 添加到url
          joinPrefix: true,
          // 是否返回原生响应头 比如：需要获取响应头时使用该属性
          isReturnNativeResponse: false,
          // 需要对返回数据进行处理
          isTransformResponse: true,
          // post请求的时候添加参数到url
          joinParamsToUrl: false,
          // 格式化提交参数时间
          formatDate: true,
          // 消息提示类型
          errorMessageMode: 'message',
          // 接口地址
          apiUrl: globSetting.apiUrl,
          // 接口拼接地址
          urlPrefix: urlPrefix,
          //  是否加入时间戳
          joinTime: true,
          // 忽略重复请求
          ignoreCancelToken: true,
          // 是否携带token
          withToken: true,
          retryRequest: {
            isOpenRetry: true,
            count: 5,
            waitTime: 100,
          },
        },
      },
      opt || {},
    ),
  );
}

export const defHttp = createAxios();

// other api url
export default createAxios;
