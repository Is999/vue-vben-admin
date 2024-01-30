<template>
  <div>
    <BasicTable @register="registerTable" @resizeColumn="handleResizeColumn">
      <template #form-custom>
        <a-input-group compact>
          <a-form-item style="border: 0px">
            <a-input
              type="number"
              v-model:value="minAmount"
              style="text-align: center; border-right: 0"
              placeholder="Min"
              :step="0.01"
            />
          </a-form-item>
          <a-form-item style="border: 0px">
            <a-input
              style="
                width: 16px;
                text-align: center;
                pointer-events: none;
                background-color: #fff;
                border-left: 0;
                border-right: 0;
                padding-left: 0px;
                padding-right: 0px;
              "
              placeholder="~"
              disabled
            />
          </a-form-item>
          <a-form-item style="border: 0px">
            <a-input
              type="number"
              v-model:value="maxAmount"
              style="text-align: center; border-left: 0"
              placeholder="Max"
              :min="min"
              :step="0.01"
            />
          </a-form-item>
        </a-input-group>
      </template>
      <template #toolbar>
        <a-button
          type="primary"
          @click="handleCreate"
          v-if="hasPermission(PermissionsEnum.EventsAdd, false)"
          >添加流水记录
        </a-button>
      </template>
    </BasicTable>
    <PlatformDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';
  import { Form, Input } from 'ant-design-vue';
  export default defineComponent({
    components: {
      [Input.name]: Input,
      [Form.Item.name]: Form.Item,
      [Input.Group.name]: Input.Group,
    },
  });
</script>

<script setup lang="ts">
  import { BasicTable, useTable, BasicColumn, FormSchema } from '/@/components/Table';
  import { PermissionsEnum } from '/@/enums/roleEnum';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { useDrawer } from '/@/components/Drawer';
  import PlatformDrawer from './PlatformDrawer.vue';
  import { getEventsList } from '/@/api/admin/transaction';
  import { ref, computed, watch, onMounted } from 'vue';
  import { formSchemaRangeDataTime, SchemaDataTimeParams } from '/@/views/admin/formSchemaDate';
  import { getChannelsSelectList, getPlatformsSelectList } from '/@/api/admin/public';
  import { SelectLists } from '/@/api/admin/model/public';

  const { hasPermission } = usePermission();

  // 最小金额
  const minAmount = ref<any>('');
  // 最大金额
  const maxAmount = ref<any>('');
  // 最小值
  const min = computed(() => {
    if (Number(minAmount.value) != 0) {
      return (Number(minAmount.value) + 0.01).toFixed(2);
    }
    return minAmount.value;
  });

  // 监视最小金额, 修改最大金额
  watch(minAmount, (newVal, oldVal) => {
    minAmount.value = Number(minAmount.value);
    maxAmount.value = Number(maxAmount.value);
    if (Number(newVal) != 0 && newVal > oldVal && minAmount.value >= maxAmount.value) {
      maxAmount.value = Number((minAmount.value + 0.01).toFixed(2));
    }
  });

  // 渠道下拉列表
  const channels = ref<Promise<SelectLists[]>>();

  // 挂载请求一次渠道下拉列表
  onMounted(() => {
    channels.value = getChannelsSelectList();
  });

  // 搜索框
  const schemas: FormSchema[] = [
    {
      field: 'platform',
      component: 'ApiSelect',
      label: '平台',
      labelWidth: 60,
      colProps: {
        span: 5,
      },
      componentProps: {
        placeholder: '请选择Platform',
        showSearch: true,
        api: getPlatformsSelectList,
        fieldNames: {
          label: 'label',
          key: 'key',
          value: 'value',
        },
      },
    },
    {
      field: 'cname',
      label: '名称',
      labelWidth: 60,
      component: 'Input',
      colProps: { span: 5 },
      componentProps: {
        placeholder: '请输入站点名称',
      },
    },
    {
      field: 'action',
      label: '属性',
      labelWidth: 60,
      component: 'Select',
      colProps: { span: 5 },
      componentProps: {
        placeholder: '请选择站点属性',
        options: [
          { label: '内部', value: '内部' },
          { label: '外部', value: '外部' },
        ],
        showSearch: true,
      },
    },
  ];

  // 数据列
  const columns: BasicColumn[] = [
    {
      title: 'Platform',
      dataIndex: 'platform',
      width: 120,
      resizable: true,
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      width: 200,
      resizable: true,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 200,
      resizable: true,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 200,
      resizable: true,
      sorter: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      resizable: true,
      sorter: true,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      resizable: true,
      sorter: true,
    },
  ];

  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerTable, { reload, setColumns, getColumns }] = useTable({
    title: '流水列表',
    api: getEventsList,
    rowKey: 'id',
    columns,
    searchInfo: { minAmount, maxAmount },
    handleSearchInfoFn(info) {
      info.minAmount = Number(minAmount.value);
      info.maxAmount = Number(maxAmount.value);
      return info;
    },
    formConfig: {
      labelWidth: 80,
      schemas,
      autoSubmitOnEnter: true,
      showAdvancedButton: false,
      resetFunc() {
        minAmount.value = '';
        maxAmount.value = '';
        return Promise.resolve();
      },
    },
    useSearchForm: true,
    showTableSetting: true,
    bordered: true,
  });

  // 新增
  function handleCreate() {
    openDrawer(true, {
      isUpdate: false,
    });
  }

  // 编辑|新增成功后重新reload
  function handleSuccess() {
    reload();
  }

  // 拖拽列重新渲染
  function handleResizeColumn(w, col) {
    const cols = getColumns();
    const index = cols.findIndex((value, index) => {
      if (value.dataIndex === col.dataIndex) {
        return index;
      }
    });
    if (index >= 0) {
      cols[index].width = w;
      setColumns(cols);
    }
  }
</script>
