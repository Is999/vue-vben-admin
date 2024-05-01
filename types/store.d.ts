import { ErrorTypeEnum } from '/@/enums/exceptionEnum';
import { MenuModeEnum, MenuTypeEnum } from '/@/enums/menuEnum';
import { RoleInfo, UserInfoModel } from '/@/api/sys/model/userModel';

// Lock screen information
export interface LockInfo {
  // Password required
  pwd?: string | undefined;
  // Is it locked?
  isLock?: boolean;
}

// Error-log information
export interface ErrorLogInfo {
  // Type of error
  type: ErrorTypeEnum;
  // Error file
  file: string;
  // Error name
  name?: string;
  // Error message
  message: string;
  // Error stack
  stack?: string;
  // Error detail
  detail: string;
  // Error url
  url: string;
  // Error time
  time?: string;
}

export interface UserInfo extends UserInfoModel {
  homePath?: string;
}

export type UserRole = RoleInfo;

export interface UserInfos {
  info: UserInfo;
  role: UserRole;
}

export interface BeforeMiniState {
  menuCollapsed?: boolean;
  menuSplit?: boolean;
  menuMode?: MenuModeEnum;
  menuType?: MenuTypeEnum;
}

export interface MfaInfo {
  // MFA设备绑定地址
  build_mfa_url?: string;
  // 状态 1 启用， 0 未启用
  mfa_status?: number;
  // 是否存在MFA设备
  exist_mfa?: boolean;
  // 两步验证：true 强制验证
  isTwoStepVerification?: boolean;
  // 两步验证key
  twoStepKey?: string;
  // 两步验证过期时间
  twoStepExpire?: number;
  // 两步验证value
  twoStepValue?: string;
  // 关闭验证
  isOff?: boolean;
}
