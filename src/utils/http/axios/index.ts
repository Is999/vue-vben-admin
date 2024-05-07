// axios配置  可自行根据项目进行更改，只需更改该文件即可，其他文件可以不动
// The axios configuration can be changed according to the project, just change the file, other files can be left unchanged

import axios, { AxiosInstance, AxiosRequestHeaders, AxiosResponse } from 'axios';
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
import { AxiosRetry } from '@/utils/http/axios/axiosRetry';
import { CipherData } from '@/utils/http/axios/cipherData';
import { buildUUID } from '@/utils/uuid';
import { useLocaleStoreWithOut } from '@/store/modules/locale';
import { trimParam } from '@/utils/helper/trimParam';
import { EncryptionFactory, SignatureFactory } from '@/utils/cipher';
import { cacheCipher, rsaCipher } from '@/settings/encryptionSetting';
import { SignData } from '@/utils/http/axios/signData';

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
    const { t } = useI18n();
    const { isTransformResponse, isReturnNativeResponse } = options;
    // 是否返回原生响应头 比如：需要获取响应头时使用该属性
    if (isReturnNativeResponse) {
      return res;
    }
    // 不进行任何处理，直接返回
    // 用于页面代码可能需要直接获取code，data，message这些信息时开启
    if (!isTransformResponse) {
      return res.data;
    }
    // 错误的时候返回

    const { data } = res;
    if (!data) {
      // return '[HTTP] Request has no return value';
      throw new Error(t('sys.api.apiRequestFailed'));
    }
    //  这里 code，result，message为 后台统一的字段，需要在 types.ts内修改为项目自己的接口返回格式
    const { success, code, message, data: result } = data;
    // console.log('@@@success', success, data);
    // 这里逻辑可以根据项目进行修改
    const hasSuccess = data && Reflect.has(data, 'success') && success;
    if (hasSuccess) {
      let successMsg = message;

      if (isNull(successMsg) || isUndefined(successMsg) || isEmpty(successMsg)) {
        successMsg = t(`sys.api.operationSuccess`);
      }

      if (options.successMessageMode === 'modal') {
        createSuccessModal({ title: t('sys.api.successTip'), content: successMsg });
      } else if (options.successMessageMode === 'message') {
        createMessage.success(successMsg);
      }
      return result;
    }

    // 在此处根据自己项目的实际情况对不同的code执行不同的操作
    // 如果不希望中断当前请求，请return数据，否则直接抛出异常即可
    let timeoutMsg = '';
    switch (code) {
      case ResultEnum.TIMEOUT:
        timeoutMsg = t('sys.api.timeoutMessage');
        const userStore = useUserStoreWithOut();
        userStore.setToken(undefined);
        // 被动登出，带redirect地址
        userStore.logout(false);
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
      createMessage.error(timeoutMsg);
    }

    throw new Error(timeoutMsg || t('sys.api.apiRequestFailed'));
  },

  // 请求之前处理config
  beforeRequestHook: (config, options) => {
    const { apiUrl, joinPrefix, urlPrefix } = options;
    // console.log('@@@@beforeRequestHook', config, options);
    if (joinPrefix) {
      config.url = `${urlPrefix}${config.url}`;
    }
    if (apiUrl && isString(apiUrl)) {
      config.url = `${apiUrl}${config.url}`;
    }

    return config;
  },

  /**
   * @description: 请求拦截器处理
   */
  requestInterceptors: (config, options) => {
    const requestOptions = (config as Recordable).requestOptions as RequestOptions;
    const {
      joinParamsToUrl,
      formatDate,
      joinTime = true,
      trimEmpty = true,
      withToken = true,
      cipherParams = '',
      signParams,
    } = requestOptions;

    // console.log('@@@@requestInterceptors', requestOptions, options.requestOptions);

    const headers = (config as Recordable).headers as AxiosRequestHeaders;

    // 请求之前处理config
    const token = getToken();
    if (token && withToken) {
      // jwt token
      const authorization = options.authenticationScheme
        ? `${options.authenticationScheme} ${token}`
        : token;
      headers.set('Authorization', authorization as string);
    }

    const base64 = EncryptionFactory.createBase64Encryption();

    // APP Key
    const appId = import.meta.env.VITE_APP_ID;
    headers.set('X-App-Id', base64.encrypt(appId));

    // 语言
    const lang = useLocaleStoreWithOut().getLocale;
    headers.set('X-Language', lang == 'en' ? lang : 'zh');

    // 请求的唯一id
    const requestId = buildUUID();
    headers.set('X-Request-Id', requestId);

    // 加密字段写入header
    if (cipherParams?.length > 0) {
      headers.set(
        'X-Cipher',
        isString(cipherParams) ? 'cipher' : base64.encrypt(JSON.stringify(cipherParams)),
      );
    }

    const processing = function (datas: Recordable) {
      // 时间处理
      formatDate && formatRequestDate(datas);

      // 去除空格
      trimEmpty && trimParam(datas);
    };

    const params = config.params || {};
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
      const signData = new SignData(
        SignatureFactory.createRsaSignature({
          key: rsaCipher.privateKey, // 私钥签名
          options: {
            log: true,
          },
        }),
      );

      // 将所有参数合并
      const all = Object.assign({}, config.params, config.data);
      const signStr = signData.getSignStr(all, signParams.request, requestId, appId);
      const sign = signData.sign(signStr);
      if (false === sign) {
        console.error(
          '请求数据签名失败, data: ',
          all,
          'signParams: ',
          signParams.request,
          'requestId: ',
          requestId,
          'signStr: ',
          signStr,
        );
        // throw new Error('请求数据签名失败！');
      } else {
        config.params = Object.assign(config.params || {}, { sign: sign });
      }
    }

    // 数据加密
    if (cipherParams.length > 0) {
      const cipherData = new CipherData(EncryptionFactory.createAesEncryption(cacheCipher));
      cipherData.requestEncryptData(config, requestOptions);
    }

    // url 处理
    if (paramsIsStr) {
      // 兼容restful风格
      if (config.method?.toUpperCase() === RequestEnum.GET) {
        config.url = setObjToUrlParams(config.url as string, config.params);
      }
      config.params = undefined;
    } else {
      if (!hasData && config.method?.toUpperCase() !== RequestEnum.GET) {
        // 非GET请求如果没有提供data，则将params视为data
        config.data = config.params;
        config.params = {};
      }

      if (joinParamsToUrl) {
        config.url = setObjToUrlParams(
          config.url as string,
          Object.assign({}, config.params, config.data),
        );
      }
    }
    return config;
  },

  /**
   * @description: 响应拦截器处理
   */
  responseInterceptors: (res: AxiosResponse<any>) => {
    // 响应的数据先解密再验证签名
    // 返回数据解密
    const cipherData = new CipherData(EncryptionFactory.createAesEncryption(cacheCipher));
    cipherData.responseDecryptData(res);

    // 验证签名

    return res;
  },

  /**
   * @description: 响应错误处理
   */
  responseInterceptorsCatch: (axiosInstance: AxiosInstance, error: any) => {
    const { t } = useI18n();
    const errorLogStore = useErrorLogStoreWithOut();
    errorLogStore.addAjaxErrorInfo(error);
    const { response, code, message, config } = error || {};
    const errorMessageMode = config?.requestOptions?.errorMessageMode || 'none';
    const statusCodes = config?.requestOptions?.statusCodes || [200];
    const respCode: number = response?.data?.code ?? 0;
    const respMsg: string = response?.data?.message ?? '';
    let msg = '';
    if (0 !== respCode) {
      msg = '【' + respCode + '】' + respMsg;
    }
    const err: string = error?.toString?.() ?? '';
    let errMessage = '';

    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

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
          createMessage.error(errMessage);
        }
        return Promise.reject(error);
      }
    } catch (error) {
      throw new Error(error as unknown as string);
    }

    // 特殊状态码状态码处理
    if (statusCodes.includes(response?.status)) {
      return Promise.resolve(response);
    } else {
      checkStatus(error?.response?.status, msg, errorMessageMode);
    }
    // console.log('@@@statusCodes', statusCodes, response, config);
    // 添加自动重试机制 保险起见 只针对GET请求
    const retryRequest = new AxiosRetry();
    const { isOpenRetry } = config.requestOptions.retryRequest;
    config.method?.toUpperCase() === RequestEnum.GET &&
      isOpenRetry &&
      error?.response?.status !== 401 &&
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
