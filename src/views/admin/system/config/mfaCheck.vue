<template>
  <PageWrapper
    title="基础表单"
    contentBackground
    content=" 表单页用于向用户收集或验证信息，基础表单常见于数据项较少的表单场景。"
    contentClass="p-4"
  >
    <BasicForm @register="register">
      <template #localSearch="{ model, field }">
        <ApiSelect
          :api="getCheckMfaScenariosList"
          showSearch
          v-model:value="model[field]"
          optionFilterProp="label"
          resultField="data"
          labelField="title"
          valueField="value"
        />
      </template>
    </BasicForm>
  </PageWrapper>
</template>
<script lang="ts" setup>
  import { ApiSelect, BasicForm, FormSchema, useForm } from '@/components/Form';
  import { useMessage } from '@/hooks/web/useMessage';
  import { PageWrapper } from '@/components/Page';
  import { getCheckMfaScenariosList } from '@/api/admin/system';

  const formSchema: FormSchema[] = [
    {
      field: 'title',
      label: '配置名称',
      component: 'Input',
      helpMessage: ['配置名称'],
      componentProps: {
        placeholder: '请输入配置名称',
        maxlength: 30,
      },
      rules: [
        {
          required: true,
          validator: async (rule, value) => {
            if (!value) {
              return Promise.reject('请输入配置名称');
            }
            if (value.length > 30) {
              return Promise.reject('最多输入30个字符');
            }
            return Promise.resolve();
          },
          trigger: 'change',
        },
      ],
    },
    {
      field: 'uuid',
      label: '唯一标识',
      component: 'Input',
      componentProps: {
        placeholder: '请输入唯一限标识',
        maxlength: 100,
      },
      helpMessage: ['配置唯一标识'],
      rules: [
        {
          required: true,
          validator: async (rule, value) => {
            if (!value) {
              return Promise.reject('请输入唯一限标识');
            }
            if (value.length > 100) {
              return Promise.reject('最多输入30个字符');
            }
            return Promise.resolve();
          },
          trigger: 'change',
        },
      ],
    },
    // {
    //   field: 'type',
    //   label: '数据格式',
    //   helpMessage: ['配置值数据格式'],
    //   component: 'RadioButtonGroup',
    //   defaultValue: 0,
    //   componentProps: {
    //     options: [
    //       { label: 'String', value: 0 },
    //       { label: 'Integer', value: 1 },
    //       { label: 'Float', value: 2 },
    //       { label: 'Boolean', value: 3 },
    //       { label: 'JsonArr', value: 4 },
    //     ],
    //   },
    // },
    {
      field: 'value',
      label: '禁止使用的场景',
      helpMessage: ['ApiSelect组件'],
      required: true,
      slot: 'localSearch',
      colProps: {
        span: 8,
      },
      defaultValue: '',
      componentProps: {
        placeholder: '请输入账号',
        onOptionsChange() {},
      },
    },
    {
      label: '备注',
      field: 'remark',
      helpMessage: ['最多输入255个字符'],
      component: 'InputTextArea',
      componentProps: {
        placeholder: '请输入备注信息，最多输入255个字符',
        showCount: true,
        maxlength: 255,
      },
      colProps: { lg: 24, md: 24 },
      rules: [{ max: 255, message: '最多输入255个字符' }],
    },
  ];

  defineOptions({ name: 'FormBasicPage' });

  const { createMessage } = useMessage();
  const [register, { validate, setProps }] = useForm({
    labelCol: {
      span: 8,
    },
    wrapperCol: {
      span: 15,
    },
    schemas: formSchema,
    actionColOptions: {
      offset: 8,
      span: 23,
    },
    submitButtonOptions: {
      text: '提交',
    },
    submitFunc: customSubmitFunc,
  });

  async function customSubmitFunc() {
    try {
      await validate();
      setProps({
        submitButtonOptions: {
          loading: true,
        },
      });
      setTimeout(() => {
        setProps({
          submitButtonOptions: {
            loading: false,
          },
        });
        createMessage.success('提交成功！');
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  }
</script>
<style lang="less" scoped>
  .form-wrap {
    padding: 24px;
    background-color: @component-background;
  }
</style>
