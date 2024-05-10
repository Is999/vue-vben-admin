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
          v-if="hasPermission(PermissionsEnum.MenuAdd, false)"
        >
          新增菜单
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
                disabled: record.status !== 1,
                ifShow: hasPermission(PermissionsEnum.MenuAdd, false),
              },
              {
                icon: 'clarity:note-edit-line',
                tooltip: '编辑菜单',
                onClick: handleEdit.bind(null, record),
                disabled: !hasPermission(PermissionsEnum.MenuEdit, false),
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <MenuDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>
<script setup lang="ts">
  import { h, nextTick, ref } from 'vue';
  import { BasicColumn, BasicTable, FormSchema, TableAction, useTable } from '@/components/Table';
  import { getMenuList, setMenuStatus } from '@/api/admin/system';
  import { useDrawer } from '@/components/Drawer';
  import MenuDrawer from './MenuDrawer.vue';
  import { usePermission } from '@/hooks/web/usePermission';
  import { PermissionsEnum } from '@/enums/permissionsEnum';
  import { Switch, Tag } from 'ant-design-vue';
  import Icon from '@/components/Icon/Icon.vue';
  import { notify } from '@/api/api';

  const [registerDrawer, { openDrawer }] = useDrawer();
  const { hasPermission } = usePermission();

  const cache = ref(1);
  // 搜索框
  const searchFormSchema: FormSchema[] = [
    {
      field: 'title',
      label: '名称',
      labelWidth: 0,
      component: 'Input',
      colProps: { span: 5 },
    },
    {
      field: 'permissions_uuid',
      label: '标识',
      labelWidth: 50,
      component: 'Input',
      colProps: { span: 5 },
    },
    {
      field: 'title_lang',
      label: '语言',
      labelWidth: 50,
      component: 'Input',
      colProps: { span: 5 },
    },
    {
      field: 'status',
      label: '状态',
      labelWidth: 50,
      component: 'Select',
      colProps: { span: 4 },
      componentProps: {
        options: [
          { label: '显示', value: 1 },
          { label: '隐藏', value: 0 },
        ],
      },
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
          // change: (value) => {
          //   console.log('@@@@ value', value);
          //   cache.value = parseInt(value);
          // },
        };
      },
      colProps: { span: 4, push: 1 },
    },
  ];

  // Table 数据
  const columns: BasicColumn[] = [
    {
      title: '菜单名称',
      dataIndex: 'title',
      align: 'left',
      width: 200,
      fixed: 'left',
      resizable: true,
    },
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      resizable: true,
      sorter: true,
    },
    {
      title: '图标',
      dataIndex: 'icon',
      width: 80,
      resizable: true,
      customRender: ({ record }) => {
        return h(Icon, { icon: record.icon });
      },
    },
    {
      title: '权限标识',
      dataIndex: 'permissions_uuid',
      width: 160,
      resizable: true,
    },
    {
      title: '菜单(语言)',
      dataIndex: 'title_lang',
      width: 220,
      resizable: true,
    },
    {
      title: '路径',
      dataIndex: 'path',
      width: 180,
      resizable: true,
    },
    {
      title: '组件',
      dataIndex: 'component',
      width: 220,
      resizable: true,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 120,
      resizable: true,
      sorter: true,
    },
    {
      title: '快捷',
      dataIndex: 'is_shortcut',
      width: 100,
      resizable: true,
      filters: [
        { text: '是', value: '1' },
        { text: '否', value: '0' },
      ],
      customRender: ({ record }) => {
        const status = record.is_shortcut;
        const enable = status === 1;
        const color = enable ? 'green' : 'default';
        const text = enable ? '是' : '否';
        return h(Tag, { color: color }, () => text);
      },
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
        //console.log('@@@', record.title, record.status);
        return h(Switch, {
          checked: record.status === 1,
          checkedChildren: '显示',
          unCheckedChildren: '隐藏',
          loading: record.pendingStatus,
          disabled: !hasPermission(PermissionsEnum.MenuStatus, false),
          onChange(checked) {
            record.pendingStatus = true;
            const newStatus = checked ? 1 : 0;

            // 请求接口
            setMenuStatus(record.id, newStatus)
              .then((res) => {
                notify(res, true);
                record.status = newStatus;
              })
              .catch((e) => {
                console.log('@@@ setMenuStatus', e);
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
      width: 180,
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

  const [registerTable, { reload, expandAll, expandRows, setLoading, collapseAll }] = useTable({
    title: '菜单列表',
    defaultExpandAllRows: cache.value == 1,
    api: getMenuList,
    // onExpand,
    columns,
    beforeFetch,
    rowKey: 'id',
    formConfig: {
      schemas: searchFormSchema,
      submitOnReset: false,
    },
    isTreeTable: true,
    useSearchForm: true,
    showTableSetting: true,
    bordered: true,
    showIndexColumn: false,
    actionColumn: {
      width: 70,
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
    openDrawer(true, {
      record,
      isUpdate: true,
    });
  }

  // 编辑|新增成功后重新reload
  function handleSuccess() {
    reload();
  }

  // 提交数据到接口之前的钩子
  function beforeFetch(value) {
    // 快捷
    if (value.is_shortcut) {
      if (value.is_shortcut.length === 1) {
        value.is_shortcut = value.is_shortcut[0];
      } else {
        delete value['is_shortcut'];
      }
    }

    return value;
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
      // 加载childern list数据
      onExpand(true, record);

      // 展开行
      expandRows([record.id as string]);
    }
  }

  // 异步加载子数据
  function onExpand(expanded, record) {
    if (!expanded) return; //如果是关闭就返回
    if (record.children && record.children.length > 0) return; //如果已经有数据就返回
    const id = record.id;

    // 开启loading 动画
    setLoading(true);

    // 发送请求
    getMenuList({ pid: id, cache: 0 })
      .then((res) => {
        //获取到的子节点
        record.children = res.items;
      })
      .catch((e) => {
        console.log('@@@ getMenuList', e);
      })
      .finally(() => {
        // 关闭loading 动画
        setLoading(false);
      });
  }

  // 拖拽列重新渲染
  // function handleResizeColumn(w, col) {
  //   const cols = getColumns();
  //   const index = cols.findIndex((value, index) => {
  //     if (value.dataIndex === col.dataIndex) {
  //       return index;
  //     }
  //   });
  //   if (index >= 0) {
  //     cols[index].width = w;
  //     setColumns(cols);
  //   }
  // }
</script>
