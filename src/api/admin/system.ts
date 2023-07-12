import {
  AccountListItem,
  AccountModel,
  AccountParams,
  AccountRoleModel,
  CacheParams,
  ConfigListItem,
  ConfigModel,
  ConfigParams,
  DeptListItem,
  MenuListItem,
  MenuModel,
  MenuParams,
  PermissionListItem,
  PermissionModel,
  PermissionParams,
  RedisInfoModel,
  RoleListItem,
  RoleModel,
  RoleParams,
  TreeSelect,
  updatePasswordParams,
} from './model/systemModel';
import { AdminApi } from '/@/api/api';
import { SelectItem, TreeItem } from '/@/components/Tree';
import { BasicFetchResult } from '/@/api/model/baseModel';

enum Api {
  // 账号管理
  AccountList = '/user/index', // 账号列表
  AccountAdd = '/user/add', // 新增账号
  AccountStatus = '/user/editStatus', // 账号 禁用|启用
  AccountRoleTreeList = '/user/roleTreeList', // 新增账号|编辑账号 角色下拉框
  AccountEditRoles = '/user/editRoles', // 新增账号|编辑账号 角色下拉框
  AccountEdit = '/user/edit', // 编辑账号
  AccountBuildSecretKeyUrl = '/user/buildSecretKeyUrl', // 获取绑定安全秘钥的地址
  AccountRoles = '/user/roles', // 账号角色

  DeptList = '/system/getDeptList', // 账号部门

  // 个人信息
  UpdaetePassword = '/user/updatePassword', // 修改密码
  UpdateSecureKey = '/user/updateSecureKey', // 修改Google安全码
  UpdateMine = '/user/update', // 编辑账号

  // 菜单管理
  MenuList = '/menu/index', // 菜单列表
  MenuAdd = '/menu/add', // 新增菜单
  MenuEdit = '/menu/edit', // 编辑菜单
  MenuStatus = '/menu/editStatus', // 菜单状态 显示|隐藏
  MenuTreeList = '/menu/treeList', // 父级菜单|目录树形下拉框
  MenuPermissionUuidTreeList = '/menu/permissionUuidTreeList', // 权限标识树形下拉框

  // 权限管理
  PermissionList = '/permission/index', // 权限列表
  PermissionAdd = '/permission/add', // 新增权限
  PermissionEdit = '/permission/edit', // 编辑权限
  PermissionDel = '/permission/del', // 删除权限
  PermissionTreeList = '/permission/treeList', // 父级权限树形下拉框
  PermissionMaxUuid = '/permission/maxUuid', // 最大uuid

  // 角色管理
  RoleList = '/role/index', // 角色列表
  RoleAdd = '/role/add', // 新增角色
  RoleEdit = '/role/edit', // 编辑角色
  RoleDel = '/role/del', // 删除角色
  RoleStatus = '/role/editStatus', // 角色状态 禁用,启用
  RolePermissionTreeList = '/role/permission', // 角色权限下拉框
  RoleTreeList = '/role/treeList', // 父级角色下拉框

  // 参数配置
  ConfigList = '/config/index', // 参数配置列表
  ConfigAdd = '/config/add', // 新增参数配置
  ConfigEdit = '/config/edit', // 编辑参数配置
  ConfigGetCache = '/config/getCache', // 查看参数配置缓存
  ConfigRenew = '/config/renew', // 刷新参数配置缓存

  // 缓存管理
  CacheList = '/cache/index', // 缓存列表
  CacheRenew = '/cache/renew', // 刷新缓存
  CacheRenewAll = '/cache/renewAll', // 刷新全部缓存
  CacheInfo = '/cache/info', // Redis服务器信息

  // 操作日志
  UserLogList = '/userlog/index', // 日志列表
  UserLogActionList = '/userlog/actionList', // 操作类型
}

// 账号管理 列表,搜索
export const getAccountList = (params: AccountParams) =>
  AdminApi.get<BasicFetchResult<AccountListItem>>({ url: Api.AccountList, params });

