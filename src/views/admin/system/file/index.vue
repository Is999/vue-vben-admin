<template>
  <VxeBasicTable ref="tableRef" v-bind="gridOptions">
    <template #action="{ row }">
      <TableAction outside :actions="createActions(row)" />
    </template>
  </VxeBasicTable>
</template>
<script lang="ts" setup>
  import { reactive, ref } from 'vue';
  import { ActionItem, TableAction } from '@/components/Table';
  import {
    BasicTableProps,
    VxeBasicTable,
    VxeFormItemProps,
    VxeGridInstance,
    VxeGridPropTypes,
  } from '@/components/VxeTable';
  import { getSecretKeyList } from '@/api/admin/system';
  // import { usePermission } from '@/hooks/web/usePermission';

  const tableRef = ref<VxeGridInstance>();
  // const { hasPermission } = usePermission();

  const columns: VxeGridPropTypes.Columns = [
    {
      title: '序号',
      type: 'seq',
      fixed: 'left',
      width: '50',
      align: 'center',
    },
    {
      title: '文件名',
      field: 'name',
      minWidth: 140,
      showOverflow: 'tooltip',
      align: 'left',
      fixed: 'left',
    },
    {
      title: '路径',
      field: 'path',
      minWidth: 140,
      showOverflow: 'tooltip',
      // fixed: 'left',
    },
    {
      title: '类型',
      field: 'type',
      minWidth: 180,
      showOverflow: 'tooltip',
      align: 'left',
    },
    {
      title: '大小',
      field: 'size',
      width: 180,
      showOverflow: 'tooltip',
      align: 'left',
    },
    {
      title: '状态',
      field: 'status',
      minWidth: 180,
      showOverflow: 'tooltip',
      align: 'left',
    },
    {
      title: '最近访问时间',
      field: 'modTime',
      minWidth: 180,
      showOverflow: 'tooltip',
      align: 'left',
    },
    {
      title: '文件过期时间',
      field: 'expiration',
      minWidth: 180,
      showOverflow: 'tooltip',
      align: 'center',
    },
    {
      title: '创建时间',
      minWidth: 160,
      field: 'created_at',
      showOverflow: 'tooltip',
      align: 'center',
      sortable: true,
      // fixed: 'right',
    },
    // {
    //   title: '修改时间',
    //   minWidth: 160,
    //   field: 'updated_at',
    //   showOverflow: 'tooltip',
    //   align: 'center',
    //   sortable: true,
    //   // fixed: 'right',
    // },
    {
      width: 160,
      title: '操作',
      align: 'center',
      slots: { default: 'action' },
      fixed: 'right',
    },
  ];

  const searchFormSchema: VxeFormItemProps[] = [
    {
      field: 'title',
      title: '名称',
      itemRender: {
        name: 'AInput',
      },
      span: 6,
    },
    {
      field: 'uuid',
      title: 'App ID',
      itemRender: {
        name: 'AInput',
      },
      span: 6,
    },
    {
      field: 'status',
      title: '状态',
      itemRender: {
        name: 'ASelect',
        props: {
          options: [
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
          ],
        },
      },
      span: 6,
    },
    {
      span: 6,
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
    id: 'Files',
    keepSource: false,
    autoResize: true,
    syncResize: true,
    columns: columns,
    formConfig: {
      enabled: true,
      items: searchFormSchema,
    },
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page, form }) => {
          return getSecretKeyList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...form,
          });
        },
      },
    },
  });

  // 操作按钮（权限控制）
  const createActions = (record) => {
    const actions: ActionItem[] = [
      {
        tooltip: '删除文件',
        icon: 'ant-design:delete-outlined',
        onClick: () => {
          console.log(record);
        },
      },
      {
        tooltip: '恢复文件',
        icon: 'ant-design:delete-outlined',
        onClick: () => {},
      },
    ];

    return actions;
  };
</script>
