export type ErrorMessageMode = 'none' | 'modal' | 'message' | undefined;
export type SuccessMessageMode = ErrorMessageMode;
export type CryptoTypeMode = 'A' | 'R';
export type SignatureTypeMode = 'M' | 'A' | 'R';

export interface RequestOptions {
  // Splicing request parameters to url
  joinParamsToUrl?: boolean;
  // Format request parameter time
  formatDate?: boolean;
  // Whether to process the request result
  isTransformResponse?: boolean;
  // Whether to return native response headers
  // For example: use this attribute when you need to get the response headers
  isReturnNativeResponse?: boolean;
  // Whether to join url
  joinPrefix?: boolean;
  // Interface address, use the default apiUrl if you leave it blank
  apiUrl?: string;
  // 请求拼接路径
  urlPrefix?: string;
  // Error message prompt type
  errorMessageMode?: ErrorMessageMode;
  // Success message prompt type
  successMessageMode?: SuccessMessageMode;
  // Whether to add a timestamp
  joinTime?: boolean;
  ignoreCancelToken?: boolean;
  // Whether to send token in header
  withToken?: boolean;
  // 请求重试机制
  retryRequest?: RetryRequest;
  // 去除空字符
  trimEmpty?: boolean;
  // 特殊响应状态码处理
  statusCodes?: number[];
  // 加密方式 A: AES加密、解密；R: RSA加密、解密
  cryptoType?: CryptoTypeMode;
  // 加密参数: 整体加密值为string类型，值为 cipher，
  cipherParams?: string[] | string;
  // 签名方式 M: MD5签名、验签；A: AES签名、验签；R: RSA签名、验签
  signatureType?: SignatureTypeMode;
  // 签名参数
  signParams?: signParams;
}

export interface signParams {
  request?: string[]; // 请求参数签名
  response?: string[]; // 响应验证签名参数
}

export interface RetryRequest {
  isOpenRetry: boolean;
  count: number;
  waitTime: number;
}
export interface Result<T = any> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

// multipart/form-data: upload file
export interface UploadFileParams {
  // Other parameters
  data?: Recordable;
  // File parameter interface field name
  name?: string;
  // file name
  file: File | Blob;
  // file name
  filename?: string;
  [key: string]: any;
}
