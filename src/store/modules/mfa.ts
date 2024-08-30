import { MfaInfo } from '#/store';

import { defineStore } from 'pinia';

import { MFA_INFO_KEY } from '@/enums/cacheEnum';
import { Persistent } from '@/utils/cache/persistent';
import { useUserStore } from './user';

interface MfaStore {
  mfaInfo: Nullable<MfaInfo>;
  afterSuccessVerify: Fn;
}

export const useMfaStore = defineStore({
  id: 'app-two-step-verification',
  state: (): MfaStore => ({
    mfaInfo: null,
    afterSuccessVerify: () => {},
  }),
  getters: {
    getMfaInfo(): Nullable<MfaInfo> {
      return this.mfaInfo || Persistent.getLocal(MFA_INFO_KEY) || {};
    },
  },
  actions: {
    setMfaInfo(info: MfaInfo) {
      this.mfaInfo = Object.assign({}, this.getMfaInfo, info);
      // console.log('@@@ mfaInfo ', this.mfaInfo);
      Persistent.setLocal(MFA_INFO_KEY, this.mfaInfo, true);
    },
    resetMfaInfo() {
      Persistent.removeLocal(MFA_INFO_KEY, true);
      this.mfaInfo = null;
    },
    openVerify() {
      // 判断频率
      const expire = Math.ceil(new Date().getTime() / 1000) + 30;
      const mfaInfo = this.getMfaInfo;
      if (
        mfaInfo &&
        mfaInfo.frequency > 0 &&
        mfaInfo?.twoStepTime !== undefined &&
        mfaInfo?.twoStepExpire !== undefined &&
        expire <= mfaInfo.twoStepTime + mfaInfo.frequency &&
        expire <= mfaInfo.twoStepTime + mfaInfo.twoStepExpire
      ) {
        this.afterSuccessVerify(mfaInfo);
      } else {
        mfaInfo.isTwoStepVerification = true; // 打开身份验证页面
        this.setMfaInfo(mfaInfo);
      }
    },

    // 两步验证
    async checkMFA(password?: string) {
      const userStore = useUserStore();
      const tryCheck = async () => {
        try {
          const res = await userStore.checkMfaPassword(password, this.getMfaInfo.scenarios);
          // console.log('checkMfaPassword', res);
          if (res.isOk) {
            const mfaInfo: MfaInfo = {
              build_mfa_url: res.build_mfa_url,
              exist_mfa: res.exist_mfa,
              mfa_check: res.mfa_check,
              scenarios: res.scenarios,
              isTwoStepVerification: false, // 验证成功关闭页面
              twoStepKey: res.twoStep?.key,
              twoStepTime: res.twoStep?.time,
              twoStepExpire: res.twoStep?.expire,
              twoStepValue: res.twoStep?.value,
              frequency: res.frequency,
            };
            this.setMfaInfo(mfaInfo);
            this.afterSuccessVerify(mfaInfo);
            return res.isOk;
          }
          return res.isOk;
        } catch (error) {
          console.log(error);
          return false;
        }
      };
      return await tryCheck();
    },
  },
});
