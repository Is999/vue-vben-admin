/**
 * @description: Login interface parameters
 */
export interface LoginParams {
  name: string;
  password: string;
  captcha: string;
  key: string;
  secureCode?: string;
}

/**
 * @description: 用户角色权限信息
 */
export interface RoleInfo {
  superUserRole: number; // 是否是超级管理员
  roles: Array<string>; // 角色
  permissions: Array<string>; // 权限
}

/**
 * @description: 登录接口返回信息
 */
export interface LoginResult {
  token: string;
  user: UserInfoModel;
}

/**
 * @description: 用户信息
 */
export interface UserInfoModel {
  // 用户id
  id: number;
  // 用户名
  name: string;
  // 真实名字
  real_name: string;
  // email
  email: string;
  // 手机号
  phone: string;
  // 状态
  status: string;
  // 分组
  group_id: number;
  // 是否绑定了安全码
  is_build_secure_key: boolean;
  // 安全码绑定地址
  build_secure_key_url: string;
  // 头像
  avatar: string;
  // 介绍
  remark?: string;
  // 最后登录时间
  last_login_time: string;
  // 最后登录ip
  last_login_ip: string;
  // 最后登录ip
  last_login_ipaddr: string;
  // 创建时间
  created_at: string;
  // 更新时间
  updated_at: string;
}
