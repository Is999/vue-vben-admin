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
        <a-button @click="expandAll(true)" class="mr-2"> 展开全部 </a-button>
        <a-button @click="expandAll(false)" class="mr-2"> 折叠全部 </a-button>
        <BasicTree
          v-if="treeData.length"
          v-model:value="model[field]"
          :treeData="treeData"
          :fieldNames="{ key: 'id', title: 'title' }"
          :checkable="true"
          :search="true"
          title="角色权限"
          :helpMessage="['权限分配规则: 超级管理员权限不可编辑, 上级角色有得权限下级角色才能编辑']"
          :actionList="actionList"
          :defaultExpandAll="true"
          :showLine="true"
          @check="actionCheck"
          ref="treeRef"
        />
      </template>
    </BasicForm>
  </BasicDrawer>
</template>
<script setup lang="ts">
  import { ref, computed, h, unref } from 'vue';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { getRolePermissionTreeList } from '/@/api/admin/system';
  import { BasicTree, TreeItem, TreeActionItem, TreeActionType } from '/@/components/Tree';
  import { Tooltip } from 'ant-design-vue';
  import type { Nullable } from '@vben/types';
  import { isArray } from '@/utils/is';

  const rowId = ref('角色权限'); // 编辑记录的id
  const treeData = ref<TreeItem[]>([]); // 权限树结构
  const treeRef = ref<Nullable<TreeActionType>>(null);

  function getTree() {
    const tree = unref(treeRef);
    if (!tree) {
      throw new Error('tree is null!');
    }
    return tree;
  }

  function expandAll(checkAll: boolean) {
    getTree().expandAll(checkAll);
  }

  function actionCheck(checkKeys, e) {
    let keys = isArray(checkKeys) ? checkKeys : checkKeys.checked;
    // console.log('checkKeys: ', checkKeys, 'node: ', e, 'keys: ', keys);

    if (e.checked) {
      const index = keys.indexOf(e.node.eventKey);
      if (index !== -1) {
        keys.splice(index, 1);
      }
    } else {
      keys.push(e.node.eventKey);
    }

    if (!isArray(checkKeys)) {
      checkKeys.checked = keys;
    }
    //console.log('@@@setCheckedKeys', checkKeys, keys);
    getTree().setCheckedKeys(checkKeys);
  }

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
      value.disableCheckbox = !value.checked;
      value.selectable = !value.selectable;
      value.disabled = value.disabled || !value.checked;
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
    } catch (e) {
      console.log('@@@ useDrawerInner', e);
    } finally {
      setDrawerProps({ loading: false });
    }
  });

  // 标题
  const getTitle = computed(() => rowId.value);
</script>
