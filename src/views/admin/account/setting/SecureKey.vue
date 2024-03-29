<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    title="修改当前用户Google安全码"
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
      <h4>1. Google安全秘钥</h4>
      <p>
        <span id="buildSecretKeyUrl">
          如若没有安全秘钥，<a :href="buildSecretKeyUrl" target="_blank">点击此处去绑定</a>。
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
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { updateSecureKey } from '/@/api/admin/system';
  import { useUserStore } from '/@/store/modules/user';
  import { notify } from '/@/api/api';
  import { useGlobSetting } from '/@/hooks/setting';
  import { ref, unref } from 'vue';
  import { useCopyToClipboard } from '/@/hooks/web/useCopyToClipboard';
  import { useMessage } from '/@/hooks/web/useMessage';

  const userStore = useUserStore();
  const { clipboardRef, copiedRef } = useCopyToClipboard();
  const { createMessage } = useMessage();
  const globSetting = useGlobSetting();

  const buildSecretKeyUrl = ref(globSetting.apiUrl + userStore.getUserInfo?.build_secure_key_url);
  const formSchema: FormSchema[] = [
    {
      field: 'secure_key',
      label: '',
      component: 'Input',
      componentProps: {
        maxlength: 16,
        placeholder: '请输入要绑定的Google安全码秘钥',
      },
      rules: [
        {
          required: true,
          // @ts-ignore
          validator: async (rule, value) => {
            if (!/^[A-Za-z0-9]{16}$/.test(value)) {
              return Promise.reject('安全码秘钥为16位字符串');
            }
            return Promise.resolve();
          },
          trigger: 'change',
        },
      ],
      colProps: { lg: 24, md: 24 },
    },
  ];

  const [register, { validate, resetFields }] = useForm({
    size: 'large',
    labelWidth: 0,
    showActionButtonGroup: false,
    schemas: formSchema,
    baseColProps: { lg: 24, md: 24 },
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async () => {
    try {
      setDrawerProps({ loading: true }); // loading
      resetFields(); // 重置
      await userStore
        .getMineAction()
        .then((userinfo) => {
          if (userinfo != null) {
            buildSecretKeyUrl.value = globSetting.apiUrl + userinfo?.build_secure_key_url;
            //setFieldsValue(userinfo);
          }
        })
        .catch(() => {
          createMessage.success('加载数据错误！');
        });
    } finally {
      setDrawerProps({ loading: false }); // loading
    }
  });

  // 提交
  async function handleSubmit() {
    const values = await validate();
    try {
      setDrawerProps({ loading: true });

      // 修改安全码
      await updateSecureKey(values).then((res) => {
        notify(res, true);
        closeDrawer();
      });
    } catch (error) {
      // 错误信息
      console.log(error);
    } finally {
      setDrawerProps({ loading: false });
    }
  }

  function handleCopyBuildSecretKeyUrl() {
    let currentDomain = window.location.origin;
    clipboardRef.value = currentDomain + buildSecretKeyUrl.value;
    if (unref(copiedRef)) {
      createMessage.success('copy success！');
    }
  }
</script>