// 账号管理 新增账号
export const accountAdd = (params: AccountModel) =>
  AdminApi.post(
    { url: Api.AccountAdd, params },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 账号管理 新增账号 绑定角色
export const accountEditRoles = (id: number, params: AccountRoleModel) =>
  AdminApi.post(
    { url: Api.AccountEditRoles + '/' + id, params },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 账号管理 账号 禁用|启用
export const setAccountStatus = (id: number, status: boolean) =>
  AdminApi.post(
    { url: Api.AccountStatus + '/' + id, params: { id, status } },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 账号管理 新增账号 绑定角色
export const accountEdit = (id: number, params: AccountModel) =>
  AdminApi.post(
    { url: Api.AccountEdit + '/' + id, params },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 账号管理 新增账号 绑定角色
export const accountBuildSecretKeyUrl = (id: number) =>
  AdminApi.get(
    { url: Api.AccountBuildSecretKeyUrl + '/' + id },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );

// 账号管理 新增账号 绑定角色
export const accountRoles = (id: number) =>
  AdminApi.get(
    { url: Api.AccountRoles + '/' + id },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );

// 账号管理 修改密码
export const updaetePassword = (params: updatePasswordParams) =>
  AdminApi.post(
    { url: Api.UpdaetePassword, params },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 账号管理 修改Google安全码
export const updateSecureKey = (params: Recordable) =>
  AdminApi.post(
    { url: Api.UpdateSecureKey, params },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

export const getDeptList = (params?: DeptListItem) =>
  AdminApi.get<BasicFetchResult<Recordable>>({ url: Api.DeptList, params });

// 账号管理 新增账号|编辑账号 角色下拉框
export const getAccountRoleTreeList = () => {
  return AdminApi.get<TreeSelect[]>(
    { url: Api.AccountRoleTreeList },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 菜单管理 列表,搜索
export const getMenuList = (params?: MenuParams) => {
  return AdminApi.post<BasicFetchResult<MenuListItem>>(
    { url: Api.MenuList, params },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 菜单管理 状态 显示|隐藏
export const setMenuStatus = (id: number, status: number) =>
  AdminApi.post(
    { url: Api.MenuStatus + '/' + id, params: { id, status } },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 菜单管理 新增菜单
export const menuAdd = (params: MenuModel) =>
  AdminApi.post(
    { url: Api.MenuAdd, params },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 菜单管理 编辑菜单
export const menuEdit = (id: number, params: MenuModel) =>
  AdminApi.post(
    { url: Api.MenuEdit + '/' + id, params },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 菜单管理 新增菜单|编辑菜单 权限标识下拉框
export const getMenuPermissionUuidTreeList = () => {
  return AdminApi.get<TreeSelect[]>(
    { url: Api.MenuPermissionUuidTreeList },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 菜单管理 新增菜单|编辑菜单 上级菜单下拉框
export const getMenuTreeList = () => {
  return AdminApi.get<TreeSelect[]>(
    { url: Api.MenuTreeList },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 权限管理 列表,搜索
export const getPermissionList = (params?: PermissionParams) => {
  return AdminApi.post<BasicFetchResult<PermissionListItem>>(
    { url: Api.PermissionList, params },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 权限管理 新增权限
export const permissionAdd = (params: PermissionModel) =>
  AdminApi.post(
    { url: Api.PermissionAdd, params },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 权限管理 编辑权限
export const permissionEdit = (id: number, params: PermissionModel) =>
  AdminApi.post(
    { url: Api.PermissionEdit + '/' + id, params },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 权限管理 删除权限
export const permissionDel = (id: number) =>
  AdminApi.post(
    { url: Api.PermissionDel + '/' + id, params: { id } },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 权限管理 新增权限|编辑权限 上级权限下拉框
export const getPermissionTreeList = () => {
  return AdminApi.get<TreeSelect[]>(
    { url: Api.PermissionTreeList },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 权限管理 新增权限 获取最大的uuid
export const getPermissionMaxUuid = () => {
  return AdminApi.get<Recordable>(
    { url: Api.PermissionMaxUuid },
    {
      errorMessageMode: 'none', // 错误直接提示后台返回信息
    },
  );
};

// 角色管理 列表,搜索
export const getRoleList = (params?: RoleParams) => {
  return AdminApi.get<BasicFetchResult<RoleListItem>>(
    { url: Api.RoleList, params },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 权限管理 新增权限
export const roleAdd = (params: RoleModel) =>
  AdminApi.post(
    { url: Api.RoleAdd, params },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 权限管理 编辑权限
export const roleEdit = (id: number, params: RoleModel) =>
  AdminApi.post(
    { url: Api.RoleEdit + '/' + id, params },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 角色管理 状态 启用|禁用
export const setRoleStatus = (id: number, status: number) =>
  AdminApi.post(
    { url: Api.RoleStatus + '/' + id, params: { id, status } },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 角色管理 删除权限
export const roleDel = (id: number) =>
  AdminApi.post(
    { url: Api.RoleDel + '/' + id, params: { id } },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 角色管理 新增角色|编辑角色 权限标识下拉框
export const getRolePermissionTreeList = (id: number, isPid: boolean) => {
  return AdminApi.get<TreeItem[]>(
    { url: Api.RolePermissionTreeList + '/' + id, params: { id, isPid } },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 角色管理 新增角色|编辑角色 上级角色下拉框
export const getRoleTreeList = () => {
  return AdminApi.get<TreeSelect[]>(
    { url: Api.RoleTreeList },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 参数配置 列表,搜索
export const getConfigList = (params?: ConfigParams) => {
  return AdminApi.post<BasicFetchResult<ConfigListItem>>(
    { url: Api.ConfigList, params },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 参数配置 新增配置
export const configAdd = (params: ConfigModel) =>
  AdminApi.post(
    { url: Api.ConfigAdd, params },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 参数配置 编辑配置
export const configEdit = (id: number, params: ConfigModel) =>
  AdminApi.post(
    { url: Api.ConfigEdit + '/' + id, params },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 参数配置 查看配置缓存
export const configGetCache = (uuid: string) =>
  AdminApi.get(
    { url: Api.ConfigGetCache + '/' + uuid },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );

// 参数配置 查看配置缓存
export const configRenew = (uuid: string) =>
  AdminApi.post(
    { url: Api.ConfigRenew + '/' + uuid },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 缓存管理 列表,搜索
export const getCacheList = () => {
  return AdminApi.get<BasicFetchResult<Recordable>>(
    { url: Api.CacheList },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 缓存管理 刷新缓存
export const cacheRenew = (params: CacheParams) =>
  AdminApi.post(
    { url: Api.CacheRenew, params },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

// 缓存管理 刷新缓存
export const cacheRenewAll = () =>
  AdminApi.post(
    { url: Api.CacheRenewAll },
    {
      isTransformResponse: false, // 无须处理直接返回完整后台消息
    },
  );

export const cacheInfo = () => {
  return AdminApi.get<RedisInfoModel>(
    { url: Api.CacheInfo },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 操作日志 列表,搜索
export const getUserLogList = (params?: Recordable) => {
  return AdminApi.post<BasicFetchResult<Recordable>>(
    { url: Api.UserLogList, params },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 操作日志 操作类型列表
export const getUserLogActionList = () => {
  return AdminApi.get<SelectItem[]>(
    { url: Api.UserLogActionList },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};
