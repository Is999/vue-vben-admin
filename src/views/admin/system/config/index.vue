<template>
  <div>
    <BasicTable @register="registerTable" @resizeColumn="handleResizeColumn">
      <template #toolbar>
        <a-button
          type="primary"
          @click="handleCreate"
          v-if="hasPermission(PermissionsEnum.ConfigAdd, false)"
          >新增配置
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:note-edit-line',
                tooltip: '编辑配置',
                ifShow: hasPermission(PermissionsEnum.ConfigEdit, false),
                onClick: handleEdit.bind(null, record),
              },
              {
                icon: 'ant-design:cloud-server-outlined',
                tooltip: '查看配置缓存数据',
                ifShow: hasPermission(PermissionsEnum.ConfigGetCache, false),
                onClick: handleGetCache.bind(null, record),
              },
              {
                icon: 'ant-design:sync-outlined',
                tooltip: '刷新缓存',
                ifShow: hasPermission(PermissionsEnum.ConfigRenew, false),
                popConfirm: {
                  title: '是否确认刷新: ' + record.title + '[' + record.uuid + ']',
                  placement: 'left',
                  confirm: handleRenew.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <ConfigDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>
<script setup lang="ts">
  import { h } from 'vue';
  import { BasicColumn, BasicTable, FormSchema, TableAction, useTable } from '/@/components/Table';
  import { configGetCache, configRenew, getConfigList } from '/@/api/admin/system';
  import { PermissionsEnum } from '/@/enums/roleEnum';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { useDrawer } from '/@/components/Drawer';
  import ConfigDrawer from './ConfigDrawer.vue';
  import { Modal, Tag } from 'ant-design-vue';
  import { JsonPreview } from '/@/components/CodeEditor';
  import { notify } from '/@/api/api';

  const { hasPermission } = usePermission();

  // const cache = ref(1);
  // 搜索框
  const searchFormSchema: FormSchema[] = [
    {
      field: 'title',
      label: '名称',
      labelWidth: 60,
      component: 'Input',
      colProps: { span: 5 },
    },
    {
      field: 'uuid',
      label: '唯一标识',
      labelWidth: 100,
      component: 'Input',
      colProps: { span: 5 },
    },
  ];

  // 数据列
  const columns: BasicColumn[] = [
    {
      title: '名称',
      dataIndex: 'title',
      width: 200,
      fixed: 'left',
      resizable: true,
    },
    {
      title: '唯一标识',
      dataIndex: 'uuid',
      width: 200,
      resizable: true,
    },
    {
      title: '配置值',
      dataIndex: 'value',
      width: 200,
      resizable: true,
    },
    {
      title: '值类型',
      dataIndex: 'type',
      width: 90,
      resizable: true,
      customRender: ({ record }) => {
        let content = '';
        let color = 'default';
        switch (record.type) {
          case 0:
            color = 'default';
            content = `String`;
            break;
          case 1:
            color = '#eea02e';
            content = `Integer`;
            break;
          case 2:
            color = '#03adbe';
            content = `Float`;
            break;
          case 3:
            color = '#0b6c19';
            content = `Boolean`;
            break;
          case 4:
            color = '#457cf5';
            content = `JsonArr`;
            break;
          default:
            color = '#56534f';
            content = `String`;
            break;
        }
        return h(Tag, { color: color }, () => content);
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 200,
      resizable: true,
    },
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
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

  const [registerDrawer, { openDrawer }] = useDrawer();
  const [
    registerTable,
    {
      reload,
      setColumns,
      getColumns,
      setLoading,
      // expandRows,
      // expandAll, collapseAll
    },
  ] = useTable({
    title: '配置列表',
    // isTreeTable: true,
    // childrenColumnName: 'child_recursion',
    // defaultExpandAllRows: cache.value == 1,
    api: getConfigList,
    // onExpand,
    rowKey: 'id',
    columns,
    formConfig: {
      labelWidth: 80,
      schemas: searchFormSchema,
      autoSubmitOnEnter: true,
    },
    useSearchForm: true,
    showTableSetting: true,
    bordered: true,
    actionColumn: {
      width: 100,
      title: '操作',
      dataIndex: 'action',
      fixed: 'right',
    },
  });

  // 新增
  function handleCreate() {
    openDrawer(true, {
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

  // 查看缓存配置
  function handleGetCache(record: Recordable) {
    // 开启loading 动画
    setLoading(true);

    // 请求数据
    configGetCache(record.uuid)
      .then((res) => {
        try {
          let obj = JSON.parse(res.value);
          if (typeof obj == 'object' && obj) {
            Modal.info({
              title: record.title + '[' + record.uuid + ']',
              content: h(JsonPreview, { data: JSON.parse(res.value) }),
            });
            return;
          }
        } catch (e) {
          console.log('@@@ Cache 不是有效的json', e, res);
        }

        Modal.info({
          title: record.title + '[' + record.uuid + ']',
          content: h(JsonPreview, { data: res.value }),
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  // 刷新缓存配置
  function handleRenew(record: Recordable) {
    // 开启loading 动画
    setLoading(true);

    // 刷新缓存
    configRenew(record.uuid)
      .then((res) => {
        notify(res, true);
      })
      .finally(() => {
        setLoading(false);
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
