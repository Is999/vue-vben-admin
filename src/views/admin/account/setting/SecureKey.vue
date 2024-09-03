<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :title="title"
    :isDetail="true"
    @ok="handleSubmit"
  >
    <div class="py-8 bg-white flex flex-col justify-center items-center">
      <BasicForm @register="register" />
      <!-- <div class="flex justify-center">
              <a-button @click="resetFields"> 重置 </a-button>
              <a-button class="!ml-4" type="primary" @click="handleSubmit"> 确认 </a-button>
            </div>-->
    </div>
    <Divider />
    <div>
      <h3><SoundTwoTone twoToneColor="#eb2f96" /> 说明</h3>
      <h4>1. MFA秘钥</h4>
      <p style="margin-left: 1em; color: #7c8087; font-size: 12px">
        MFA秘钥是指身份验证器绑定的秘钥（TOTP MFA 应用程序）<br />
        - TOTP：基于时间的动态密码；<br />
        - MFA：多重身份验证，如两步验证（2FA），常用于登录或其它敏感操作的身份验证；<br />
        - 常用的身份验证器APP(基于时间的动态密码 (TOTP) 多重身份验证 (MFA))：Google
        Authenticator、Microsoft Authenticator、Authing令牌、宁盾令牌 ......，可在应用市场搜索下载
      </p>
      <p>
        <span id="buildSecretKeyUrl">
          如若没有 MFA秘钥，<a :href="buildMFAUrl" target="_blank">点击此处去绑定</a>。
          <Tooltip title="复制地址到粘贴板" placement="top">
            <a @click="handleCopyBuildSecretKeyUrl" style="color: #0cc00c"
              ><strong>复制地址到粘贴板</strong> </a
            >，请直接使用Ctr+v或Command+v粘贴。
          </Tooltip>
        </span>
      </p>
    </div>
  </BasicDrawer>
</template>

<script setup lang="ts">
  import { Tooltip, Divider } from 'ant-design-vue';
  import { SoundTwoTone } from '@ant-design/icons-vue';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import { BasicForm, FormSchema, useForm } from '@/components/Form';
  import { updateMFASecureKey } from '@/api/admin/system';
  import { useUserStore } from '@/store/modules/user';
  import { responseNotify } from '@/api/api';
  import { useGlobSetting } from '@/hooks/setting';
  import { ref } from 'vue';
  import { copyText } from '@/utils/copyTextToClipboard';
  import { MfaInfo } from '#/store';
  import { useMfaStore } from '@/store/modules/mfa';
  import { CheckMfaScenariosEnum } from '@/enums/checkMfaScenariosEnum';
  import { usePermission } from '@/hooks/web/usePermission';

  const { isCheckMfa } = usePermission();
  const userStore = useUserStore();
  const globSetting = useGlobSetting();
  const title = ref('修改MFA设备秘钥');
  const buildMFAUrl = ref(globSetting.apiUrl + userStore.getUserInfo?.build_mfa_url);
  const formSchema: FormSchema[] = [
    {
      field: 'mfa_secure_key',
      label: '',
      component: 'Input',
      componentProps: {
        maxlength: 16,
        placeholder: '请输入要绑定的MFA秘钥',
      },
      rules: [
        {
          required: true,
          // @ts-ignore
          validator: async (rule, value) => {
            if (!/^[A-Za-z0-9]{16}$/.test(value)) {
              return Promise.reject('秘钥为16位字符串');
            }
            return Promise.resolve();
          },
          trigger: 'change',
        },
      ],
      colProps: { style: { width: '300px' } },
    },
  ];

  const [register, { validate, resetFields }] = useForm({
    size: 'large',
    labelWidth: 0,
    showActionButtonGroup: false,
    schemas: formSchema,
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      if (!data?.exist_mfa) {
        title.value = '绑定MFA设备秘钥';
      }
      setDrawerProps({ loading: true }); // loading
      await resetFields(); // 重置
      await userStore.getMineAction().then((userinfo) => {
        if (userinfo != null) {
          buildMFAUrl.value = globSetting.apiUrl + userinfo?.build_mfa_url;
          //setFieldsValue(userinfo);
        }
      });
    } catch (e) {
      // 错误信息
      console.log('@@@ useDrawerInner', e);
    } finally {
      setDrawerProps({ loading: false }); // loading
    }
  });

  // 提交
  async function handleSubmit() {
    const values = await validate();

    const afterAction = (param) => {
      // 设置加载
      setDrawerProps({ loading: true });

      // 赋值两步验证参数
      values.twoStepKey = param?.twoStepKey;
      values.twoStepValue = param?.twoStepValue;

      // 修改安全码
      updateMFASecureKey(values)
        .then((res) => {
          // 提示信息
          responseNotify(res, true);
          // 关闭抽屉
          closeDrawer();
        })
        .catch((e) => {
          // 错误信息
          console.log('@@@ handleSubmit', e);
        })
        .finally(() => {
          // 关闭加载
          setDrawerProps({ loading: false });
        });
    };

    if (
      userStore.getUserInfo?.mfa_status !== 0 &&
      isCheckMfa(CheckMfaScenariosEnum.MFA_SECURE_KEY)
    ) {
      const mfaInfo: MfaInfo = useMfaStore().getMfaInfo;

      // 先设置标题， 和执行方法，当返回10006的时候可以直接弹框校验
      mfaInfo.title = '修改MFA设备秘钥，请先验证身份';
      mfaInfo.scenarios = CheckMfaScenariosEnum.MFA_SECURE_KEY; // 3 修改MFA秘钥
      mfaInfo.isOff = true; // 打开身份验证页面
      useMfaStore().setMfaInfo(mfaInfo); // 修改MfaInfo
      useMfaStore().afterSuccessVerify = afterAction; // 设置验证完后的操作
      useMfaStore().openVerify(); // 打开验证
    } else {
      afterAction(null);
    }
  }

  function handleCopyBuildSecretKeyUrl() {
    let currentDomain = window.location.origin;
    copyText(currentDomain + buildMFAUrl.value);
  }
</script>
