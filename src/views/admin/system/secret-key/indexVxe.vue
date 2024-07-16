<template>
  <VxeBasicTable ref="tableRef" v-bind="gridOptions">
    <template #action="{ row }">
      <TableAction outside :actions="createActions(row)" />
    </template>
  </VxeBasicTable>
  <SecretKeyDrawer @register="registerDrawer" @success="handleSuccess" />
</template>
<script lang="ts" setup>
  import { h, reactive, ref } from 'vue';
  import { ActionItem, TableAction } from '@/components/Table';
  import {
    BasicTableProps,
    VxeBasicTable,
    VxeFormItemProps,
    VxeGridInstance,
    VxeGridPropTypes,
  } from '@/components/VxeTable';
  import { getSecretKeyList, setSecretKeyStatus } from '@/api/admin/system';
  import { Switch } from 'ant-design-vue';
  import { PermissionsEnum } from '@/enums/permissionsEnum';
  import { notify } from '@/api/api';
  import { usePermission } from '@/hooks/web/usePermission';
  import SecretKeyDrawer from '@/views/admin/system/secret-key/SecretKeyDrawer.vue';
  import { useDrawer } from '@/components/Drawer';

  const [registerDrawer, { openDrawer }] = useDrawer();
  // 编辑|新增成功后重新reload
  function handleSuccess() {
    console.log('刷新页面');
    tableRef.value?.reloadData([]);
  }

  // 新增
  function handleCreate() {
    openDrawer(true, {
      isUpdate: false,
    });
  }

  const tableRef = ref<VxeGridInstance>();
  const { hasPermission } = usePermission();

  const columns: VxeGridPropTypes.Columns = [
    {
      title: '序号',
      type: 'seq',
      fixed: 'left',
      width: '50',
      align: 'center',
    },
    {
      title: '名称',
      field: 'title',
      minWidth: 140,
      showOverflow: 'tooltip',
      align: 'left',
      fixed: 'left',
    },
    {
      title: 'App ID',
      field: 'uuid',
      minWidth: 140,
      showOverflow: 'tooltip',
      // fixed: 'left',
    },
    {
      title: 'AES KEY',
      field: 'aes_key',
      minWidth: 180,
      showOverflow: 'tooltip',
      align: 'left',
    },
    {
      title: 'AES IV',
      field: 'aes_iv',
      width: 180,
      showOverflow: 'tooltip',
      align: 'left',
    },
    {
      title: 'RSA公钥',
      field: 'rsa_public_key_server',
      minWidth: 180,
      showOverflow: 'tooltip',
      align: 'left',
    },
    {
      title: 'RSA私钥',
      field: 'rsa_private_key_server',
      minWidth: 180,
      showOverflow: 'tooltip',
      align: 'left',
    },
    {
      title: 'RSA公钥[用户]',
      field: 'rsa_public_key_user',
      minWidth: 180,
      showOverflow: 'tooltip',
      align: 'center',
    },
    {
      title: '状态',
      field: 'status',
      minWidth: 100,
      showOverflow: 'tooltip',
      slots: {
        default: ({ row }) => {
          if (!Reflect.has(row, 'pendingStatus')) {
            row.pendingStatus = false;
          }
          return h(Switch, {
            checked: row.status === 1,
            checkedChildren: '已启用',
            unCheckedChildren: '已禁用',
            loading: row.pendingStatus,
            disabled: !hasPermission(PermissionsEnum.SecretKeyStatus, false),
            onChange(checked) {
              row.pendingStatus = true;
              const newStatus = checked ? 1 : 0;

              // 请求接口
              setSecretKeyStatus(row.id, newStatus)
                .then((res) => {
                  notify(res, true);
                  row.status = newStatus;
                })
                .catch((e) => {
                  console.log('@@@ setMenuStatus', e);
                })
                .finally(() => {
                  row.pendingStatus = false;
                });
            },
          });
        },
      },
      align: 'center',
    },
    {
      title: '备注',
      field: 'remark',
      minWidth: 160,
      showOverflow: 'tooltip',
      align: 'left',
    },
    {
      title: '创建时间',
      minWidth: 170,
      field: 'created_at',
      showOverflow: 'tooltip',
      align: 'center',
      sortable: true,
      // fixed: 'right',
    },
    {
      title: '修改时间',
      minWidth: 170,
      field: 'updated_at',
      showOverflow: 'tooltip',
      align: 'center',
      sortable: true,
      // fixed: 'right',
    },
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
    id: 'SecretKey',
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
    toolbarConfig: {
      buttons: [
        {
          content: '新增秘钥',
          visible: hasPermission(PermissionsEnum.SecretKeyAdd, false),
          buttonRender: {
            name: 'AButton',
            props: {
              type: 'primary',
              preIcon: 'mdi:page-next-outline',
            },
            events: {
              click: handleCreate,
            },
          },
        },
      ],
    },
  });

  // 操作按钮（权限控制）
  const createActions = (record) => {
    const actions: ActionItem[] = [
      {
        tooltip: '详情',
        icon: '',
        onClick: () => {
          console.log(record);
        },
      },
      {
        tooltip: '编辑',
        icon: 'clarity:note-edit-line',
        onClick: () => {},
      },
    ];

    return actions;
  };
</script>
