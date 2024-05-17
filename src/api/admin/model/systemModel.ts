import { BasicPageParams } from '@/api/model/baseModel';
import { TreeItem } from '@/components/Tree';

// 部门
export type DeptParams = {
  deptName?: string;
  status?: string;
};

// 部门
export interface DeptListItem {
  id: string;
  orderNo: string;
  createTime: string;
  remark: string;
  status: number;
}

// 账号列表 请求参数
export type AccountParams = BasicPageParams & {
  email?: string; // 邮箱
  name?: string; // 账号
  role?: number; // 角色
  status?: number; // 账号状态
};

// 账号列表 新增|编辑提交数据模型
export interface AccountModel {
  id: string;
  email: string; // 邮箱
  username: string; // 昵称
  real_name: string; // 昵称
  password?: string; // 密码
  status?: number; // 状态
  role?: string; // 角色
  mfa_secure_key?: string; // 基于时间的动态密码 (TOTP) 多重身份验证 (MFA)秘钥：如Google Authenticator、Microsoft Authenticator
  mfa_status?: boolean; // 启用 TOTP MFA (两步验证 2FA)：0 不启用，1 启用
  remark?: string; // 备注
}

// 账号列表 新增|编辑 绑定角色 提交数据模型
export interface AccountRoleModel {
  id: string;
  roles: number[];
}

