<template>
  <!-- 登录title -->
  <LoginFormTitle v-show="true" class="enter-x" />
  <BasicForm @register="register" class="p-4 enter-x">
    <template #captcha="{ model, field }">
      <InputGroup>
        <div class="flex justify-center">
          <Input
            class="mr-2"
            type="text"
            name="captcha"
            :maxlength="4"
            v-model:value="model[field]"
            :placeholder="t('sys.login.code')"
          >
            <template #addonBefore>
              <SafetyOutlined class="site-form-item-icon" />
            </template>
          </Input>
          <div style="min-width: 100px">
            <img
              :src="formData.img"
              style="float: right; cursor: pointer; object-fit: cover"
              @click="handleCaptchaApi()"
              alt=""
            />
          </div>
        </div>
      </InputGroup>
    </template>
    <template #secureCode="{ model, field }">
      <InputGroup>
        <div class="flex justify-center">
          <Input
            class="mr-2"
            type="text"
            name="secureCode"
            :maxlength="6"
            v-model:value="model[field]"
            :placeholder="t('sys.login.secureCode')"
          >
            <template #addonBefore>
              <InsuranceTwoTone class="site-form-item-icon" />
            </template>
          </Input>
          <div style="min-width: 100px">
            <a @click="handleBuildMFASecret()" style="line-height: 41px">没有？去绑定！</a>
          </div>
        </div>
      </InputGroup>
    </template>
    <template #submit="{}">
      <Button type="primary" block @click="handleLogin" :loading="loading">
        {{ t('sys.login.loginButton') }}
      </Button>
    </template>
  </BasicForm>
