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
              :min="0"
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
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'actionCol'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:info-circle-outlined',
                tooltip: '查看详情',
                onClick: handleEdit.bind(null, record),
                disabled: !hasPermission(PermissionsEnum.WithdrawalDetails, false),
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <DetailDrawer @register="registerDrawer" @success="handleSuccess" />
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
  import { BasicTable, useTable, TableAction, BasicColumn, FormSchema } from '/@/components/Table';
  import { useDrawer } from '/@/components/Drawer';
  import DetailDrawer from './DetailDrawer.vue';
  import { ref, computed, watch, h, onMounted } from 'vue';
  import {
    day7Range,
    formSchemaRangeDataTime,
    SchemaDataTimeParams,
  } from '/@/views/admin/formSchemaDate';
  import { getSlipsList } from '/@/api/admin/withdrawal';
  import { Tag, Tooltip } from 'ant-design-vue';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { PermissionsEnum } from '/@/enums/roleEnum';
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
    formSchemaRangeDataTime({
      label: '时间',
      labelWidth: 60,
      showTimeFormat: 'HH:mm:ss',
      defaultValue: day7Range,
      helpMessage: '不支持跨月查询',
    } as SchemaDataTimeParams),
    {
      field: 'amount',
      label: '金额',
      labelWidth: 60,
      component: 'InputGroup',
      slot: 'custom',
    },
    {
      field: 'no',
      label: '单号',
      labelWidth: 60,
      component: 'Input',
      colProps: { span: 8 },
      componentProps: {
        placeholder: '请输入No or Order No',
      },
    },
    {
      field: 'status',
      label: '状态',
      labelWidth: 60,
      component: 'Select',
      colProps: { span: 5 },
      componentProps: {
        options: [
          { label: 'created', value: 'created' },
          { label: 'waiting', value: 'waiting' },
          { label: 'approved', value: 'approved' },
          { label: 'denied', value: 'denied' },
          { label: 'unconfirmable', value: 'unconfirmable' },
          { label: 'issued', value: 'issued' },
          { label: 'in-progress', value: 'in-progress' },
          { label: 'failed', value: 'failed' },
          { label: 'succeed', value: 'succeed' },
        ],
        showSearch: true,
      },
    },
    {
      field: 'platform',
      component: 'ApiSelect',
      label: '平台',
      colProps: {
        span: 5,
      },
      componentProps: ({ formModel, formActionType }) => {
        return {
          showSearch: true,
          api: getPlatformsSelectList,
          fieldNames: {
            label: 'label',
            key: 'key',
            value: 'value',
          },
          onChange: (e: any) => {
            // 联动请求渠道下拉列表
            formModel.channel = undefined; //  reset value
            const { updateSchema, getFieldsValue } = formActionType;
            let values = getFieldsValue();
            updateSchema([
              {
                field: '[startTime, endTime]',
                defaultValue: [values.startTime ?? '', values.endTime ?? ''],
              },
              {
                field: 'channel',
                componentProps: {
                  api: () => (e === undefined ? channels.value : getChannelsSelectList(e)),
                },
              },
            ]);
          },
        };
      },
    },
    {
      field: 'channel',
      label: '渠道',
      labelWidth: 60,
      component: 'ApiSelect',
      colProps: { span: 5 },
      componentProps: {
        showSearch: true,
        api: () => channels.value, // defalut
      },
    },
  ];

  // 数据列
  const columns: BasicColumn[] = [
    {
      title: 'No.',
      dataIndex: 'no',
      width: 280,
      resizable: true,
      fixed: 'left',
      customRender: ({ record }) => {
        if (!hasPermission(PermissionsEnum.WithdrawalDetails, false)) {
          return record.no;
        }

        return h(
          'a',
          {
            style: { color: '#0147f6' },
            ondblclick() {
              handleEdit(record);
            },
          },
          h(Tooltip, { title: '双击鼠标查看详情 ' + record.no }, () => record.no),
        );
      },
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      width: 120,
      resizable: true,
    },
    {
      title: 'Order No.',
      dataIndex: 'order_no',
      width: 280,
      resizable: true,
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      width: 200,
      resizable: true,
    },
    {
      title: 'Tx No.',
      dataIndex: 'response',
      width: 280,
      resizable: true,
      customRender: ({ record }) => {
        return record.tx_no || record.response?.tx_no || '';
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 180,
      resizable: true,
      sorter: true,
    },
    {
      title: 'Fee',
      dataIndex: 'fee',
      width: 100,
      resizable: true,
      sorter: true,
    },
    {
      title: 'Bank',
      dataIndex: 'bank',
      width: 100,
      resizable: true,
    },
    {
      title: 'Card Holder',
      dataIndex: 'card_holder',
      width: 120,
      resizable: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      resizable: true,
      sorter: true,
      customRender: ({ record }) => {
        let color = 'default';
        switch (record.status) {
          case 'created':
            color = 'default';
            break;
          case 'issued':
            color = '#0433a9';
            break;
          case 'in-progress':
            color = '#986416';
            break;
          case 'failed':
            color = '#ea0630';
            break;
          case 'succeed':
            color = '#05ad20';
            break;
          case 'waiting':
            color = '#03adbe';
            break;
          case 'unconfirmable':
            color = '#503a18';
            break;
          case 'approved':
            color = '#3da24f';
            break;
          case 'denied':
            color = '#ea0630';
            break;
          default:
            color = '#56534f';
        }
        return h(Tag, { color: color }, () => record.status);
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      resizable: true,
      sorter: true,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 180,
      resizable: true,
      sorter: true,
    },
  ];

  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerTable, { reload, setColumns, getColumns }] = useTable({
    title: '流水列表',
    api: getSlipsList,
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
    actionColumn: {
      width: 60,
      title: '操作',
      dataIndex: 'actionCol',
      fixed: 'right',
      ifShow: hasPermission(PermissionsEnum.WithdrawalDetails, false),
    },
  });

  // 查看详情
  function handleEdit(record: Recordable) {
    openDrawer(true, {
      record,
      isUpdate: true,
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
