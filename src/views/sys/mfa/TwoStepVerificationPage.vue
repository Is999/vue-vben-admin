<template>
  <div
    :class="prefixCls"
    class="fixed inset-0 flex h-screen w-screen bg-black items-center justify-center"
  >
    <div
      :class="`${prefixCls}__unlock`"
      class="absolute top-0 left-1/2 flex pt-5 h-16 items-center justify-center sm:text-md xl:text-xl text-white flex-col cursor-pointer transform translate-x-1/2"
      v-show="showDate"
    >
    </div>

    <div class="flex w-screen h-screen justify-center items-center">
      <div :class="`${prefixCls}__hour`" class="relative mr-5 md:mr-20 w-2/5 h-2/5 md:h-4/5">
        <span>{{ hour }}</span>
        <span class="meridiem absolute left-5 top-5 text-md xl:text-xl" v-show="showDate">
          {{ meridiem }}
        </span>
      </div>
      <div :class="`${prefixCls}__minute md:mr-20 w-2/5 h-2/5 md:h-4/5`">
        <span> {{ minute }}</span>
      </div>
      <div :class="`${prefixCls}__minute w-2/5 h-2/5 md:h-4/5 `">
        <span> {{ second }}</span>
      </div>
    </div>

    <transition name="fade-slide">
      <div :class="`${prefixCls}-entry`" v-show="!showDate">
        <div :class="`${prefixCls}-entry-content`">
          <div
            class="enter-x"
            style="
              color: white;
              text-align: center;
              margin-top: -1rem;
              margin-bottom: 1rem;
              font-weight: bolder;
            "
          >
            {{ title }}
          </div>
          <div :class="`${prefixCls}-entry__header enter-x`">
            <img :src="userinfo.avatar || headerImg" :class="`${prefixCls}-entry__header-img`" />
            <p :class="`${prefixCls}-entry__header-name`">
              {{ userinfo.real_name }}
            </p>
          </div>
          <InputPassword
            placeholder="请输入MFA设备动态密码"
            class="enter-x"
            v-model:value="password"
            :maxlength="6"
          />
          <span :class="`${prefixCls}-entry__err-msg enter-x`" v-if="'' !== errMsg">
            {{ errMsg }}
          </span>
          <div :class="`${prefixCls}-entry__footer enter-x`">
            <a-button
              type="link"
              size="small"
              class="mt-2 mr-2 enter-x"
              :disabled="loading"
              @click="handleBuildMfa()"
              v-if="!mfaInfo?.exist_mfa || mfaInfo?.isOff"
              >{{ !mfaInfo?.exist_mfa ? '绑定MFA设备' : mfaInfo?.isOff ? '返回' : '' }}</a-button
            >
            <a-button
              type="link"
              size="small"
              class="mt-2 mr-2 enter-x"
              :disabled="loading"
              @click="goLogin"
            >
              {{ t('sys.lock.backToLogin') }}
            </a-button>
            <a-button class="mt-2" type="link" size="small" @click="unLock()" :loading="loading">
              {{ t('sys.lock.entry') }}
            </a-button>
          </div>
        </div>
      </div>
    </transition>

    <div class="absolute bottom-5 w-full text-gray-300 xl:text-xl 2xl:text-3xl text-center enter-y">
      <div class="text-5xl mb-4 enter-x" v-show="!showDate">
        {{ hour }}:{{ minute }}:{{ second }} <span class="text-3xl">{{ meridiem }}</span>
      </div>
      <div class="text-3xl">{{ year }}年{{ month }}月{{ day }}日 {{ week }}</div>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { Input } from 'ant-design-vue';
  import { useUserStore } from '@/store/modules/user';
  import { useMfaStore } from '@/store/modules/mfa';
  import { useI18n } from '@/hooks/web/useI18n';
  import { useNow } from './useNow';
  import { useDesign } from '@/hooks/web/useDesign';
  import headerImg from '@/assets/images/header.jpg';
  import { useGlobSetting } from '@/hooks/setting';

  const InputPassword = Input.Password;

  const password = ref('');
  const loading = ref(false);
  const errMsg = ref('');
  const showDate = ref(false);

  const { prefixCls } = useDesign('lock-page');
  const mfaStore = useMfaStore();
  const userStore = useUserStore();
  const mfaInfo = mfaStore.getMfaInfo;
  const title = ref(mfaStore.mfaInfo.title);

  const { second, hour, month, minute, meridiem, year, day, week } = useNow(true);

  const { t } = useI18n();

  const userinfo = computed(() => {
    return userStore.getUserInfo || {};
  });

  /**
   * @description: unLock
   */
  async function unLock() {
    errMsg.value = '';
    if (!password.value) {
      errMsg.value = '请输入六位动态密码';
      return;
    }
    if (!/\d{6}/.test(password.value)) {
      errMsg.value = '请输入六位动态密码';
      return;
    }
    let pwd = password.value;
    try {
      loading.value = true;
      const isOk = await mfaStore.checkMFA(pwd);
      if (!isOk) {
        if (!mfaStore.getMfaInfo?.exist_mfa) {
          errMsg.value = '您还未绑定MFA设备，请先完成绑定';
        } else {
          errMsg.value = '动态密码错误，请重新输入';
        }
      }
    } finally {
      loading.value = false;
    }
  }

  function goLogin() {
    userStore.logout(true);
    mfaStore.resetMfaInfo();
  }

  function handleBuildMfa() {
    // 获取配置
    const globSetting = useGlobSetting();
    if (!userinfo.value?.exist_mfa) {
      window.open(globSetting.apiUrl + userinfo.value?.build_mfa_url, '_blank');
    } else {
      if (mfaInfo?.isOff) {
        mfaStore.setMfaInfo({ isTwoStepVerification: false });
      }
    }
  }

  // function handleShowForm(show = false) {
  //   showDate.value = show;
  // }
</script>
<style lang="less" scoped>
  @prefix-cls: ~'@{namespace}-lock-page';

  .@{prefix-cls} {
    z-index: @lock-page-z-index;

    &__unlock {
      transform: translate(-50%, 0);
    }

    &__hour,
    &__minute {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 30px;
      background-color: #141313;
      color: #bababa;
      font-weight: 700;

      @media screen and (max-width: @screen-md) {
        span:not(.meridiem) {
          font-size: 160px;
        }
      }

      @media screen and (min-width: @screen-md) {
        span:not(.meridiem) {
          font-size: 160px;
        }
      }

      @media screen and (max-width: @screen-sm) {
        span:not(.meridiem) {
          font-size: 90px;
        }
      }

      @media screen and (min-width: @screen-lg) {
        span:not(.meridiem) {
          font-size: 220px;
        }
      }

      @media screen and (min-width: @screen-xl) {
        span:not(.meridiem) {
          font-size: 260px;
        }
      }

      @media screen and (min-width: @screen-2xl) {
        span:not(.meridiem) {
          font-size: 320px;
        }
      }
    }

    &-entry {
      display: flex;
      position: absolute;
      top: 0;
      left: 0;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);

      &-content {
        width: 260px;
      }

      &__header {
        text-align: center;

        &-img {
          width: 70px;
          margin: 0 auto;
          border-radius: 50%;
        }

        &-name {
          margin-top: 5px;
          color: #bababa;
          font-weight: 500;
        }
      }

      &__err-msg {
        display: inline-block;
        margin-top: 10px;
        color: @error-color;
      }

      &__footer {
        display: flex;
        justify-content: space-between;
      }
    }
  }
</style>
