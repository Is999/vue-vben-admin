<template>
  <div class="step1">
    <div class="step1-form">
      <BasicForm @register="register" autocomplete="off">
        <template #pwd="{ model, field }">
          <div class="flex justify-center">
            <InputPassword
              autocomplete="new-password"
              placeholder="请输入密码"
              :maxlength="20"
              v-model:value="model[field]"
              :allowClear="true"
            />
            <Tooltip title="生成密码并复制" placement="bottom">
              <Button type="primary" @click="handleCopy(model, field)"> 复制 </Button>
            </Tooltip>
          </div>
        </template>
      </BasicForm>
    </div>
    <Divider />
    <div>
      <h3><SoundTwoTone twoToneColor="#eb2f96" /> 说明</h3>
      <h4>1. 密码</h4>
      <p>
        密码为空值时，点击复制按钮可生产新的密码并复制到剪切板。也可以点击此处
        <Tooltip title="生成新的密码并复制" placement="top">
          <a @click="handleClick" style="color: #0cc00c"><strong>生成新的密码</strong></a>
        </Tooltip>
        。
      </p>
      <h4>2. 安全秘钥</h4>
      <p>
        Google安全秘钥可以在登录页面绑定，也可以让用户提供已有的秘钥进行绑定。或者添加完账号后进入编辑页面生成绑定安全秘钥地址，提供生成的地址给用户去绑定。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { unref } from 'vue';
  import { BasicForm, useForm, FormSchema } from '/@/components/Form';
  import { Tooltip, Divider, Button, InputPassword } from 'ant-design-vue';
  import { SoundTwoTone } from '@ant-design/icons-vue';
  import { accountAdd } from '/@/api/admin/system';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { PermissionsEnum } from '/@/enums/permissionsEnum';
  import { useCopyToClipboard } from '/@/hooks/web/useCopyToClipboard';
  import { checkChars, containSpecialChars, generate } from '/@/utils/passport';
  import { notify } from '/@/api/api';
  import { encryptByMd5 } from '/@/utils/cipher';

  const emit = defineEmits(['next']);

  const { hasPermission } = usePermission();
  const { createMessage } = useMessage();
  const { clipboardRef, copiedRef } = useCopyToClipboard();

  // form 框
  const formSchema: FormSchema[] = [
    {
      field: 'name',
      label: '账号',
      component: 'Input',
      defaultValue: '',
      componentProps: {
        maxlength: 20,
        placeholder: '请输入账号',
        id: 'form_item_name',
      },
      colProps: { lg: 12, md: 12 },
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
        id: 'form_item_real_name',
      },
      colProps: { lg: 12, md: 12 },
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
        id: 'form_item_email',
      },
      colProps: { lg: 12, md: 12 },
      rules: [
        {
          required: true,
          // @ts-ignore
          validator: async (rule, value) => {
            if (!value) {
              /* eslint-disable-next-line */
              return Promise.reject('请输入邮箱');
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
        id: 'form_item_phone',
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
      colProps: { lg: 12, md: 12 },
    },
    {
      field: 'password',
      label: '密码',
      component: 'InputPassword',
      slot: 'pwd',
      componentProps: {
        maxlength: 20,
        placeholder: '请输入密码',
        id: 'form_item_password',
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
      colProps: { lg: 12, md: 12 },
    },
    {
      field: 'secure_key',
      label: '安全秘钥',
      helpMessage: ['Google安全码秘钥，可以在登录的时候绑定'],
      component: 'Input',
      componentProps: {
        maxlength: 16,
        placeholder: '请输入要绑定的Google安全码秘钥',
        id: 'form_item_secure_key',
      },
      rules: [
        {
          // @ts-ignore
          validator: async (rule, value) => {
            if (!value) {
              return Promise.resolve();
            }
            if (!/^[A-Za-z0-9]{16}$/.test(value)) {
              /* eslint-disable-next-line */
              return Promise.reject('安全码秘钥为16位字符串');
            }
            return Promise.resolve();
          },
          trigger: 'change',
        },
      ],
      colProps: { lg: 12, md: 12 },
    },
    {
      field: 'status',
      label: '状态',
      component: 'RadioButtonGroup',
      defaultValue: 1,
      required: true,
      componentProps: {
        options: [
          { label: '启用', value: 1 },
          { label: '停用', value: 0 },
        ],
        id: 'form_item_status',
      },
      colProps: { lg: 12, md: 12 },
    },
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
      colProps: { lg: 24, md: 24 },
      rules: [{ max: 255, message: '最多输入255个字符' }],
    },
  ];

  const [register, { validate, setFieldsValue }] = useForm({
    labelWidth: 100,
    schemas: formSchema,
    actionColOptions: {
      span: 14,
    },
    showResetButton: false,
    submitButtonOptions: {
      text: '提交',
      disabled: !hasPermission(PermissionsEnum.AccountAddSave, false),
    },
    submitFunc: customSubmitFunc,
  });

  // 提交
  async function customSubmitFunc() {
    try {
      // emit('next', { id: 85 });
      const values = await validate();
      values.password = encryptByMd5(values.password);
      // 新增
      await accountAdd(values)
        .then((res) => {
          notify(res, true);
          emit('next', res.data);
        })
        .catch((e) => {
          console.log('@@@ accountAdd', e);
        })
        .finally(() => {});
    } catch (error) {
      console.log('@@@ account/Step1 customSubmitFunc', error);
    }
  }

  // 生成密码并复制
  function handleCopy(model, field: string) {
    if (!model[field]) {
      // createMessage.warning('请输入要拷贝的内容！');
      // return;
      model[field] = generate(12);
    }
    clipboardRef.value = model[field];
    if (unref(copiedRef)) {
      createMessage.success('copy success！');
    }
  }

  // 强制生成密码并复制
  function handleClick() {
    let pwd = generate(12);
    setFieldsValue({
      password: pwd,
    });
    clipboardRef.value = pwd;
    if (unref(copiedRef)) {
      createMessage.success('copy success！');
    }
  }
</script>
