import { MfaInfo, UserInfo, UserInfos, UserRole } from '#/store';
import type { ErrorMessageMode } from '#/axios';
import { defineStore } from 'pinia';
import { store } from '@/store';
import { RoleEnum } from '@/enums/roleEnum';
import { PageEnum } from '@/enums/pageEnum';
import { ROLES_KEY, TOKEN_KEY, USER_INFO_KEY } from '@/enums/cacheEnum';
import { getAuthCache, setAuthCache } from '@/utils/auth';
import { LoginParams, RoleInfo, UserInfoModel } from '@/api/sys/model/userModel';
import { useI18n } from '@/hooks/web/useI18n';
import { useMessage } from '@/hooks/web/useMessage';
import { router } from '@/router';
import { usePermissionStore } from '@/store/modules/permission';
import { RouteRecordRaw } from 'vue-router';
import { PAGE_NOT_FOUND_ROUTE } from '@/router/routes/basic';
import { h } from 'vue';
import {
  checkMfaSecure,
  checkSecure,
  login as loginApi,
  logout as doLogout,
  mine,
  userPermissions,
} from '@/api/sys/user';
import { useMfaStore } from '@/store/modules/mfa';

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
      if (info) {
        info.userId = info.id;
        info.username = info.name;
        info.realName = info.real_name;
        info.desc = info.remark;
      }
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
        const data = await loginApi(loginParams, mode);
        const { token, user } = data;

        // save token
        this.setToken(token);
        // 设置用户信息缓存
        this.setUserInfo(user);
        // 登录两步验证校验MFA动态密码
        if (!user.exist_mfa || parseInt(user.mfa_status) !== 0) {
          const mfaInfo: MfaInfo = {
            build_mfa_url: user.build_mfa_url,
            mfa_status: user.mfa_status,
            exist_mfa: user.exist_mfa,
            isTwoStepVerification: true,
            isOff: false,
          };
          useMfaStore().setMfaInfo(mfaInfo);
        }
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

        // 动态路由加载（首次）
        if (!permissionStore.isDynamicAddedRoute) {
          const routes = await permissionStore.buildRoutesAction();
          [...routes, PAGE_NOT_FOUND_ROUTE].forEach((route) => {
            router.addRoute(route as unknown as RouteRecordRaw);
          });
          // 记录动态路由加载完成
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
          await doLogout();
        } catch {
          console.log('注销Token失败');
        }
      }

      console.log('注销Token: 清空缓存');
      // 清空缓存
      this.setToken(undefined);
      this.setSessionTimeout(false);
      this.setUserInfo(null);
      this.setUserRole(null);

      console.log('清空缓存完毕 ', goLogin);
      if (goLogin) {
        // 直接回登陆页
        router.replace(PageEnum.BASE_LOGIN);
      } else {
        // 回登陆页带上当前路由地址
        router.replace({
          path: PageEnum.BASE_LOGIN,
          query: {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          },
        });
      }
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
          // 主动登出，不带redirect地址
          await this.logout(true);
        },
      });
    },

    /**
     * @description: 锁屏密码
     */
    async checkPassword(password = ''): Promise<boolean> {
      if (this.getToken && password) {
        try {
          const { isOk } = await checkSecure(password);
          return isOk as boolean;
        } catch {
          return false;
        }
      }
      return false;
    },

    /**
     * @description: MFA动态密码
     */
    async checkMfaPassword(password = ''): Promise<any> {
      if (this.getToken && password) {
        try {
          return await checkMfaSecure(password);
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
