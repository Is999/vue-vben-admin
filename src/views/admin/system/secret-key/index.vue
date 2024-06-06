<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <AButton
          type="primary"
          @click="handleCreate"
          v-if="hasPermission(PermissionsEnum.ConfigAdd, false)"
          >新增秘钥
        </AButton>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:note-edit-line',
                tooltip: '编辑秘钥',
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
    <SecretKeyDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>
<script setup lang="ts">
  import { h } from 'vue';
  import { BasicColumn, BasicTable, FormSchema, TableAction, useTable } from '@/components/Table';
  import { configGetCache, configRenew, getSecretKeyList, setMenuStatus } from '@/api/admin/system';
  import { PermissionsEnum } from '@/enums/permissionsEnum';
  import { usePermission } from '@/hooks/web/usePermission';
  import { useDrawer } from '@/components/Drawer';
  import SecretKeyDrawer from './SecretKeyDrawer.vue';
  import { Modal, Switch } from 'ant-design-vue';
  import { JsonPreview } from '@/components/CodeEditor';
  import { notify } from '@/api/api';
  import { isArray } from '@/utils/is';

  const { hasPermission } = usePermission();

  // const cache = ref(1);
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
      field: 'uuid',
      label: 'App ID',
      labelWidth: 100,
      component: 'Input',
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
    // {
    //   title: 'ID',
    //   dataIndex: 'id',
    //   width: 60,
    //   resizable: true,
    // },
    {
      title: '名称',
      dataIndex: 'title',
      width: 180,
      align: 'left',
      fixed: 'left',
      resizable: true,
    },
    {
      title: 'App ID',
      dataIndex: 'uuid',
      width: 140,
      // fixed: 'left',
      resizable: true,
    },
    {
      title: 'AES KEY',
      dataIndex: 'aes_key',
      width: 180,
      align: 'left',
      resizable: true,
    },
    {
      title: 'AES IV',
      dataIndex: 'aes_iv',
      width: 180,
      align: 'left',
      resizable: true,
    },
    {
      title: 'RSA公钥',
      dataIndex: 'rsa_public_key_server',
      width: 180,
      align: 'left',
      resizable: true,
    },
    {
      title: 'RSA私钥',
      dataIndex: 'rsa_private_key_server',
      width: 180,
      align: 'left',
      resizable: true,
    },
    {
      title: 'RSA公钥[用户]',
      dataIndex: 'rsa_public_key_user',
      width: 180,
      align: 'center',
      resizable: true,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 200,
      resizable: true,
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
  const [registerTable, { reload, setLoading }] = useTable({
    title: '秘钥列表',
    api: getSecretKeyList,
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
      width: 140,
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
        if (record.type === 4) {
          if (isArray(res.value)) {
            Modal.info({
              title: record.title + '[' + record.uuid + ']',
              content: h(JsonPreview, { data: { Array: res.value } }),
            });
            return;
          }

          try {
            let obj = JSON.parse(res.value);
            if (typeof obj == 'object' && obj) {
              Modal.info({
                title: record.title + '[' + record.uuid + ']',
                content: h(JsonPreview, { data: { Json: JSON.parse(res.value) } }),
              });
              return;
            }
          } catch (e) {
            console.log('@@@ Cache 不是有效的json', e, res);
          }
        } else {
          const getValType = () => {
            let value;
            switch (record.type) {
              case 0:
                value = { String: res.value };
                break;
              case 1:
                value = { Integer: res.value };
                break;
              case 2:
                value = { Float: res.value };
                break;
              case 3:
                value = { Boolean: res.value };
                break;
              default:
                value = res.value;
            }
            return value;
          };
          Modal.info({
            title: record.title + '[' + record.uuid + ']',
            content: h(
              JsonPreview,
              {
                data: getValType(),
              },
              {},
            ),
          });
        }
      })
      .catch((e) => {
        console.log('@@@ configGetCache', e);
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
      .catch((e) => {
        console.log('@@@ configRenew', e);
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
  // function handleResizeColumn(w, col) {
  //   const cols = getColumns();
  //   const index = cols.findIndex((value, index) => {
  //     if (value.dataIndex === col.dataIndex) {
  //       return index;
  //     }
  //   });
  //
  //   if (index >= 0) {
  //     cols[index].width = w;
  //     setColumns(cols);
  //   }
  // }
</script>
