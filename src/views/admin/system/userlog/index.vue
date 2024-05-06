<template>
  <VxeBasicTable v-bind="gridOptions">
    <template #action="{ row }">
      <TableAction :actions="createActions(row)" />
    </template>
  </VxeBasicTable>
</template>
<script lang="ts" setup>
  import { reactive } from 'vue';
  import { ActionItem, TableAction } from '@/components/Table';
  import {
    BasicTableProps,
    VxeBasicTable,
    VxeFormItemProps,
    VxeGridPropTypes,
  } from '@/components/VxeTable';
  import { getUserLogActionList, getUserLogList } from '@/api/admin/system';

  const vxeTableColumns: VxeGridPropTypes.Columns = [
    {
      title: '序号',
      type: 'seq',
      fixed: 'left',
      width: '50',
      align: 'center',
    },
    {
      title: '账号',
      field: 'user_name',
      minWidth: 140,
      showOverflow: 'tooltip',
      fixed: 'left',
    },
    {
      title: '动作名称',
      field: 'action',
      minWidth: 180,
      showOverflow: 'tooltip',
      align: 'left',
      fixed: 'left',
    },
    {
      title: '路由名称',
      field: 'route',
      minWidth: 180,
      showOverflow: 'tooltip',
      align: 'left',
    },
    {
      title: '方法',
      field: 'method',
      width: 180,
      showOverflow: 'tooltip',
      align: 'left',
    },
    {
      title: '备注',
      field: 'describe',
      minWidth: 200,
      showOverflow: 'tooltip',
      align: 'left',
    },
    {
      title: '数据',
      field: 'data',
      minWidth: 200,
      showOverflow: 'tooltip',
      align: 'left',
    },
    {
      title: 'IP',
      field: 'ip',
      minWidth: 140,
      showOverflow: 'tooltip',
      align: 'center',
    },
    {
      title: 'IP属地',
      field: 'ipaddr',
      minWidth: 160,
      showOverflow: 'tooltip',
      align: 'left',
    },
    {
      title: '记录时间',
      minWidth: 160,
      field: 'created_at',
      showOverflow: 'tooltip',
      align: 'center',
      sortable: true,
      fixed: 'right',
    },
  ];

  const vxeTableFormSchema: VxeFormItemProps[] = [
    {
      field: 'user_name',
      title: '账号',
      itemRender: {
        name: 'AInput',
      },
      span: 6,
    },
    {
      field: 'action',
      title: '类型',
      itemRender: {
        name: 'AApiSelect',
        props: {
          api: getUserLogActionList,
          resultField: 'data',
          labelField: 'title',
          valueField: 'value',
        },
      },
      span: 6,
    },
    {
      span: 12,
      align: 'right',
      className: '!pr-0',
      itemRender: {
        name: 'AButtonGroup',
        children: [
          {
            props: { type: 'primary', content: '查询', htmlType: 'submit' },
            attrs: { class: 'mr-2' },
          },
          { props: { type: 'default', htmlType: 'reset', content: '重置' } },
        ],
      },
    },
  ];

  const gridOptions = reactive<BasicTableProps>({
    id: 'UserLog',
    keepSource: false,
    autoResize: true,
    syncResize: true,
    columns: vxeTableColumns,
    formConfig: {
      enabled: true,
      items: vxeTableFormSchema,
    },
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page, form }) => {
          return getUserLogList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...form,
          });
        },
        queryAll: async ({ form }) => {
          return await getUserLogList(form);
        },
      },
    },
    // sortConfig: {
    //   remote: true,
    //   defaultSort: { field: 'created_at', order: 'desc' },
    //   orders: ['desc', 'asc', null],
    // },
  });

  // 操作按钮（权限控制）
  const createActions = (record) => {
    const actions: ActionItem[] = [
      {
        label: '详情',
        onClick: () => {
          console.log(record);
        },
      },
      {
        label: '编辑',
        onClick: () => {},
      },
      {
        label: '删除',
        color: 'error',
        popConfirm: {
          title: '是否确认删除',
          confirm: () => {
            // tableRef.value?.remove(record);
          },
        },
      },
    ];

    return actions;
  };
</script>
