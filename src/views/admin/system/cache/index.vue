<template>
  <div class="p-4">
    <BasicTable @register="registerTable" @resizeColumn="handleResizeColumn">
      <template #toolbar>
        <a-button
          color="success"
          @click="handleInfo"
          v-if="hasPermission(PermissionsEnum.CacheGetInfo, false)"
          >服务器信息
        </a-button>
        <Button
          type="primary"
          danger
          @click="handleRenewAll"
          v-if="hasPermission(PermissionsEnum.CacheRenewAll, false)"
          >刷新全部
        </Button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:sync-outlined',
                tooltip: '刷新缓存',
                ifShow: hasPermission(PermissionsEnum.CacheRenew, false),
                popConfirm: {
                  title: '是否确认刷新: ' + record.title + '[' + record.keyTitle + ']',
                  placement: 'left',
                  confirm: handleRenew.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <InfoDrawer @register="registerDrawer" />
  </div>
</template>
<script setup lang="ts">
  import { h } from 'vue';
  import { BasicTable, useTable, TableAction, BasicColumn } from '/@/components/Table';
  import { cacheRenew, cacheRenewAll, getCacheList } from '/@/api/admin/system';
  import { PermissionsEnum } from '/@/enums/roleEnum';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { useDrawer } from '/@/components/Drawer';
  import InfoDrawer from './info.vue';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { notify } from '/@/api/api';
  import { Button } from 'ant-design-vue';

  const { hasPermission } = usePermission();
  const { createConfirm } = useMessage();

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
      dataIndex: 'index',
      width: 200,
      resizable: true,
    },
    {
      title: 'KEY',
      dataIndex: 'keyTitle',
      width: 200,
      resizable: true,
    },
    {
      title: 'CLASS',
      dataIndex: 'class',
      width: 200,
      resizable: true,
    },
    {
      title: 'METHOD',
      dataIndex: 'method',
      width: 200,
      resizable: true,
    },
    {
      title: '过期时间',
      dataIndex: 'expires',
      width: 120,
      resizable: true,
      customRender: ({ value }) => {
        return value == 0 ? '永不过期' : value + ' 秒';
      },
    },
    {
      title: '数据类型',
      dataIndex: 'type',
      width: 200,
      resizable: true,
      customRender: ({ record }) => {
        let content = '';
        let color = 'default';
        switch (record.type) {
          case 1:
            color = 'default';
            content = `字符串(String)`;
            break;
          case 2:
            color = '#4063c2';
            content = `集合(Set)`;
            break;
          case 3:
            color = '#03adbe';
            content = `列表(List)`;
            break;
          case 4:
            color = '#0b6c19';
            content = `有序集合(Sorted Set)`;
            break;
          case 5:
            color = '#f19910';
            content = `哈希(Hash)`;
            break;
          default:
            color = '#56534f';
            content = `其它`;
            break;
        }
        return h('span', { style: { color: color } }, content);
      },
    },
  ];

  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerTable, { setColumns, getColumns, setLoading }] = useTable({
    title: '缓存列表',
    api: getCacheList,
    rowKey: 'index',
    columns,
    useSearchForm: false,
    showTableSetting: true,
    bordered: true,
    actionColumn: {
      width: 70,
      title: '操作',
      dataIndex: 'action',
      fixed: 'right',
    },
  });

  // 服务器信息
  function handleInfo() {
    openDrawer(true, {
      isUpdate: false,
    });
  }

  // 刷新全部
  function handleRenewAll() {
    createConfirm({
      onOk: () => {
        // 开启loading 动画
        setLoading(true);

        // 刷新缓存
        cacheRenewAll()
          .then((res) => {
            notify(res, true);
          })
          .finally(() => {
            setLoading(false);
          });
      },
      iconType: 'error',
      title: '注意',
      content:
        '<h5 style="color:red">非必要请勿用此按钮刷新全部缓存，可以使用下方列表内刷新按钮，刷新指定key！</h5>如果您已明白自己的行为并仍然要刷新全部缓存请点击确定按钮，否则点击取消按钮。',
    });
  }

  // 刷新
  function handleRenew(record: Recordable) {
    // 开启loading 动画
    setLoading(true);

    // 刷新缓存
    cacheRenew({ key: record.key, type: record.type })
      .then((res) => {
        notify(res, true);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  // 查看缓存配置
  /*  function handleGetCache(record: Recordable) {
    configGetCache(record.uuid).then((res) => {
      try {
        let obj = JSON.parse(res.value);
        if (typeof obj == 'object' && obj) {
          Modal.info({
            title: record.uuid,
            content: h(JsonPreview, { data: JSON.parse(res.value) }),
          });
          return;
        }
      } catch (e) {
        console.log('@@@ 不是有效的json', e, res);
      }
      Modal.info({
        title: record.uuid,
        content: res.value,
      });
    });
  }

  // 编辑|新增成功后重新reload
  function handleSuccess() {
    reload();
  }*/

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
