<template>
  <CollapseContainer title="基本设置" :canExpan="false">
    <Row :gutter="24">
      <Col :span="14">
        <BasicForm @register="register">
          <template #buildSecretKeyUrl="{ model, field }">
            <div style="float: right">
              <a :href="model[field]" target="_blank" style="margin-right: 20px"
                >点击此处，去绑定Google安全码</a
              >
              <Tooltip title="复制地址" placement="bottom">
                <Button type="primary" @click="handleCopyBuildSecretKeyUrl(model[field])">
                  复制地址
                </Button>
              </Tooltip>
            </div>
          </template>
        </BasicForm>
      </Col>
      <Col :span="10">
        <div class="change-avatar">
          <div class="mb-2">头像</div>
          <CropperAvatar
            :uploadApi="uploadApi"
            :value="avatar"
            btnText="更换头像"
            :btnProps="{ preIcon: 'ant-design:cloud-upload-outlined' }"
            @change="updateAvatar"
            width="150"
          />
        </div>
      </Col>
    </Row>
    <Button type="primary" style="margin-top: 20px; margin-left: 150px" @click="handleSubmit">
      更新基本信息
    </Button>
  </CollapseContainer>
</template>

<script setup lang="ts">
  import { Button, Tooltip, Col, Row } from 'ant-design-vue';
  import { computed, onMounted, ref, unref } from 'vue';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form/index';
  import { CollapseContainer } from '/@/components/Container';
  import { CropperAvatar } from '/@/components/Cropper';
  import { useMessage } from '/@/hooks/web/useMessage';

  import headerImg from '/@/assets/images/header.jpg';
  import { useUserStore } from '/@/store/modules/user';
  import { uploadApi } from '/@/api/sys/upload';
  import { useCopyToClipboard } from '/@/hooks/web/useCopyToClipboard';
  import { useGlobSetting } from '/@/hooks/setting';
  import { encryptByMd5 } from '/@/utils/cipher';
  import { accountEdit } from '/@/api/admin/system';
  import { notify } from '/@/api/api';
  import { UserInfo } from '/#/store';

  const { clipboardRef, copiedRef } = useCopyToClipboard();

  // 基础设置 form
  const form: FormSchema[] = [
    {
      field: 'name',
      label: '账号',
      component: 'Input',
      dynamicDisabled: true,
      defaultValue: '',
      componentProps: {
        maxlength: 20,
        placeholder: '请输入账号',
        id: 'form_item_name_edit',
      },
      colProps: { span: 18 },
      rules: [
        {
          required: true,
          // @ts-ignore
          validator: async (rule, value) => {
            if (!value) {
              /* eslint-disable-next-line */
              return Promise.reject('请输入账号');
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
      field: 'real_name',
      label: '真实姓名',
      component: 'Input',
      defaultValue: '',
      componentProps: {
        maxlength: 20,
        placeholder: '请输入真实姓名',
        id: 'form_item_real_name_edit',
      },
      colProps: { span: 18 },
      rules: [
        {
          required: true,
          // @ts-ignore
          validator: async (rule, value) => {
            if (!value) {
              /* eslint-disable-next-line */
              return Promise.reject('请输入真实姓名');
            }
            if (value.length < 2 || value.length > 20) {
              /* eslint-disable-next-line */
              return Promise.reject('真实姓名为2-20个字母');
            }
            return Promise.resolve();
          },
          trigger: 'change',
        },
      ],
    },
    {
      field: 'email',
      label: '邮箱',
      component: 'Input',
      defaultValue: '',
      componentProps: {
        placeholder: '请输入邮箱',
        id: 'form_item_email_edit',
      },
      colProps: { span: 18 },
      rules: [
        {
          required: true,
          // @ts-ignore
          validator: async (rule, value) => {
            if (!value) {
              /* eslint-disable-next-line */
              return Promise.reject('请输入账号');
            }
            if (
              !/^[a-z0-9A-Z]+([-_.][a-z0-9A-Z]+)*@[a-z0-9A-Z]+([-_][a-z0-9A-Z]+)*(\.[a-zA-Z]{2,4}){1,2}$/.test(
                value,
              )
            ) {
              /* eslint-disable-next-line */
              return Promise.reject('请输入正确的邮箱格式');
            }
            return Promise.resolve();
          },
          trigger: 'change',
        },
      ],
    },
    {
      field: 'phone',
      label: '手机号',
      component: 'Input',
      required: true,
      defaultValue: '',
      componentProps: {
        maxlength: 11,
        placeholder: '请输入手机号',
        id: 'form_item_phone_edit',
      },
      rules: [
        {
          required: true,
          // @ts-ignore
          validator: async (rule, value) => {
            if (!value) {
              /* eslint-disable-next-line */
              return Promise.reject('请输入手机号');
            }
            if (!/^1[3-9]\d{9}$/.test(value)) {
              /* eslint-disable-next-line */
              return Promise.reject('请输入正确的手机号格式');
            }
            return Promise.resolve();
          },
          trigger: 'change',
        },
      ],
      colProps: { span: 18 },
    },
    // {
    //   field: 'password',
    //   label: '密码',
    //   component: 'InputPassword',
    //   componentProps: {
    //     maxlength: 20,
    //     placeholder: '请输入密码',
    //     id: 'form_item_password_edit',
    //   },
    //   rules: [
    //     {
    //       // @ts-ignore
    //       validator: async (rule, value) => {
    //         if (!value) {
    //           /* eslint-disable-next-line */
    //             return Promise.resolve();
    //         }
    //         if (!/^[A-Za-z0-9@]{6,20}$/.test(value)) {
    //           /* eslint-disable-next-line */
    //             return Promise.reject('密码为6-20个字母加数字组成');
    //         }
    //         return Promise.resolve();
    //       },
    //       trigger: 'change',
    //     },
    //   ],
    //   colProps: { span: 18 },
    // },
    // {
    //   field: 'secure_key',
    //   label: '安全码',
    //   helpMessage: ['Google安全码秘钥，可以在登录的时候绑定'],
    //   component: 'Input',
    //   componentProps: {
    //     maxlength: 16,
    //     placeholder: '请输入要绑定的Google安全码秘钥',
    //     id: 'form_item_secure_key',
    //   },
    //   rules: [
    //     {
    //       // @ts-ignore
    //       validator: async (rule, value) => {
    //         if (!value) {
    //           /* eslint-disable-next-line */
    //             return Promise.resolve();
    //         }
    //         if (!/^[A-Za-z0-9]{16}$/.test(value)) {
    //           /* eslint-disable-next-line */
    //             return Promise.reject('安全码秘钥为16位字符串');
    //         }
    //         return Promise.resolve();
    //       },
    //       trigger: 'change',
    //     },
    //   ],
    //   colProps: { span: 18 },
    // },
    // {
    //   field: 'build_secure_key_url',
    //   label: '',
    //   component: 'Input',
    //   slot: 'buildSecretKeyUrl',
    //   colProps: { span: 18 },
    // },
    {
      label: '备注',
      field: 'remark',
      helpMessage: ['最多输入255个字符'],
      component: 'InputTextArea',
      componentProps: {
        placeholder: '请输入备注信息, 最多输入255个字符',
        showCount: true,
        maxlength: 255,
      },
      colProps: { span: 18 },
      rules: [{ max: 255, message: '最多输入255个字符' }],
    },
  ];

  const { createMessage } = useMessage();
  const userStore = useUserStore();
  const userinfo = ref<UserInfo>(userStore.getUserInfo);

  const [register, { setFieldsValue, validate }] = useForm({
    labelWidth: 120,
    schemas: form,
    showActionButtonGroup: false,
  });

  onMounted(async () => {
    userinfo.value = (await userStore.getMineAction()) as UserInfo;
    if (userinfo.value != null) {
      setFieldsValue(userinfo.value);
    }
  });

  const avatar = computed(() => {
    const { avatar } = userStore.getUserInfo;
    return avatar || headerImg;
  });

  function updateAvatar(src: string) {
    userinfo.value.avatar = src;
    userStore.setUserInfo(userinfo.value);
  }

  async function handleSubmit() {
    const values = await validate();
    try {
      if (values.password) {
        values.password = encryptByMd5(values.password);
      }

      // 发起请求
      await accountEdit(userinfo.value.id, values).then((res) => {
        notify(res, true);
      });

      // 更新信息
      await userStore.getMineAction();
    } catch (e) {
      createMessage.success('更新失败！');
    }
  }

  function handleCopyBuildSecretKeyUrl(url) {
    const globSetting = useGlobSetting();
    let currentDomain = window.location.origin;
    clipboardRef.value = currentDomain + globSetting.apiUrl + url;
    if (unref(copiedRef)) {
      createMessage.success('copy success！');
    }
  }
</script>

<style lang="less" scoped>
  .change-avatar {
    img {
      display: block;
      margin-bottom: 15px;
      border-radius: 50%;
    }
  }
</style>
