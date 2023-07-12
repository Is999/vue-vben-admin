import type { UserInfo, UserInfos, UserRole } from '/#/store';
import type { ErrorMessageMode } from '/#/axios';
import { defineStore } from 'pinia';
import { store } from '/@/store';
import { RoleEnum } from '/@/enums/roleEnum';
import { PageEnum } from '/@/enums/pageEnum';
import { ROLES_KEY, TOKEN_KEY, USER_INFO_KEY } from '/@/enums/cacheEnum';
import { getAuthCache, setAuthCache } from '/@/utils/auth';
import { LoginParams, RoleInfo, UserInfoModel } from '/@/api/sys/model/userModel';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { router } from '/@/router';
import { usePermissionStore } from '/@/store/modules/permission';
import { RouteRecordRaw } from 'vue-router';
import { PAGE_NOT_FOUND_ROUTE } from '/@/router/routes/basic';
import { h } from 'vue';
import { checkPassword, login, logout, mine, userPermissions } from '/@/api/sys/user';

interface UserState {
  userInfo: Nullable<UserInfo>;
  userRole: Nullable<UserRole>;
  token?: string;
  roleList: RoleEnum[];
  sessionTimeout?: boolean;
  lastUpdateTime: number;
}

export const useUserStore = defineStore({
  id: 'app-user',
  state: (): UserState => ({
    // user info
    userInfo: null,
    // user role
    userRole: null,
    // token
    token: undefined,
    // roleList
    roleList: [],
    // Whether the login expired
    sessionTimeout: false,
    // Last fetch time
    lastUpdateTime: 0,
  }),
  getters: {
    getUserInfo(state): UserInfo {
      return state.userInfo || getAuthCache<UserInfo>(USER_INFO_KEY) || {};
    },
    getUserRole(state): UserRole {
      return state.userRole || getAuthCache<UserRole>(ROLES_KEY) || {};
    },
    getToken(state): string {
      return state.token || getAuthCache<string>(TOKEN_KEY);
    },
    getRoleList(state): RoleEnum[] {
      return state.roleList.length > 0
        ? state.roleList
        : ((this.getUserRole?.roles || []) as RoleEnum[]);
    },
    getSessionTimeout(state): boolean {
      return !!state.sessionTimeout;
    },
    getLastUpdateTime(state): number {
      return state.lastUpdateTime;
    },
  },
  actions: {
    setToken(info: string | undefined) {
      this.token = info ? info : ''; // for null or undefined value
      setAuthCache(TOKEN_KEY, info);
    },
    setRoleList(roleList: RoleEnum[]) {
      this.roleList = roleList;
    },
    setUserInfo(info: UserInfo | null) {
      this.userInfo = info;
      this.lastUpdateTime = new Date().getTime();
      setAuthCache(USER_INFO_KEY, info);
    },
    setUserRole(role: UserRole | null) {
      this.userRole = role;
      if (role) {
        this.setRoleList(role.roles as RoleEnum[]);
      } else {
        this.setRoleList([]);
      }
      setAuthCache(ROLES_KEY, role);
    },

    setSessionTimeout(flag: boolean) {
      this.sessionTimeout = flag;
    },
    resetState() {
      this.userInfo = null;
      this.token = '';
      this.roleList = [];
      this.userRole = null;
      this.sessionTimeout = false;
    },
    getUserInfos(): UserInfos {
      return { info: this.getUserInfo, role: this.getUserRole };
    },
    /**
     * @description: login
     */
    async login(
      params: LoginParams & {
        goHome?: boolean;
        mode?: ErrorMessageMode;
      },
    ): Promise<UserInfoModel | null> {
      try {
        const { goHome = true, mode, ...loginParams } = params;
        const data = await login(loginParams, mode);
        const { token, user } = data;

        // save token
        this.setToken(token);
        // 设置用户信息缓存
        this.setUserInfo(user);
        // return this.afterLoginAction(goHome);
        this.afterLoginAction(goHome);
        return user;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    /**
     * @description: 登录之后获取角色权限
     */
    async afterLoginAction(goHome?: boolean): Promise<UserInfo | null> {
      if (!this.getToken) return null;
      // get user info
      const roles = await this.getUserPermissionsAction();
      if (!roles) {
        return null;
      }

      const sessionTimeout = this.sessionTimeout;
      if (sessionTimeout) {
        this.setSessionTimeout(false);
      } else {
        const permissionStore = usePermissionStore();
        if (!permissionStore.isDynamicAddedRoute) {
          const routes = await permissionStore.buildRoutesAction();
          routes.forEach((route) => {
            router.addRoute(route as unknown as RouteRecordRaw);
          });
          router.addRoute(PAGE_NOT_FOUND_ROUTE as unknown as RouteRecordRaw);
          permissionStore.setDynamicAddedRoute(true);
        }
        goHome && (await router.replace(this.getUserInfo?.homePath || PageEnum.BASE_HOME));
      }
      return this.getUserInfo;
    },
    /**
     * @description: 获取用户信息(信息及权限)
     */
    async getUserInfoAction(): Promise<UserInfo | null> {
      if (!this.getToken) return null;

      const getUser = () => {
        // 用户信息
        this.getMineAction();
        // 用户角色权限
        this.getUserPermissionsAction();
      };

      await getUser();

      return this.getUserInfo;
    },
    /**
     * @description: 获取用户信息
     */
    async getMineAction(): Promise<UserInfoModel | null> {
      if (!this.getToken) return null;

      // 用户信息
      const userInfo = await mine();

      // 设置用户信息缓存
      this.setUserInfo(userInfo);
      return userInfo;
    },
    /**
     * @description: 获取角色权限
     */
    async getUserPermissionsAction(): Promise<RoleInfo | null> {
      if (!this.getToken) return null;
      // 用户角色权限
      const role = await userPermissions();

      // 设置用户权限缓存
      this.setUserRole(role);

      return role;
    },

    /**
     * @description: logout
     */
    async logout(goLogin = true) {
      if (this.getToken) {
        try {
          await logout();
        } catch {
          console.log('注销Token失败');
        }
      }

      // 清空缓存
      this.setToken(undefined);
      this.setSessionTimeout(false);
      this.setUserInfo(null);
      this.setUserRole(null);
      goLogin && router.push(PageEnum.BASE_LOGIN);
    },

    /**
     * @description: Confirm before logging out
     */
    confirmLoginOut() {
      const { createConfirm } = useMessage();
      const { t } = useI18n();
      createConfirm({
        iconType: 'warning',
        title: () => h('span', t('sys.app.logoutTip')),
        content: () => h('span', t('sys.app.logoutMessage')),
        onOk: async () => {
          await this.logout(true);
        },
      });
    },

    /**
     * @description: 锁屏密码
     */
    async checkPassword(password = ''): Promise<boolean> {
      if (this.getToken || password) {
        try {
          const { isOk } = await checkPassword(password);
          return isOk as boolean;
        } catch {
          return false;
        }
      }
      return false;
    },
  },
});

// Need to be used outside the setup
export function useUserStoreWithOut() {
  return useUserStore(store);
}
