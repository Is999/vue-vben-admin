<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :showOkBtn="hasPermission(PermissionsEnum.AccountEditSave, false)"
    :title="getTitle"
    :isDetail="true"
    @ok="handleSubmit"
  >
    <BasicForm @register="register" autocomplete="off">
      <template #pwd="{ model, field }">
        <div class="flex justify-center">
          <InputPassword
            autocomplete="new-password"
            placeholder="请输入密码"
            v-model:value="model[field]"
            :allowClear="true"
          />
          <Tooltip title="生成新密码并复制" placement="bottom">
            <Button type="primary" @click="handleCopy(model, field)"> 复制 </Button>
          </Tooltip>
        </div>
      </template>
    </BasicForm>
    <Divider />
    <div>
      <h3><SoundTwoTone twoToneColor="#eb2f96" /> 说明</h3>
      <h4>1. 新密码</h4>
      <p>
        新密码为空值时，表示不修改密码，点击复制按钮可生产新的密码并复制到剪切板。也可以点击此处
        <Tooltip title="生成新密码并复制" placement="top">
          <a @click="handleClick" style="color: #0cc00c"><strong>生成新密码</strong></a>
        </Tooltip>
        。
      </p>
      <h4>2. 安全秘钥</h4>
      <p>
        Google安全秘钥为空值时，表示不修改安全秘钥。也可以点击此处
        <Tooltip title="生成绑定安全秘钥地址并复制" placement="top">
          <a @click="handleBuildSecretKeyUrl" style="color: #0cc00c"
            ><strong>生成绑定安全秘钥页面地址</strong>
          </a>
        </Tooltip>
        并复制该地址给用户让用户去绑定。<br /><br />

        <span id="buildSecretKeyUrl" style="display: none">
          绑定安全秘钥页面地址已
          <Tooltip title="复制已生成的地址" placement="top">
            <a @click="handleCopyBuildSecretKeyUrl" style="color: #0cc00c"
              ><strong>复制到粘贴板</strong>
            </a>
          </Tooltip>
          ，请直接使用Ctr+v或Command+v粘贴。 预览地址：<a
            :href="buildSecretKeyUrl"
            target="_blank"
            >{{ buildSecretKeyUrl }}</a
          >
        </span>
      </p>
    </div>
  </BasicDrawer>
</template>

<script setup lang="ts">
  import { ref, computed, unref } from 'vue';
  import { SoundTwoTone } from '@ant-design/icons-vue';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form/index';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { accountBuildSecretKeyUrl, accountEdit } from '/@/api/admin/system';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { PermissionsEnum } from '/@/enums/roleEnum';
  import { Tooltip, Divider, InputPassword, Button } from 'ant-design-vue';
  import { useCopyToClipboard } from '/@/hooks/web/useCopyToClipboard';
  import { notify } from '/@/api/api';
  import { encryptByMd5 } from '/@/utils/cipher';
  import { useGlobSetting } from '@/hooks/setting';
  import { checkChars, containSpecialChars, generate } from '@/utils/passport';

  const emit = defineEmits(['success', 'register']);

  const { hasPermission } = usePermission();
  const { createMessage } = useMessage();
  const { clipboardRef, copiedRef } = useCopyToClipboard();

  const rowId = ref(0); // 编辑记录的id
  const isGetParentTreeData = ref(true); // 是否请求下拉框数据
  const buildSecretKeyUrl = ref(''); // 是否请求下拉框数据

  // form 框
  const formSchema: FormSchema[] = [
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
        id: 'form_item_real_name_edit',
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
        id: 'form_item_email_edit',
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
        id: 'form_item_password_edit',
      },
      rules: [
        {
          // @ts-ignore
          validator: async (rule, value) => {
            if (!value) {
              return Promise.resolve();
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
      label: '安全码',
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
              /* eslint-disable-next-line */
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
        id: 'form_item_status_edit',
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

  const [register, { resetFields, setFieldsValue, validate }] = useForm({
    labelWidth: 100,
    schemas: formSchema,
    showActionButtonGroup: false,
    baseColProps: { lg: 12, md: 24 },
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    setDrawerProps({ confirmLoading: false }); // loading
    await resetFields(); // 重置
    rowId.value = data.record.id;
    buildSecretKeyUrl.value = '';
    // console.log('@@@data', data.record);
    await setFieldsValue({
      ...data.record,
      password: '', // 密码置空处理
      secure_key: '', // 密码置空处理
    });

    const node = document.querySelector('#buildSecretKeyUrl');
    node?.setAttribute('style', 'display:none');
  });

  // 标题
  const getTitle = computed(() => '编辑账号信息');

  // 提交数据
  async function handleSubmit() {
    try {
      const values = await validate();
      if (values.password) {
        values.password = encryptByMd5(values.password);
      }

      setDrawerProps({ confirmLoading: true });
      // console.log('@@@提交数据', values);

      // 发起请求
      await accountEdit(rowId.value, values).then((res) => {
        notify(res, true);
      });

      closeDrawer();
      emit('success');

      isGetParentTreeData.value = true; // 数据变动, 下次重新请求接口
    } finally {
      setDrawerProps({ confirmLoading: false });
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

  // 提交数据
  async function handleBuildSecretKeyUrl() {
    try {
      setDrawerProps({ confirmLoading: true });
      if (!hasPermission(PermissionsEnum.AccountBuildSecretKeyUrl, false)) {
        createMessage.error('没有权限生成绑定安全秘钥地址！');
        return;
      }

      // 发起请求
      await accountBuildSecretKeyUrl(rowId.value).then((data) => {
        if (data.build_secure_key_url) {
          // 获取配置
          const globSetting = useGlobSetting();
          let currentDomain = window.location.origin;
          buildSecretKeyUrl.value = currentDomain + globSetting.apiUrl + data.build_secure_key_url;
          clipboardRef.value = buildSecretKeyUrl.value;

          const node = document.querySelector('#buildSecretKeyUrl');
          node?.setAttribute('style', 'display:block');

          if (unref(copiedRef)) {
            createMessage.success('copy success！');
          }
        }
      });

      isGetParentTreeData.value = true; // 数据变动, 下次重新请求接口
    } finally {
      setDrawerProps({ confirmLoading: false });
    }
  }

  // 强制生成密码并复制
  function handleCopyBuildSecretKeyUrl() {
    if (buildSecretKeyUrl.value) {
      clipboardRef.value = buildSecretKeyUrl.value;
      if (unref(copiedRef)) {
        createMessage.success('copy success！');
      }
    } else {
      handleBuildSecretKeyUrl();
    }
  }
</script>
