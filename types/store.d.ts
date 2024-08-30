import { ErrorTypeEnum } from '@/enums/exceptionEnum';
import { MenuModeEnum, MenuTypeEnum } from '@/enums/menuEnum';
import { RoleInfo, UserInfoModel } from '@/api/sys/model/userModel';

// Lock screen information
export interface LockInfo {
  // Password required
  pwd?: string | undefined;
  // Is it locked?
  isLock?: boolean;
}

export interface ApiAddress {
  key: string;
  val: string;
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

export interface TableSetting {
  size: Nullable<SizeType>;
  showIndexColumn: Recordable<Nullable<boolean>>;
  columns: Recordable<Nullable<Array<ColumnOptionsType>>>;
  showRowSelection: Recordable<Nullable<boolean>>;
}

export interface MfaInfo {
  // 验证页面标题提示
  title: string;
  // MFA设备绑定地址
  build_mfa_url?: string;
  // 校验 1 启用， 0 未启用
  mfa_check?: number;
  // 是否存在MFA设备，不存在则显示MFA设备绑定地址
  exist_mfa?: boolean;
  // 两步验证：true 弹出身份验证遮罩层进行强制验证
  isTwoStepVerification?: boolean;
  // 两步验证key
  twoStepKey?: string;
  // 两步验码生成时间
  twoStepTime?: number;
  // 两步验证过期时间
  twoStepExpire?: number;
  // 两步验证value
  twoStepValue?: string;
  // 验证场景
  scenarios?: number;
  // 返回按钮(关闭验证页面)：// 登录验证不显示返回按钮，其它根据使用场景设置是否显示
  isOff?: boolean;
  // 校验频率 0 每次都校验
  frequency: number;
}
