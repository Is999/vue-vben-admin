<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    title="修改当前用户密码"
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
      <h4></h4>
      <p>1. 修改成功后会自动退出当前登录。 </p>
    </div>
  </BasicDrawer>
</template>

<script setup lang="ts">
  import { Divider } from 'ant-design-vue';
  import { SoundTwoTone } from '@ant-design/icons-vue';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import { BasicForm, FormSchema, useForm } from '@/components/Form';
  import { updaetePassword } from '@/api/admin/system';
  import { useUserStore } from '@/store/modules/user';
  import { notify } from '@/api/api';
  import { HashingFactory } from '@/utils/cipher';
  import { checkChars, containSpecialChars } from '@/utils/passport';
  import { updatePasswordParams } from '@/api/admin/model/systemModel';
  import { MfaInfo } from '#/store';
  import { useMfaStore } from '@/store/modules/mfa';

  const formSchema: FormSchema[] = [
    {
      field: 'passwordOld',
      label: '当前密码',
      component: 'InputPassword',
      rules: [
        {
          required: true,
          // @ts-ignore
          validator: async (rule, value) => {
            if (!value) {
              return Promise.reject('请输入密码');
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
      field: 'passwordNew',
      label: '新密码',
      component: 'StrengthMeter',
      componentProps: {
        placeholder: '新密码',
      },
      rules: [
        {
          required: true,
          // @ts-ignore
          validator: async (rule, value) => {
            if (!value) {
              return Promise.reject('请输入密码');
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
      field: 'confirmPassword',
      label: '确认密码',
      component: 'InputPassword',
      dynamicRules: ({ values }) => {
        return [
          {
            required: true,
            validator: (_, value) => {
              if (!value) {
                return Promise.reject('请输入确认密码');
              }
              if (value !== values.passwordNew) {
                return Promise.reject('两次输入的密码不一致!');
              }
              return Promise.resolve();
            },
          },
        ];
      },
    },
  ];

  const [register, { validate, resetFields }] = useForm({
    size: 'large',
    labelWidth: 100,
    showActionButtonGroup: false,
    schemas: formSchema,
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async () => {
    try {
      setDrawerProps({ loading: true }); // loading
      await resetFields(); // 重置
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
      setDrawerProps({ loading: true });
      // 赋值
      values.twoStepKey = param?.twoStepKey;
      values.twoStepValue = param?.twoStepValue;

      const md5 = HashingFactory.createMD5Hashing();
      values.passwordOld = md5.hash(values.passwordOld);
      values.passwordNew = md5.hash(values.passwordNew);
      values.confirmPassword = md5.hash(values.confirmPassword);
      // const { passwordOld, passwordNew } = values;
      // console.log('@@@ password', passwordOld, passwordNew);

      // 修改密码
      updaetePassword(values as updatePasswordParams)
        .then((res) => {
          notify(res, true);
          closeDrawer();
          setTimeout(() => {
            const userStore = useUserStore();
            userStore.logout(true);
          }, 1500);
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

    const userStore = useUserStore();
    if (userStore.getUserInfo?.mfa_status !== 0) {
      const mfaInfo: MfaInfo = useMfaStore().getMfaInfo;

      // 先设置标题， 和执行方法，当返回10006的时候可以直接弹框校验
      mfaInfo.title = '修改密码，请先验证身份';
      mfaInfo.scenarios = 1; // 1 修改密码
      mfaInfo.isOff = true; // 打开身份验证页面
      useMfaStore().setMfaInfo(mfaInfo); // 修改MfaInfo
      useMfaStore().afterSuccessVerify = afterAction; // 设置验证完后的操作
      useMfaStore().openVerify(); // 打开验证
    } else {
      afterAction(null);
    }
  }
</script>
