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
                <AButton type="primary" @click="handleCopyBuildSecretKeyUrl(model[field])">
                  复制地址
                </AButton>
              </Tooltip>
            </div>
          </template>
        </BasicForm>
      </Col>
      <Col :span="10">
        <div class="change-avatar">
          <div class="mb-2">头像</div>
          <CropperAvatar
            :uploadApi="uploadApi as any"
            :value="avatar"
            btnText="更换头像"
            :btnProps="{ preIcon: 'ant-design:cloud-upload-outlined' }"
            @change="updateAvatar"
            width="150"
          />
        </div>
      </Col>
    </Row>
    <AButton type="primary" style="margin-top: 20px; margin-left: 150px" @click="handleSubmit">
      更新基本信息
    </AButton>
  </CollapseContainer>
</template>

<script setup lang="ts">
  import { Tooltip, Col, Row } from 'ant-design-vue';
  import { computed, onMounted, ref } from 'vue';
  import { BasicForm, FormSchema, useForm } from '@/components/Form/index';
  import { CollapseContainer } from '@/components/Container';
  import { CropperAvatar } from '@/components/Cropper';
  import headerImg from '@/assets/images/header.jpg';
  import { useUserStore } from '@/store/modules/user';
  import { uploadApi } from '@/api/sys/upload';
  import { copyText } from '@/utils/copyTextToClipboard';
  import { useGlobSetting } from '@/hooks/setting';
  import { HashingFactory } from '@/utils/cipher';
  import { updateMine, updateAvatar as updateAvatarApi } from '@/api/admin/system';
  import { responseNotify } from '@/api/api';
  import { MfaInfo, UserInfo } from '#/store';
  import { AccountModel } from '@/api/admin/model/systemModel';
  import { CheckMfaScenariosEnum } from '@/enums/checkMfaScenariosEnum';
  import { useMfaStore } from '@/store/modules/mfa';
  import { usePermission } from '@/hooks/web/usePermission';

  const { isCheckMfa } = usePermission();

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
    {
      label: '备注',
      field: 'remark',
      helpMessage: ['最多输入255个字符'],
      component: 'InputTextArea',
      dynamicDisabled: true,
      componentProps: {
        placeholder: '请输入备注信息, 最多输入255个字符',
        showCount: true,
        maxlength: 255,
        id: 'form_item_remark_edit',
      },
      colProps: { span: 18 },
      rules: [{ max: 255, message: '最多输入255个字符' }],
    },
  ];

  const userStore = useUserStore();
  const userinfo = ref<UserInfo>(userStore.getUserInfo);

  const [register, { setFieldsValue, validate }] = useForm({
    labelWidth: 120,
    schemas: form,
    showActionButtonGroup: false,
  });

  onMounted(async () => {
    userinfo.value = (await userStore.getMineAction()) as UserInfo;
    if (userinfo.value) {
      await setFieldsValue(userinfo.value);
    }
  });

  const avatar = computed(() => {
    const { avatar } = userStore.getUserInfo;
    return avatar || headerImg;
  });

  function updateAvatar(e) {
    // console.log('data', e);
    if (e.data) {
      // 发起请求
      updateAvatarApi(e.data).then((res) => {
        responseNotify(res, true);
        userinfo.value.avatar = e.data;
        userStore.setUserInfo(userinfo.value);
      });
    }
  }

  async function handleSubmit() {
    const values = await validate();
    if (values.password) {
      values.password = HashingFactory.createMD5Hashing().hash(values.password);
    }
    const afterAction = (param) => {
      // 赋值两步验证参数
      values.twoStepKey = param?.twoStepKey;
      values.twoStepValue = param?.twoStepValue;

      // 发起请求
      updateMine(values as AccountModel)
        .then((res) => {
          responseNotify(res, true);
          userStore.getMineAction();
        })
        .catch((e) => {
          // 错误信息
          console.log('@@@ handleSubmit', e);
        });
    };

    if (isCheckMfa(CheckMfaScenariosEnum.EDIT_USER)) {
      const mfaInfo: MfaInfo = useMfaStore().getMfaInfo;

      // 先设置标题， 和执行方法，当返回10006的时候可以直接弹框校验
      mfaInfo.title = '修改账号信息，请先验证身份';
      mfaInfo.scenarios = CheckMfaScenariosEnum.EDIT_USER; // 5 添加用户
      mfaInfo.isOff = true; // 打开身份验证页面
      useMfaStore().setMfaInfo(mfaInfo); // 修改MfaInfo
      useMfaStore().afterSuccessVerify = afterAction; // 设置验证完后的操作
      useMfaStore().openVerify(); // 打开验证
    } else {
      afterAction(null);
    }
  }

  function handleCopyBuildSecretKeyUrl(url) {
    const globSetting = useGlobSetting();
    let currentDomain = window.location.origin;
    copyText(currentDomain + globSetting.apiUrl + url);
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
