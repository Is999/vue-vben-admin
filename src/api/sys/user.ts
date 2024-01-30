import { AdminApi } from '/@/api/api';
import { UserInfoModel, LoginParams, LoginResult, RoleInfo } from './model/userModel';
import { ErrorMessageMode } from '/#/axios';

enum Api {
  Login = '/user/login',
  BuildSecretVerifyAccount = '/user/buildSecretVerifyAccount',
  Logout = '/user/logout',
  Mine = '/user/mine',
  Permissions = '/user/permissions',
  CheckPassword = '/user/checkPassword',
}

// 登录
export function login(params: LoginParams, mode: ErrorMessageMode = 'none') {
  return AdminApi.post<LoginResult>(
    {
      url: Api.Login,
      params,
    },
    {
      statusCodes: [406],
      errorMessageMode: mode,
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
export function checkPassword(password: string) {
  return AdminApi.post<any>(
    {
      url: Api.CheckPassword,
      params: { password },
    },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
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
