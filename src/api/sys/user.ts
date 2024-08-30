import { AdminApi } from '@/api/api';
import { UserInfoModel, LoginParams, LoginResult, RoleInfo } from './model/userModel';
import { ErrorMessageMode } from '#/axios';
import { useUserStore } from '@/store/modules/user';

enum Api {
  Login = '/user/login',
  BuildSecretVerifyAccount = '/user/buildSecretVerifyAccount',
  Logout = '/user/logout',
  Mine = '/user/mine',
  Permissions = '/user/permissions',
  CheckSecure = '/user/checkSecure',
  CheckMfaSecure = '/user/checkMfaSecure',
}

// 登录
export function login(params: LoginParams, mode: ErrorMessageMode = 'none') {
  return AdminApi.post<LoginResult>(
    {
      url: Api.Login,
      params,
    },
    {
      statusCodes: [406, 403, 500],
      errorMessageMode: mode,
      cryptoType: 'A', // 加密方式 A: AES加密、解密；R: RSA加密、解密
      cipherParams: ['name', 'password'], // 参数加密
      signatureType: 'R', // 签名方式 M: MD5签名、验签；A: AES签名、验签；R: RSA签名、验签
      signParams: {
        request: ['name', 'password'], // 请求参数签名
        response: ['token'], // 响应验证签名参数
      },
    },
  );
}

// 绑定安全码验证账号密码
export function buildSecretVerifyAccount(params: LoginParams, mode: ErrorMessageMode = 'none') {
  return AdminApi.post<LoginResult>(
    {
      url: Api.BuildSecretVerifyAccount,
      params,
    },
    {
      statusCodes: [406],
      errorMessageMode: mode,
      cryptoType: 'A', // 加密方式 A: AES加密、解密；R: RSA加密、解密
      cipherParams: ['name', 'password'], // 参数加密
    },
  );
}

// 登出
export function logout() {
  return AdminApi.post<any>(
    {
      url: Api.Logout,
    },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
}

// 获取个人信息
export function mine() {
  return AdminApi.get<UserInfoModel>(
    {
      url: Api.Mine,
    },
    {
      retryRequest: {
        isOpenRetry: true,
        count: 5,
        waitTime: 30000,
      },
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
}

// 用户权限权限控制
export function userPermissions() {
  return AdminApi.get<RoleInfo>(
    {
      url: Api.Permissions,
    },
    {
      retryRequest: {
        isOpenRetry: true,
        count: 5,
        waitTime: 30000,
      },
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
}

// 验证密码(锁屏密码)
export function checkSecure(secure: string) {
  return AdminApi.post<any>(
    {
      url: Api.CheckSecure,
      params: { secure },
    },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
      cipherParams: ['secure'], // 参数加密
    },
  );
}

// 验证MFA动态密码
export function checkMfaSecure(secure: string, scenarios: number) {
  return AdminApi.post<any>(
    {
      url: Api.CheckMfaSecure,
      params: { secure, scenarios },
    },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
      cipherParams: ['secure'], // 参数加密
    },
  );
}

// 获取权限码
export async function getPermCode() {
  const userStore = useUserStore();
  const role = await userStore.getUserPermissionsAction();
  return Promise.resolve(role?.permissions || []);
}

export function testRetry() {
  return AdminApi.get<UserInfoModel>(
    {
      url: Api.Mine,
    },
    {
      retryRequest: {
        isOpenRetry: true,
        count: 5,
        waitTime: 30000,
      },
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
}
