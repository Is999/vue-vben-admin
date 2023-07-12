<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :showOkBtn="hasPermission(PermissionsEnum.EventsAdd, false)"
    :title="getTitle"
    :isDetail="true"
    @ok="handleSubmit"
  >
    <BasicForm @register="registerForm" />

    <a-divider />
    <div>
      <h3><SoundTwoTone twoToneColor="#eb2f96" /> 说明</h3>
      <h4>1. Platform Channel 联动</h4>
      <p> 选择Platform下拉值后，等待接口返回Channel下拉列表数据，方可选择Channel值。 </p>
    </div>
  </BasicDrawer>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';
  import { Divider } from 'ant-design-vue';
  export default defineComponent({
    components: {
      [Divider.name]: Divider,
    },
  });
</script>

<script setup lang="ts">
  import { computed } from 'vue';
  import { SoundTwoTone } from '@ant-design/icons-vue';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form/index';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { PermissionsEnum } from '/@/enums/roleEnum';
  import { getChannelsSelectList, getPlatformsSelectList } from '/@/api/admin/public';
  import { SelectLists } from '/@/api/admin/model/public';
  import { eventsAdd } from '/@/api/admin/transaction';
  const { hasPermission } = usePermission();

  const emit = defineEmits(['success', 'register']);

  const formSchema: FormSchema[] = [
    {
      field: 'action',
      label: 'Action',
      labelWidth: 100,
      component: 'Select',
      colProps: { span: 5 },
      componentProps: {
        options: [
          { label: 'increase', value: 'increase' },
          { label: 'decrease', value: 'decrease' },
          { label: 'unfreeze', value: 'unfreeze' },
          { label: 'freeze', value: 'freeze' },
        ],
        showSearch: true,
      },
    },
    {
      field: 'platform',
      component: 'ApiSelect',
      label: 'Platform',
      colProps: {
        span: 5,
      },
      componentProps: ({ formModel, formActionType }) => {
        return {
          showSearch: true,
          api: () => getPlatformsSelectList(true),
          placeholder: 'Platform Channel 联动',
          fieldNames: {
            label: 'label',
            key: 'key',
            value: 'value',
          },
          onChange: (e: any) => {
            // 联动请求渠道下拉列表
            formModel.channel = undefined; //  reset value
            const { updateSchema } = formActionType;
            updateSchema([
              {
                field: 'channel',
                componentProps: {
                  api: () =>
                    e === undefined
                      ? new Promise<SelectLists[]>((resolve) => {
                          resolve([]);
                        })
                      : getChannelsSelectList(e),
                },
              },
            ]);
          },
        };
      },
    },
    {
      field: 'channel',
      label: 'Channel',
      labelWidth: 100,
      component: 'ApiSelect',
      colProps: { span: 5 },
      componentProps: {
        showSearch: true,
        options: [], // defalut
        placeholder: 'Platform Channel 联动',
      },
    },
    {
      field: 'amount',
      label: 'Amount',
      labelWidth: 100,
      component: 'InputNumber',
      colProps: { span: 5 },
      defaultValue: 0,
      componentProps: {
        step: 0.01,
        min: 0,
      },
    },
  ];

  const [registerForm, { resetFields, validate }] = useForm({
    labelWidth: 100,
    schemas: formSchema,
    showActionButtonGroup: false,
    baseColProps: { lg: 12, md: 24 },
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      resetFields(); // 重置
      setDrawerProps({ loading: true }); // loading
    } finally {
      setDrawerProps({ loading: false }); // loading
    }
  });

  // 标题
  const getTitle = computed(() => '添加流水记录');

  // 提交数据
  async function handleSubmit() {
    const { createMessage } = useMessage();
    try {
      const values = await validate();

      setDrawerProps({ loading: true });
      // console.log('@@@提交数据', values);
      // 发起请求
      await eventsAdd(values).then((res) => {
        createMessage.success(res.message);
      });

      closeDrawer();
      emit('success');
    } finally {
      setDrawerProps({ loading: false });
    }
  }
</script>

<style lang="less" scoped>
  .CodeEditor {
    border: 1px solid #d9d9d9;
    border-radius: 2px;
  }
</style>
