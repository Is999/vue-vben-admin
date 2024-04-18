<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <Button
          type="primary"
          @click="handleCreate"
          v-if="hasPermission(PermissionsEnum.AccountAdd, false)"
          >新增账号
        </Button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:note-edit-line',
                tooltip: '编辑用户资料',
                ifShow: hasPermission(PermissionsEnum.AccountEdit, false),
                onClick: handleEdit.bind(null, record),
              },
              {
                icon: 'ant-design:rocket-outlined',
                tooltip: '编辑用户角色',
                ifShow: hasPermission(PermissionsEnum.AccountEditRoles, false),
                onClick: handleEditRoles.bind(null, record),
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <AccountDrawer @register="registerDrawer" @success="handleSuccess" />
    <EditAccountDrawer @register="registerDrawer1" @success="handleSuccess" />
    <AccountRolesDrawer @register="registerDrawer2" />
  </div>
</template>
<script setup lang="ts">
  import { h } from 'vue';
  import { BasicColumn, BasicTable, FormSchema, TableAction, useTable } from '/@/components/Table';
  import { getAccountList, getRoleTreeList, setAccountStatus } from '/@/api/admin/system';
  import AccountDrawer from './AccountDrawer.vue';
  import EditAccountDrawer from './EditAccountDrawer.vue';
  import AccountRolesDrawer from './AccountRolesDrawer.vue';
  import { Switch, Button } from 'ant-design-vue';
  import { PermissionsEnum } from '/@/enums/permissionsEnum';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { useDrawer } from '/@/components/Drawer';
  import { notify } from '/@/api/api';

  const { hasPermission } = usePermission();

  // 搜索框
  const searchFormSchema: FormSchema[] = [
    {
      field: 'name',
      label: '账号',
      labelWidth: 60,
      component: 'Input',
      colProps: { span: 6 },
    },
    {
      field: 'email',
      label: '邮箱',
      labelWidth: 60,
      component: 'Input',
      colProps: { span: 6 },
    },
    {
      field: 'role',
      label: '角色',
      labelWidth: 60,
      component: 'ApiTreeSelect',
      componentProps: {
        // more details see /src/components/Form/src/components/ApiSelect.vue
        api: getRoleTreeList,
        fieldNames: {
          label: 'title',
          key: 'id',
          value: 'id',
        },
        labelField: 'title',
        valueField: 'id',
        showSearch: true,
        treeNodeFilterProp: 'title',
        treeDefaultExpandAll: true,
      },
      colProps: { span: 6 },
    },
    {
      field: 'status',
      label: '状态',
      labelWidth: 60,
      component: 'Select',
      colProps: { span: 5 },
      componentProps: {
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ],
      },
    },
  ];

  // 数据列
  const columns: BasicColumn[] = [
    {
      title: '账号',
      dataIndex: 'name',
      width: 160,
      fixed: 'left',
      resizable: true,
    },
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      resizable: true,
      sorter: true,
    },
    {
      title: '昵称',
      dataIndex: 'real_name',
      width: 120,
      resizable: true,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      width: 160,
      resizable: true,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      resizable: true,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      resizable: true,
      customRender: ({ record }) => {
        return h(
          'a',
          {
            onClick() {
              openDrawer2(true, { record, isUpdate: false });
            },
          },
          '查看角色',
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      customRender: ({ record }) => {
        if (!Reflect.has(record, 'pendingStatus')) {
          record.pendingStatus = false;
        }
        return h(Switch, {
          checked: record.status == 1,
          checkedChildren: '已启用',
          unCheckedChildren: '已禁用',
          loading: record.pendingStatus,
          disabled: !hasPermission(PermissionsEnum.AccountStatus, false),
          onChange(checked: boolean) {
            record.pendingStatus = true;
            // 请求接口
            setAccountStatus(record.id, checked)
              .then((res) => {
                notify(res, true);
                record.status = checked ? 1 : 0;
              })
              .catch((e) => {
                console.log('@@@ setAccountStatus', e);
              })
              .finally(() => {
                record.pendingStatus = false;
              });
          },
        });
      },
    },
    {
      title: '最后登录时间',
      dataIndex: 'last_login_time',
      width: 180,
      resizable: true,
      sorter: true,
    },
    {
      title: '最后登录IP',
      dataIndex: 'last_login_ip',
      width: 120,
      resizable: true,
    },
    {
      title: 'IP属地',
      dataIndex: 'last_login_ipaddr',
      width: 180,
      resizable: true,
    },
    {
      title: '简介',
      dataIndex: 'remark',
      width: 180,
      resizable: true,
      sorter: true,
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
  const [registerDrawer1, { openDrawer: openDrawer1 }] = useDrawer();
  const [registerDrawer2, { openDrawer: openDrawer2 }] = useDrawer();
  const [registerTable, { reload }] = useTable({
    title: '账号列表',
    api: getAccountList,
    rowKey: 'id',
    columns,
    formConfig: {
      labelWidth: 120,
      schemas: searchFormSchema,
      autoSubmitOnEnter: true,
    },
    useSearchForm: true,
    showTableSetting: true,
    bordered: true,
    actionColumn: {
      width: 70,
      title: '操作',
      dataIndex: 'action',
      fixed: 'right',
    },
  });

  // 新增
  function handleCreate() {
    openDrawer(true, {
      isUpdate: false,
      step: 0,
    });
  }

  // 编辑
  function handleEdit(record: Recordable) {
    openDrawer1(true, {
      record,
    });
  }

  // 编辑角色
  function handleEditRoles(record: Recordable) {
    openDrawer2(true, {
      record,
      isUpdate: true,
    });
  }

  // 编辑|新增成功后重新reload
  function handleSuccess() {
    reload();
  }
</script>
