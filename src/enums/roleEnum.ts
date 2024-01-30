export enum RoleEnum {
  // super admin
  SUPER = '1',
}

export enum PermissionsEnum {
  // Begin 系统管理
  SystmeDir = '100001', // 系统管理 (目录)

  // 角色管理
  RoleNav = '100002', // 角色管理	角色管理(菜单,页面)	role.index
  RoleAdd = '100003', // 添加	添加角色(按钮,页面)
  RoleAddSave = '100004', // 保存	添加角色(新增)	role.add
  RoleEdit = '100005', // 编辑	编辑角色(按钮,页面)
  RoleEditSave = '100006', // 保存	编辑角色(修改)	role.edit
  RoleDel = '100007', // 删除	删除角色(按钮, 删除)	role.del
  RoleStatus = '100008', // 启用/禁用	启用/禁用 角色(按钮,修改)	role.editStatus
  RolePermission = '100009', // 权限	编辑角色权限(按钮,页面)	role.permission
  RoleEditPermission = '100010', // 保存	编辑角色权限(修改)	role.editPermission

  // 权限管理
  PermissionNav = '100011', // 权限管理	权限管理(菜单,页面)	permission.index
  PermissionAdd = '100012', // 添加	添加权限(按钮,页面)
  PermissionAddSave = '100013', // 保存	添加权限(新增)	permission.add
  PermissionEdit = '100014', // 编辑	编辑权限(按钮,页面)
  PermissionEditSave = '100015', // 保存	编辑权限(修改)	permission.edit
  PermissionDel = '100016', // 删除	删除权限(按钮, 删除)	permission.del

  // 菜单管理
  MenuNav = '100017', // 菜单管理	菜单管理(菜单,页面)	menu.index
  MenuAdd = '100018', // 添加	添加菜单(按钮,页面)
  MenuAddSave = '100019', // 保存	添加菜单(新增)	menu.add
  MenuEdit = '100020', // 编辑	编辑菜单(按钮,页面)
  MenuEditSave = '100021', // 保存	编辑菜单(修改)	menu.edit
  MenuStatus = '100022', // 显示/隐藏	显示/隐藏 菜单(按钮,修改)	menu.editStatus

  // 账号管理
  AccountNav = '100023', // 账号管理	账号管理(菜单,页面)	user.index
  AccountAdd = '100024', // 添加	添加管理员(按钮,页面)
  AccountAddSave = '100025', // 保存	添加管理员(新增)	user.add
  AccountEdit = '100026', // 编辑	编辑管理员(按钮,页面)
  AccountEditSave = '100027', // 保存	编辑管理员(修改)	user.edit
  AccountBuildSecretKeyUrl = '100051', // 生成绑定安全秘钥地址	生成绑定安全秘钥地址(按钮，查看)	user.buildSecretKeyUrl
  AccountStatus = '100028', // 启用/禁用	启用/禁用 管理员(按钮,修改)	user.editStatus
  AccountEditRoles = '100029', // 用户角色	用户角色(弹框页面)	user.roleList
  AccountEditAddRoles = '100030', // 给用户分配角色	给用户分配角色(按钮,新增)	user.addRole
  AccountEditPassword = '100031', // 修改密码	修改密码(按钮,修改)	user.editPassword
  AccountEditDel = '100032', // 解除角色与用户的关系	解除角色与用户的关系(按钮,删除)	user.delRole
  AccountRestPassword = '100033', // 重置密码	重置用户的密码(按钮,修改)	user.resetPassword
  AccountBindSecurityCard = '100034', // 绑定安全验证卡	绑定安全验证卡(按钮,修改)	user.bindSecureCard
  AccountEditRolesSave = '100035', // 编辑账号角色	编辑账号角色/确认 (按钮, 新增, 删除)	user.editRoles

  // 参数配置
  ConfigNav = '100036', // 参数配置	参数配置(菜单,页面)	config.index
  ConfigAdd = '100037', // 添加	添加参数配置(按钮,页面)
  ConfigAddSave = '100038', // 保存	添加参数配置(新增)	config.add
  ConfigEdit = '100039', // 编辑	编辑参数配置(按钮,页面)
  ConfigEditSave = '100040', // 保存	编辑参数配置(修改)	config.edit
  ConfigGetCache = '100041', // 查看配置缓存	查看配置缓存(按钮, 查看)	config.getCache
  ConfigRenew = '100042', // 查看配置缓存	查看配置缓存(按钮, 查看)	config.renew

  // 缓存管理
  // CacheNav = '100043', // 缓存管理	缓存管理(菜单,页面)	cache.index
  CacheGetValue = '100044', // 查看缓存值	查看缓存值(按钮, 查看)	cache.getValue
  CacheRenew = '100045', // 刷新缓存	刷新缓存(按钮, 修改)	cache.renew
  CacheRenewAll = '100046', // 刷新全部缓存	刷新全部缓存(按钮, 修改)	cache.renewAll
  CacheGetInfo = '100047', // 服务器信息	服务器信息(按钮, 查看)	cache.info
  CacheSearch = '100048', // 搜索	搜索(按钮, 页面)
  CacheSearchKey = '100049', // 搜索	搜索(按钮, 查看)	cache.searchKey
  CacheSearchKeyValue = '100050', // 服务器信息	服务器信息(按钮, 查看)	cache.searchKeyValue
  // End 系统管理
}
