<template>
  <div>
    <BasicTable
      @register="registerTable"
      @row-dbClick="onDbClickRowExpand"
      @fetch-success="onFetchSuccess"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:plus-outlined',
                tooltip: '新增角色',
                onClick: handleCreate.bind(null, record),
                disabled: record.status !== 1,
                ifShow:
                  hasPermission(PermissionsEnum.RoleAdd, false) && hasRoles.bind(null, record),
              },
              {
                icon: 'clarity:note-edit-line',
                tooltip: '编辑角色',
                onClick: handleEdit.bind(null, record),
                disabled: !hasPermission(PermissionsEnum.RoleEdit, false),
                ifShow: record.id.toString() !== RoleEnum.SUPER && hasRoles.bind(null, record),
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                tooltip: '删除角色',
                ifShow:
                  hasPermission(PermissionsEnum.RoleDel, false) &&
                  record.id.toString() !== RoleEnum.SUPER &&
                  hasRoles.bind(null, record),
                popConfirm: {
                  title: '是否确认删除',
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <RoleDrawer @register="registerDrawer" @success="handleSuccess" />
    <PermissionDrawer @register="register1" />
  </div>
</template>
<script setup lang="ts">
  import { createVNode, h, nextTick, ref } from 'vue';
  import { BasicTable, useTable, TableAction, BasicColumn, FormSchema } from '/@/components/Table';
  import { roleDel, getRoleList, setRoleStatus } from '/@/api/admin/system';
  import { useDrawer } from '/@/components/Drawer';
  import RoleDrawer from './RoleDrawer.vue';
  import PermissionDrawer from './PermissionDrawer.vue';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { PermissionsEnum } from '/@/enums/permissionsEnum';
  import { PermissionListItem } from '/@/api/admin/model/systemModel';
  import { Modal, Switch } from 'ant-design-vue';
  import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
  import { notify } from '/@/api/api';
  import { RoleEnum } from '@/enums/roleEnum';

  const [registerDrawer, { openDrawer }] = useDrawer();
  const [register1, { openDrawer: openDrawer1 }] = useDrawer();
  const { hasPermission, hasRole } = usePermission();
  const cache = ref(1);

  // 数据列
  const columns: BasicColumn[] = [
    {
      title: '角色名称',
      dataIndex: 'title',
      width: 240,
      resizable: true,
      fixed: 'left',
    },
    {
      title: '角色ID',
      dataIndex: 'id',
      width: 80,
      resizable: true,
      sorter: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      resizable: true,
      customRender: ({ record }) => {
        if (!Reflect.has(record, 'pendingStatus')) {
          record.pendingStatus = false;
        }
        return h(Switch, {
          checked: record.status === 1,
          checkedChildren: '已启用',
          unCheckedChildren: '已禁用',
          loading: record.pendingStatus,
          disabled:
            record.id.toString() === RoleEnum.SUPER ||
            !(hasPermission(PermissionsEnum.RoleStatus, false) && hasRoles(record)),
          onChange(checked) {
            // 发送请求
            const request = () => {
              record.pendingStatus = true;
              const newStatus = checked ? 1 : 0;
              setRoleStatus(record.id, newStatus)
                .then((res) => {
                  notify(res, true);
                  // 修改状态
                  record.status = newStatus;
                  // 修改下级状态
                  if (!checked && record?.children) {
                    record?.children.forEach((child) => {
                      child.status = newStatus;
                    });
                  }
                })
                .catch((e) => {
                  console.log('@@@ setRoleStatus', e);
                })
                .finally(() => {
                  record.pendingStatus = false;
                });
            };

            // 禁用弹框提示
            if (!checked) {
              Modal.confirm({
                title: '提示:',
                icon: createVNode(ExclamationCircleOutlined),
                content: () => {
                  if (record?.children) {
                    return h('div', {
                      innerHTML: `<div>
                        <span style="color:red">注意: </span>禁用后角色[
                      <span style="color:red"> ${record.title} </span>
                      ]将不能使用后台功能哦!
                        <br />
                        <br />
                        &nbsp; &nbsp; &nbsp; &nbsp; 禁用
                        <span style="color:red"> ${record.title} </span> 角色, 会连带
                        <span style="color:red">禁用下级所有角色</span>哦!
                      </div>`,
                    });
                  }
                  return h('div', {
                    innerHTML: `<div>
                      <span style="color:red">注意: </span>禁用后角色[
                      <span style="color:red"> ${record.title} </span>
                      ]将不能使用后台功能哦!
                    </div>`,
                  });
                },
                okText: '确认',
                okType: 'danger',
                cancelText: '取消',
                onOk() {
                  request();
                },
                onCancel() {
                  // console.log('Cancel');
                },
              });
              return;
            }

            // 启用
            request();
          },
        });
      },
    },
    {
      title: '权限',
      dataIndex: 'permissions_id',
      width: 120,
      resizable: true,
      customRender: ({ record }) => {
        return h(
          'a',
          {
            onClick() {
              openDrawer1(true, { record });
            },
          },
          '查看权限',
        );
      },
    },
    {
      title: '备注',
      dataIndex: 'describe',
      width: 240,
      resizable: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      resizable: true,
      sorter: true,
    },
    {
      title: '创建时间',
      dataIndex: 'updated_at',
      width: 180,
      resizable: true,
      sorter: true,
    },
  ];

  // 搜索框
  const searchFormSchema: FormSchema[] = [
    {
      field: 'title',
      label: '名称',
      labelWidth: 60,
      component: 'Input',
      colProps: { span: 6 },
    },
    {
      field: 'status',
      label: '状态',
      labelWidth: 60,
      component: 'Select',
      componentProps: {
        options: [
          { label: '启用', value: 1 },
          { label: '停用', value: 0 },
        ],
      },
      colProps: { span: 6 },
    },
    {
      field: 'cache',
      label: '',
      labelWidth: 0,
      component: 'RadioButtonGroup',
      defaultValue: 1,
      componentProps: () => {
        return {
          options: [
            { label: '缓存', value: 1 },
            { label: '实时', value: 0 },
          ],
          onChange: (value) => {
            // console.log('@@@@', formModel, value);
            cache.value = value;
          },
        };
      },
      colProps: { span: 4, push: 1 },
    },
  ];

  const [
    registerTable,
    {
      reload,
      expandAll,
      expandRows,
      setLoading,
      collapseAll,
      deleteTableDataRecord,
      findTableDataRecord,
    },
  ] = useTable({
    title: '角色列表',
    defaultExpandAllRows: cache.value == 1,
    api: getRoleList,
    onExpand,
    columns,
    rowKey: 'id',
    formConfig: {
      schemas: searchFormSchema,
      submitOnReset: false,
    },
    isTreeTable: true,
    pagination: false,
    striped: false,
    useSearchForm: true,
    showTableSetting: true,
    bordered: true,
    showIndexColumn: false,
    actionColumn: {
      width: 100,
      title: '操作',
      dataIndex: 'action',
      fixed: 'right',
    },
  });

  // 新增
  function handleCreate(record: Recordable) {
    openDrawer(true, {
      record,
      isUpdate: false,
    });
  }

  // 编辑
  function handleEdit(record: Recordable) {
    openDrawer(true, {
      record,
      isUpdate: true,
    });
  }

  // 删除
  function handleDelete(record: Recordable) {
    // 开启 loading 动画
    setLoading(true);
    roleDel(record.id)
      .then((res) => {
        notify(res, true);
        // deleteTableDataRecord 方法删除指定key children数据视图重新渲染有bug
        // 这里只有第一层数据删除时使用 deleteTableDataRecord
        if (record.pid === 0) {
          deleteTableDataRecord(record.id);
        } else {
          // 找到上级然后删除
          const data = findTableDataRecord(record.pid) as PermissionListItem;
          data?.children?.forEach((item, key) => {
            if (item.id === record.id) {
              data.children?.splice(key, 1);
            }
          });
          // 空数组删除
          if (data?.children?.length === 0) {
            delete data.children;
          }
        }
      })
      .catch((e) => {
        console.log('@@@ roleDel', e);
      })
      .finally(() => {
        // 关闭loading 动画
        setLoading(false);
      });
  }

  // 编辑|新增成功后重新reload
  function handleSuccess() {
    reload();
  }

  // 关闭展开项
  function onFetchSuccess() {
    if (cache.value == 0) {
      nextTick(collapseAll);
    } else {
      nextTick(expandAll);
    }
  }

  // 双击展开
  function onDbClickRowExpand(record: Recordable) {
    if (record.children) {
      onExpand(true, record);
      expandRows([record.id as string]);
    }
  }

  // 异步加载子数据
  function onExpand(expanded, record) {
    if (!expanded) return; //如果是关闭就返回
    if (record.children && record.children.length > 0) return; //如果已经有数据就返回
    const id = record.id;

    // 开启 loading 动画
    setLoading(true);

    // 发送请求
    getRoleList({ pid: id, cache: 0 })
      .then((res) => {
        //获取到的子节点
        record.children = res.items;
      })
      .catch((e) => {
        console.log('@@@ getRoleList', e);
      })
      .finally(() => {
        // 关闭loading 动画
        setLoading(false);
      });
  }

  // 是否包含角色
  function hasRoles(record: Recordable) {
    const pids = record.pids !== '' ? record.pids?.split(',') : '';
    return hasRole(record.id.toString(), false) || hasRole(pids, false);
  }
</script>
