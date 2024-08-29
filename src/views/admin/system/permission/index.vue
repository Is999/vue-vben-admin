<template>
  <div>
    <BasicTable
      @register="registerTable"
      @row-db-click="onDbClickRowExpand"
      @fetch-success="onFetchSuccess"
    >
      <template #toolbar>
        <AButton
          type="primary"
          @click="handleCreate"
          v-if="isDevMode() && hasPermission(PermissionsEnum.PermissionAdd, false)"
        >
          新增权限
        </AButton>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:plus-outlined',
                tooltip: '新增菜单',
                onClick: handleCreate.bind(null, record),
                ifShow: hasPermission(PermissionsEnum.PermissionAdd, false),
              },
              {
                icon: 'clarity:note-edit-line',
                tooltip: '编辑权限',
                onClick: handleEdit.bind(null, record),
                disabled: !hasPermission(PermissionsEnum.PermissionEdit, false),
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                tooltip: '删除权限',
                ifShow: hasPermission(PermissionsEnum.PermissionDel, false),
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
    <PermissionDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>
<script setup lang="ts">
  import { h, nextTick, ref } from 'vue';
  import { BasicTable, useTable, TableAction, BasicColumn, FormSchema } from '@/components/Table';
  import { permissionDel, getPermissionList, setPermissionStatus } from '@/api/admin/system';
  import { useDrawer } from '@/components/Drawer';
  import PermissionDrawer from './PermissionDrawer.vue';
  import { usePermission } from '@/hooks/web/usePermission';
  import { PermissionsEnum } from '@/enums/permissionsEnum';
  import { PermissionListItem } from '@/api/admin/model/systemModel';
  import { Switch, Tag } from 'ant-design-vue';
  import { notify } from '@/api/api';
  import { isDevMode } from '@/utils/env';

  const [registerDrawer, { openDrawer }] = useDrawer();
  const { hasPermission } = usePermission();

  const cache = ref(1);

  // Table 数据
  const columns: BasicColumn[] = [
    {
      title: '权限名称',
      dataIndex: 'title',
      align: 'left',
      width: 200,
      resizable: true,
      fixed: 'left',
    },
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      resizable: true,
      sorter: true,
    },
    {
      title: '权限标识',
      dataIndex: 'uuid',
      width: 200,
      resizable: true,
    },
    {
      title: '权限模型',
      dataIndex: 'module',
      width: 200,
      resizable: true,
      customRender: ({ value }) => {
        if (!isNaN(value)) {
          return '';
        }
        return value;
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      resizable: true,
      // filters: [
      //   { text: '目录', value: 4 },
      //   { text: '菜单', value: 5 },
      //   { text: '按钮', value: 7 },
      //   { text: '新增', value: 1 },
      //   { text: '修改', value: 2 },
      //   { text: '删除', value: 3 },
      //   { text: '查看', value: 0 },
      //   { text: '页面', value: 6 },
      //   { text: '其它', value: 8 },
      // ],
      customRender: ({ record }) => {
        let content = '';
        let color: string;
        switch (record.type) {
          case 0:
            color = 'default';
            content = `查看`;
            break;
          case 1:
            color = '#986416';
            content = `新增`;
            break;
          case 2:
            color = '#986416';
            content = `修改`;
            break;
          case 3:
            color = '#ea0630';
            content = `删除`;
            break;
          case 4:
            color = '#0b6c19';
            content = `目录`;
            break;
          case 5:
            color = '#0b6c19';
            content = `菜单`;
            break;
          case 6:
            color = '#03adbe';
            content = `页面`;
            break;
          case 7:
            color = '#0433a9';
            content = `按钮`;
            break;
          default:
            color = '#56534f';
            content = `其它`;
            break;
        }
        return h(Tag, { color: color }, () => content);
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
          disabled: !hasPermission(PermissionsEnum.PermissionStatus, false),
          onChange: (checked) => {
            record.pendingStatus = true;
            const newStatus = checked ? 1 : 0;
            // 请求接口
            setPermissionStatus(record.id, newStatus)
              .then((res) => {
                notify(res, true);
                record.status = newStatus;
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
      title: '备注',
      dataIndex: 'describe',
      width: 200,
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
      title: '更新时间',
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
      labelWidth: 50,
      component: 'Input',
      colProps: { span: 5 },
    },
    {
      field: 'uuid',
      label: '标识',
      labelWidth: 50,
      component: 'Input',
      colProps: { span: 4 },
    },
    {
      field: 'module',
      label: '模型',
      labelWidth: 50,
      component: 'Input',
      colProps: { span: 5 },
    },
    {
      field: 'type',
      label: '类型',
      labelWidth: 50,
      component: 'Select',
      colProps: { span: 3 },
      componentProps: {
        mode: 'multiple',
        options: [
          { label: '目录', value: 4 },
          { label: '菜单', value: 5 },
          { label: '按钮', value: 7 },
          { label: '新增', value: 1 },
          { label: '修改', value: 2 },
          { label: '删除', value: 3 },
          { label: '查看', value: 0 },
          { label: '页面', value: 6 },
          { label: '其它', value: 8 },
        ],
      },
    },
    {
      field: 'status',
      label: '状态',
      labelWidth: 50,
      component: 'Select',
      colProps: { span: 3 },
      componentProps: {
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ],
      },
    },
    {
      field: 'cache',
      label: ' ',
      labelWidth: 14,
      component: 'RadioButtonGroup',
      defaultValue: 1,
      componentProps: () => {
        return {
          options: [
            { label: '缓存', value: 1 },
            { label: '实时', value: 0 },
          ],
          // onChange: (value) => {
          //   // console.log('@@@@', formModel, value);
          //   cache.value = value;
          // },
        };
      },
      colProps: { span: 4 },
    },
  ];

  const [
    registerTable,
    {
      reload,
      expandRows,
      setLoading,
      expandAll,
      collapseAll,
      deleteTableDataRecord,
      findTableDataRecord,
      // scrollTo,
    },
  ] = useTable({
    title: '权限列表',
    isTreeTable: true,
    defaultExpandAllRows: cache.value == 1,
    api: getPermissionList,
    // dataSource: getPermissionList(),
    // onExpand,
    columns,
    rowKey: 'id',
    formConfig: {
      schemas: searchFormSchema,
      submitOnReset: false,
    },
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
      record: record ?? null,
      isUpdate: false,
    });
  }

  // 编辑
  function handleEdit(record: Recordable) {
    // scrollTo('top');
    openDrawer(true, {
      record,
      isUpdate: true,
    });
  }

  // 删除
  function handleDelete(record: Recordable) {
    // 开启 loading 动画
    setLoading(true);
    permissionDel(record.id)
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
        console.log('@@@ permissionDel', e);
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
    getPermissionList({ pid: id, cache: 0 })
      .then((res) => {
        //获取到的子节点
        record.children = res.items;
      })
      .catch((e) => {
        console.log('@@@ getPermissionList', e);
      })
      .finally(() => {
        // 关闭loading 动画
        setLoading(false);
      });
  }
</script>
