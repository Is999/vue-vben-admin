<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :showOkBtn="
      hasPermission(
        isUpdate ? PermissionsEnum.ConfigEditSave : PermissionsEnum.ConfigAddSave,
        false,
      )
    "
    :title="getTitle"
    :isDetail="true"
    @ok="handleSubmit"
  >
    <BasicForm @register="registerForm">
      <template #configExample="{ model, field }">
        <CodeEditor
          :readonly="isUpdate"
          v-model:value="model[field]"
          :mode="modeValue"
          @change="handleValueChange"
          class="CodeEditor"
        />
      </template>
      <template #configValue="{ model, field }">
        <CodeEditor v-model:value="model[field]" :mode="modeValue" class="CodeEditor" />
      </template>
    </BasicForm>

    <Divider />
    <div>
      <h3><SoundTwoTone twoToneColor="#eb2f96" /> 说明</h3>
      <h4>1. 唯一标识</h4>
      <p> 配置唯一标识，不能重复，具体参数询问开发人员。 </p>
      <h4>2. 配置值</h4>
      <p> 一定要注意配置的数据格式。 </p>
    </div>
  </BasicDrawer>
</template>

<script setup lang="ts">
  import { ref, computed, unref } from 'vue';
  import { SoundTwoTone } from '@ant-design/icons-vue';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form/index';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { configAdd, configEdit } from '/@/api/admin/system';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { PermissionsEnum } from '/@/enums/permissionsEnum';
  import { CodeEditor, MODE } from '/@/components/CodeEditor';
  import { notify } from '/@/api/api';
  import { Divider } from 'ant-design-vue';

  const { hasPermission } = usePermission();

  const emit = defineEmits(['success', 'register']);

  // const value = ref('');
  // const example = ref('');
  const isUpdate = ref<boolean>(false); // true 编辑, false 新增
  const rowId = ref(0); // 编辑记录的id
  const modeValue = ref<MODE>(MODE.JSON);

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
    {
      field: 'type',
      label: '数据格式',
      helpMessage: ['配置值数据格式'],
      component: 'RadioButtonGroup',
      defaultValue: 0,
      componentProps: {
        options: [
          { label: 'String', value: 0 },
          { label: 'Integer', value: 1 },
          { label: 'Float', value: 2 },
          { label: 'Boolean', value: 3 },
          { label: 'JsonArr', value: 4 },
        ],
      },
    },
    {
      label: '配置示例',
      field: 'example',
      helpMessage: ['请输入配置值'],
      component: 'Input',
      slot: 'configExample',
      rules: [
        {
          required: true,
          validator: async (rule, value) => {
            if (!value) {
              return Promise.reject('请输入配置值');
            }
            switch (getFieldsValue()?.type) {
              case 1:
                if (!/^[+-]?(0|[1-9]\d*)$/.test(value)) {
                  return Promise.reject('数据格式错误：不是Integer类型');
                }
                break;
              case 2:
                if (!/^[+-]?(0|[1-9]\d*)(\.\d{1,8})?$/.test(value)) {
                  return Promise.reject('数据格式错误：不是Float类型');
                }
                break;
              case 3:
                if (
                  !(
                    value.toString() === '1' ||
                    value.toString() === '0' ||
                    value.toUpperCase() === 'FALSE' ||
                    value.toUpperCase() === 'TRUE'
                  )
                ) {
                  return Promise.reject('数据格式错误：不是Boolean类型');
                }
                break;
              case 4:
                try {
                  let obj = JSON.parse(value);
                  if (!(typeof obj == 'object' && obj)) {
                    // JSON.stringify(obj); // json
                    return Promise.reject('数据格式错误：不是JsonArr类型');
                  }
                } catch (e) {
                  return Promise.reject('数据格式错误：不是JsonArr类型，' + (e as Error)?.message);
                }
                break;
            }
            return Promise.resolve();
          },
          trigger: 'change',
        },
      ],
      colProps: { lg: 24, md: 24 },
    },
    {
      label: '配置值',
      field: 'value',
      helpMessage: ['请输入配置值'],
      component: 'Input',
      slot: 'configValue',
      rules: [
        {
          required: true,
          validator: async (rule, value) => {
            if (!value) {
              return Promise.reject('请输入配置值');
            }
            switch (getFieldsValue()?.type) {
              case 1:
                if (!/^[+-]?(0|[1-9]\d*)$/.test(value)) {
                  return Promise.reject('数据格式错误：不是Integer类型');
                }
                break;
              case 2:
                if (!/^[+-]?(0|[1-9]\d*)(\.\d{1,8})?$/.test(value)) {
                  return Promise.reject('数据格式错误：不是Float类型');
                }
                break;
              case 3:
                if (
                  !(
                    value.toString() === '1' ||
                    value.toString() === '0' ||
                    value.toUpperCase() === 'FALSE' ||
                    value.toUpperCase() === 'TRUE'
                  )
                ) {
                  return Promise.reject('数据格式错误：不是Boolean类型');
                }
                break;
              case 4:
                try {
                  let obj = JSON.parse(value);
                  if (!(typeof obj == 'object' && obj)) {
                    // JSON.stringify(obj); // json
                    return Promise.reject('数据格式错误：不是JsonArr类型');
                  }
                } catch (e) {
                  return Promise.reject('数据格式错误：不是JsonArr类型，' + (e as Error)?.message);
                }
                break;
            }
            return Promise.resolve();
          },
          trigger: 'change',
        },
      ],
      colProps: { lg: 24, md: 24 },
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

  const [registerForm, { resetFields, setFieldsValue, validate, getFieldsValue }] = useForm({
    labelWidth: 100,
    schemas: formSchema,
    showActionButtonGroup: false,
    baseColProps: { lg: 12, md: 24 },
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true }); // loading
      await resetFields(); // 重置值

      isUpdate.value = data?.isUpdate; // 编辑
      // console.log('@@@@ update', isUpdate.value, data?.isUpdate, data.record);
      // value.value = data.record?.value || '';
      // example.value = data.record?.example || '';

      // let isJson = 0;
      // if (/^\{[\s\S]*\}$/.test(value.value) || /^\[[\s\S]*\]$/.test(value.value)) {
      //   isJson = 1;
      // }

      // 编辑设置值
      if (isUpdate.value) {
        // console.log('@@@@ update 开始 重新设置值');
        rowId.value = data.record.id;
        await setFieldsValue({
          ...data.record,
        });
        // console.log('@@@@ update 结束 重新设置值');
      }
    } catch (e) {
      console.log('@@@ useDrawerInner', e);
    } finally {
      setDrawerProps({ loading: false }); // loading
    }
  });

  // 标题
  const getTitle = computed(() => (!unref(isUpdate) ? '新增配置' : '编辑配置'));

  // 提交数据
  async function handleSubmit() {
    const { createMessage } = useMessage();
    try {
      const values = await validate();
      try {
        if (values.type == 4) {
          let obj = JSON.parse(values.value);
          let obj2 = JSON.parse(values.example);
          if (typeof obj == 'object' && obj && typeof obj2 == 'object' && obj2) {
            values.value = JSON.stringify(obj); // json
            values.example = JSON.stringify(obj2); // json
          } else {
            //throw new Error('数据类型错误');
            return Promise.reject('数据类型错误');
          }
        }
      } catch (e) {
        createMessage.error('配置值格式有误, 不是有效的JSON数据: ' + e);
        return;
      }

      setDrawerProps({ loading: true });
      // console.log('@@@提交数据', values);
      // 发起请求
      if (unref(isUpdate)) {
        // 编辑
        await configEdit(rowId.value, values).then((res) => {
          notify(res, true);
        });
      } else {
        // 新增
        await configAdd(values).then((res) => {
          notify(res, true);
        });
      }

      closeDrawer();
      emit('success');
    } catch (e) {
      console.log('@@@ handleSubmit', e);
    } finally {
      setDrawerProps({ loading: false });
    }
  }

  function handleValueChange() {
    // console.log('@@@@@@ v', v);
  }
</script>

<style lang="less" scoped>
  .CodeEditor {
    border: 1px solid #d9d9d9;
    border-radius: 2px;
  }
</style>