// 账号列表
export interface AccountListItem {
  id: string;
  name: string; // 账号
  real_name: string; // 昵称
  email: string; // 邮箱
  phone: string; // 电话
  mfa_secure_key: string; // 基于时间的动态密码 (TOTP) 多重身份验证 (MFA)秘钥：如Google Authenticator、Microsoft Authenticator
  mfa_status: boolean; // 启用 TOTP MFA (两步验证 2FA)：0 不启用，1 启用
  status: boolean; // 状态
  avatar: string; // 头像
  role?: string; // 角色
  remark?: string; // 备注
  last_login_time: string; // 登录时间
  last_login_ip: string; // 登录IP
  last_login_ipaddr: string; // IP属地
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

// 修改密码
export interface updatePasswordParams {
  passwordOld: string; // 旧密码
  passwordNew: string; // 新密码
}

// 树下拉框
export interface TreeSelect extends TreeItem {
  value?: string | number;
  id?: number;
}

// 菜单列表请求参数
export type MenuParams = BasicPageParams & {
  title?: string; // 菜单名称
  permissions_uuid?: string; // 权限标识
  status?: number; // 菜单状态
  pid?: number; // 上级菜单id
  is_shortcut?: number; // 是否快捷
  cache?: number; // 是否请求缓存数据
};

// 菜单新增|编辑提交数据模型
export interface MenuModel {
  id?: string;
  permissions_uuid: string; // 权限
  title: string; // 菜单名
  title_lang: string; // 多语言菜单名
  status: number; // 状态: 1显示, 2隐藏
  pid: number; // 父id
  component: string; // 组件
  path: string; // 路径
  type: number; // 类型: 0目录, 1菜单
  icon: string; // 图标
  sort: string; // 排序
  is_shortcut: number; // 快捷: 1是, 0否
  describe: string; // 描述
}

// 菜单列表
export interface MenuListItem {
  id: string;
  type: number; // 类型: 0目录, 1菜单
  is_shortcut: number; // 快捷: 1是, 0否
  describe: string; // 描述
  status: number; // 状态: 1显示, 2隐藏
  icon: string; // 图标
  component: string; // 组件
  uuid: string; // 权限
  children?: Nullable<MenuListItem[]>;
  path: string; // 路径
  pid: number; // 父id
  sort: string; // 排序
  title: string; // 菜单名
  title_lang: string; // 多语言菜单名
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

// 权限列表搜索请求参数
export type PermissionParams = BasicPageParams & {
  title?: string; // 权限名称
  uuid?: string; // 权限标识
  type?: number; // 权限类型
  pid?: number; // 上级权限id
  cache: number; // 是否请求缓存数据
};

// 权限新增|编辑提交数据模型
export interface PermissionModel {
  id?: string;
  uuid: string; // 权限
  title: string; // 菜单名
  title_lang: string; // 多语言菜单名
  status: number; // 状态: 1显示, 2隐藏
  pid: number; // 父id
  component: string; // 组件
  path: string; // 路径
  type: number; // 类型: 0目录, 1菜单
  icon: string; // 图标
  sort: string; // 排序
  is_shortcut: number; // 快捷: 1是, 0否
  describe: string; // 描述
}

// 权限列表
export interface PermissionListItem {
  id: string;
  type: number; // 类型: 0查看, 1新增, 2修改, 3删除, 4目录, 5菜单, 6页面, 7按钮, 8其它
  module: string; // 权限匹配模型
  describe: string; // 描述
  uuid: string; // 权限标识
  children?: Nullable<PermissionListItem[]>; // 子级
  pid: number; // 父id
  title: string; // 权限名
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

// 角色列表请求参数
export type RoleParams = BasicPageParams & {
  title?: string; // 角色名称
  status?: string; // 角色状态
  pid?: number; // 上级角色id
  cache: number; // 是否请求缓存数据
};

// 角色列表
export interface RoleListItem {
  id: number;
  title: string;
  pid: number;
  status: number;
  permissions_id: string;
  describe: string;
  children?: Nullable<RoleListItem[]>; // 子级
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

// 角色列表
export interface RoleModel {
  id: number;
  title: string;
  pid: number;
  status: number;
  permissions?: number[];
  permissions_id: number[];
  describe: string;
}

// 参数配置列表搜索请求参数
export type ConfigParams = BasicPageParams & {
  title?: string; // 名称
  uuid?: string; // 标识
  cache: number; // 是否请求缓存数据
};

// 配置新增|编辑提交数据模型
export interface ConfigModel {
  id?: string;
  uuid: string; // 唯一标识
  title: string; // 配置名称
  value: string; // 配置值
  remark: string; // 描述
}

// 参数配置列表
export interface ConfigListItem {
  id: string;
  uuid: string; // 唯一标识
  title: string; // 配置名称
  value: string; // 配置值
  remark: string; // 描述
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

export type CacheParams = {
  key?: string; // key
  type?: number; // 类型
};

// 信息
export interface RedisInfoModel {
  redis_version: string; // 版本
  redis_git_sha1: number;
  redis_git_dirty: number;
  redis_build_id: string;
  redis_mode: string;
  os: string; // OS
  arch_bits: number;
  multiplexing_api: string;
  atomicvar_api: string;
  gcc_version: string;
  process_id: number; // 进程ID
  run_id: string;
  tcp_port: number;
  uptime_in_seconds: number;
  uptime_in_days: number;
  hz: number;
  configured_hz: number;
  lru_clock: number;
  executable: string;
  config_file: string;
  connected_clients: number; // 客户端连接数
  client_recent_max_input_buffer: number;
  client_recent_max_output_buffer: number;
  blocked_clients: number;
  used_memory: number;
  used_memory_human: string; // 已用内存
  used_memory_rss: number;
  used_memory_rss_human: string;
  used_memory_peak: number;
  used_memory_peak_human: string; // 内存占用峰值
  used_memory_peak_perc: string;
  used_memory_overhead: number;
  used_memory_startup: number;
  used_memory_dataset: number;
  used_memory_dataset_perc: string;
  allocator_allocated: number;
  allocator_active: number;
  allocator_resident: number;
  total_system_memory: number;
  total_system_memory_human: string;
  used_memory_lua: number;
  used_memory_lua_human: string; // Lua占用内存
  used_memory_scripts: number;
  used_memory_scripts_human: string;
  number_of_cached_scripts: number;
  maxmemory: number;
  maxmemory_human: string;
  maxmemory_policy: string;
  allocator_frag_ratio: number;
  allocator_frag_bytes: number;
  allocator_rss_ratio: number;
  allocator_rss_bytes: number;
  rss_overhead_ratio: number;
  rss_overhead_bytes: number;
  mem_fragmentation_ratio: number;
  mem_fragmentation_bytes: number;
  mem_not_counted_for_evict: number;
  mem_replication_backlog: number;
  mem_clients_slaves: number;
  mem_clients_normal: number;
  mem_aof_buffer: number;
  mem_allocator: string;
  active_defrag_running: number;
  lazyfree_pending_objects: number;
  loading: number;
  rdb_changes_since_last_save: number;
  rdb_bgsave_in_progress: number;
  rdb_last_save_time: number;
  rdb_last_bgsave_status: string;
  rdb_last_bgsave_time_sec: number;
  rdb_current_bgsave_time_sec: number;
  rdb_last_cow_size: number;
  aof_enabled: number;
  aof_rewrite_in_progress: number;
  aof_rewrite_scheduled: number;
  aof_last_rewrite_time_sec: number;
  aof_current_rewrite_time_sec: number;
  aof_last_bgrewrite_status: string;
  aof_last_write_status: string;
  aof_last_cow_size: number;
  total_connections_received: number; // 历史连接数
  total_commands_processed: number; // 历史命令数
  instantaneous_ops_per_sec: number;
  total_net_input_bytes: number;
  total_net_output_bytes: number;
  instantaneous_input_kbps: number;
  instantaneous_output_kbps: number;
  rejected_connections: number;
  sync_full: number;
  sync_partial_ok: number;
  sync_partial_err: number;
  expired_keys: number;
  expired_stale_perc: number;
  expired_time_cap_reached_count: number;
  evicted_keys: number;
  keyspace_hits: number;
  keyspace_misses: number;
  pubsub_channels: number;
  pubsub_patterns: number;
  latest_fork_usec: number;
  migrate_cached_sockets: number;
  slave_expires_tracked_keys: number;
  active_defrag_hits: number;
  active_defrag_misses: number;
  active_defrag_key_hits: number;
  active_defrag_key_misses: number;
  role: string;
  connected_slaves: number;
  master_replid: string;
  master_replid2: number;
  master_repl_offset: number;
  second_repl_offset: number;
  repl_backlog_active: number;
  repl_backlog_size: number;
  repl_backlog_first_byte_offset: number;
  repl_backlog_histlen: number;
  used_cpu_sys: number;
  used_cpu_user: number;
  used_cpu_sys_children: number;
  used_cpu_user_children: number;
  cluster_enabled: number;
  db0: string;
  db4: string;
}
