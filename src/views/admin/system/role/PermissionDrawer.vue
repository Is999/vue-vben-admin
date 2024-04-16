<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :showOkBtn="false"
    :title="getTitle"
    :isDetail="true"
  >
    <BasicForm @register="registerForm">
      <template #permissions="{ model, field }">
        <BasicTree
          v-if="treeData.length"
          v-model:value="model[field]"
          :treeData="treeData"
          :fieldNames="{ key: 'id', title: 'title' }"
          checkable
          search
          title="角色权限"
          :helpMessage="['权限分配规则: 超级管理员权限不可编辑, 上级角色有得权限下级角色才能编辑']"
          :actionList="actionList"
          defaultExpandAll
          toolbar
        />
      </template>
    </BasicForm>
  </BasicDrawer>
</template>
<script setup lang="ts">
  import { ref, computed, h } from 'vue';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { getRolePermissionTreeList } from '/@/api/admin/system';
  import { BasicTree, TreeItem, TreeActionItem } from '/@/components/Tree';
  import { Tooltip } from 'ant-design-vue';

  const rowId = ref('角色权限'); // 编辑记录的id
  const treeData = ref<TreeItem[]>([]); // 权限树结构

  const [registerForm, { resetFields, setFieldsValue }] = useForm({
    labelWidth: 100,
    schemas: [
      {
        label: ' ',
        field: 'permissions_id',
        slot: 'permissions',
        component: 'Input',
        defaultValue: [],
        colProps: { lg: 22, md: 22 },
      },
    ],
    showActionButtonGroup: false,
    baseColProps: { lg: 12, md: 24 },
  });

  const actionList: TreeActionItem[] = [
    {
      render: (record) => {
        let content = `标识：${record.uuid} <br/>名称：${record.title} <br/>`;
        if (isNaN(record.module)) {
          content += `API路由：${record.module} <br/>`;
        }
        content += `描述：${record.describe}`;
        return h(
          Tooltip,
          {
            title: h('div', {
              innerHTML: content,
            }),
          },
          () => '详情',
        );
      },
    },
  ];

  // Checkbox 禁用
  function recursion(arr: TreeItem[]) {
    arr.forEach((value) => {
      value.disableCheckbox = true;
      value.selectable = false;
      if (value.children) {
        recursion(value.children);
      }
    });
  }

  const [registerDrawer, { setDrawerProps }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true });
      await resetFields();
      // 需要在setFieldsValue之前先填充treeData，否则Tree组件可能会报key not exist警告
      treeData.value = (await getRolePermissionTreeList(
        data?.record?.id || 0,
        false,
      )) as any as TreeItem[];

      recursion(treeData.value);

      const permissionsId = isNaN(data?.record?.permissions_id)
        ? data?.record?.permissions_id?.split(',').map(function (item) {
            return parseInt(item, 10);
          })
        : [];

      rowId.value = data?.record.title; // 设置标题

      await setFieldsValue({
        ...data.record,
        permissions_id: permissionsId,
      });
    } finally {
      setDrawerProps({ loading: false });
    }
  });

  // 标题
  const getTitle = computed(() => rowId.value);
</script>