</template>
<script lang="ts" setup>
  import { reactive, ref, onMounted, h } from 'vue';
  import { Button, Input, InputGroup } from 'ant-design-vue';
  import {
    UserOutlined,
    LockOutlined,
    SafetyOutlined,
    InsuranceTwoTone,
  } from '@ant-design/icons-vue';
  import LoginFormTitle from './LoginFormTitle.vue';

  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form/index';
  import { useUserStore } from '/@/store/modules/user';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { captchaApi } from '/@/api/api';
  import { encryptByMd5 } from '/@/utils/cipher';
  import { buildSecretVerifyAccount } from '/@/api/sys/user';
  import { useGlobSetting } from '@/hooks/setting';
  import { checkChars, containSpecialChars } from '@/utils/passport';

  const { t } = useI18n();
  const { notification, createErrorModal, createMessage, createConfirm } = useMessage();
  const { prefixCls } = useDesign('login');
  const userStore = useUserStore();
  const loading = ref(false);
  const isLogin = ref(true);

  const formData = reactive({
    name: '',
    password: '',
    key: '',
    img: '---',
    captcha: '',
    secureCode: '',
  });

  const schemas: FormSchema[] = [
    {
      field: 'name',
      component: 'Input',
      label: '',
      colProps: {
        // span: 24,
      },
      componentProps: {
        maxlength: 20,
        type: 'text',
        addonBefore: h(UserOutlined),
        placeholder: t('sys.login.name'),
      },
      rules: [
        {
          required: true,
          // @ts-ignore
          validator: async (rule, value) => {
            if (!value) {
              /* eslint-disable-next-line */
              return Promise.reject(t('sys.login.namePlaceholder'));
            }
            if (!/^[A-Za-z0-9]{6,20}$/.test(value)) {
              /* eslint-disable-next-line */
              return Promise.reject('账号为6-20个字母加数字组成');
            }
            return Promise.resolve();
          },
          trigger: 'change',
        },
      ],
    },
    {
      field: 'password',
      component: 'InputPassword',
      label: '',
      colProps: {
        // span: 24,
      },
      componentProps: {
        maxlength: 20,
        type: 'text',
        allowClear: false,
        addonBefore: h(LockOutlined),
        placeholder: t('sys.login.password'),
      },
      rules: [
        {
          required: true,
          // @ts-ignore
          validator: async (rule, value) => {
            if (!value) {
              /* eslint-disable-next-line */
              return Promise.reject(t('sys.login.passwordPlaceholder'));
            }
            // if (!/^[A-Za-z0-9@]{6,20}$/.test(value)) {
            //   /* eslint-disable-next-line */
            //   return Promise.reject('密码为6-20个字母加数字组成');
            // }
            if (value.length < 8 || value.length > 20) {
              return Promise.reject('密码为8-20个字母、数字、特殊字符组成');
            }
            if (!value.match(/[A-Z]/)) {
              return Promise.reject('密码必须包含大写字母');
            }
            if (!value.match(/[a-z]/)) {
              return Promise.reject('密码必须包含小写字母');
            }
            if (!value.match(/[0-9]/)) {
              return Promise.reject('密码必须包含数字');
            }
            if (!containSpecialChars(value)) {
              return Promise.reject('密码必须包含特殊字符');
            }
            if (!checkChars(value)) {
              return Promise.reject('密码由大写字母、小写字母、数字、特殊字符组成');
            }
            return Promise.resolve();
          },
          trigger: 'change',
        },
      ],
    },
    {
      field: 'captcha',
      component: 'Input',
      label: '',
      defaultValue: formData.captcha,
      colProps: {
        // span: 24,
      },
      slot: 'captcha',
      componentProps: {
        maxlength: 4,
        type: 'text',
        allowClear: false,
        placeholder: t('sys.login.code'),
      },
      rules: [
        {
          required: true,
          // @ts-ignore
          validator: async (rule, value) => {
            if (!value) {
              /* eslint-disable-next-line */
              return Promise.reject(t('sys.login.codePlaceholder'));
            }
            if (!/[A-Za-z0-9]{4}/.test(value)) {
              /* eslint-disable-next-line */
              return Promise.reject(t('sys.login.codePlaceholder'));
            }
            return Promise.resolve();
          },
          trigger: 'change',
        },
      ],
    },
    // {
    //   field: 'secureCode',
    //   component: 'Input',
    //   label: '',
    //   defaultValue: formData.secureCode,
    //   colProps: {
    //     // span: 24,
    //   },
    //   slot: 'secureCode',
    //   componentProps: {
    //     maxlength: 6,
    //     type: 'text',
    //     allowClear: false,
    //     addonBefore: h(InsuranceTwoTone),
    //     addonAfter: h(
    //       'a',
    //       {
    //         onClick: () => handleBuildMFASecret(),
    //       },
    //       '还没有？去绑定吧！',
    //     ),
    //     placeholder: t('sys.login.secureCode'),
    //   },
    //   rules: [
    //     {
    //       required: true,
    //       // @ts-ignore
    //       validator: async (rule, value) => {
    //         if (!isLogin.value) {
    //           return Promise.resolve();
    //         }
    //         if (!value) {
    //           /* eslint-disable-next-line */
    //           return Promise.reject(t('sys.login.secureCode'));
    //         }
    //         if (!/\d{6}/.test(value)) {
    //           /* eslint-disable-next-line */
    //           return Promise.reject(t('sys.login.secureCodePlaceholder'));
    //         }
    //         return Promise.resolve();
    //       },
    //       trigger: 'change',
    //     },
    //   ],
    // },
    {
      field: 'submit',
      component: 'Input',
      label: '',
      slot: 'submit',
      colProps: {
        // span: pc.isMobile ? 24 : 16,
      },
    },
  ];

  const [register, { validate }] = useForm({
    labelWidth: '0',
    schemas,
    size: 'large',
    actionColOptions: {
      span: 24,
    },
    baseColProps: {
      span: 24,
    },
    showResetButton: false,
    showSubmitButton: false,
    // submitButtonOptions: {
    //   text: '登录',
    // },
  });

  // 登录
  async function handleLogin() {
    try {
      isLogin.value = true;
      const data = await validate(); // 验证参数
      try {
        loading.value = true;
        const userInfo = await userStore.login({
          password: encryptByMd5(data.password),
          name: data.name,
          captcha: data.captcha,
          key: formData.key,
          secureCode: data.secureCode,
          mode: 'none', //不要默认的错误提示
        });
        if (userInfo) {
          notification.success({
            message: t('sys.login.loginSuccessTitle'),
            description: `${t('sys.login.loginSuccessDesc')}: ${userInfo.real_name}`,
            duration: 3,
          });
        }
      } catch (error) {
        createErrorModal({
          title: t('sys.api.errorTip'),
          content: (error as Error)?.message || t('sys.api.networkExceptionMsg'),
          getContainer: () => document.body.querySelector(`.${prefixCls}`) || document.body,
        });
      } finally {
        loading.value = false;
      }
    } catch (error) {
      console.log('not passing', error);
      return;
    }
  }

  async function handleBuildMFASecret() {
    try {
      //clearValidate(); // 清除验证信息
      isLogin.value = false;
      const data = await validate(); // 验证参数
      if (!data) return false;
      try {
        const result = await buildSecretVerifyAccount(
          {
            password: encryptByMd5(data.password),
            name: data.name,
            captcha: data.captcha,
            key: formData.key,
          },
          'none',
        );
        const { user } = result;

        // 刷新验证码
        formData.captcha = '';
        await handleCaptchaApi();

        // 获取配置
        const globSetting = useGlobSetting();

        if (!user.exist_mfa) {
          window.open(globSetting.apiUrl + user.build_mfa_url, '_blank');
        } else {
          createConfirm({
            onOk: () => {
              window.open(globSetting.apiUrl + user.build_mfa_url, '_blank');
            },
            iconType: 'warning',
            title: '注意',
            content:
              '您已绑定过安全码，是否需要重新绑定？<h5 style="color:red; display: block; float: right; margin-right: 5px">点击确认按钮去绑定！</h5>',
          });
        }
      } catch (error) {
        createErrorModal({
          title: t('sys.api.errorTip'),
          content: (error as Error)?.message || t('sys.api.networkExceptionMsg'),
          getContainer: () => document.body.querySelector(`.${prefixCls}`) || document.body,
        });
      }
    } catch (error) {
      console.log('not passing', error);
      return;
    }
  }

  // 验证码
  async function handleCaptchaApi() {
    try {
      const captcha = await captchaApi();
      if (captcha) {
        formData.key = captcha.key;
        formData.img = captcha.img;
      }
    } catch (error) {
      createMessage.error((error as Error)?.message);
    }
  }

  // 挂载请求一次验证码
  onMounted(() => {
    handleCaptchaApi();
  });
</script>
