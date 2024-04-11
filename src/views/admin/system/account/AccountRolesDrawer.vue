<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :title="title"
    :isDetail="true"
    :showOkBtn="isUpdate && hasPermission(PermissionsEnum.AccountEditRolesSave, false)"
    @ok="handleSubmit"
  >
    <BasicForm @register="registerForm">
      <template #roles="{ model, field }">
        <BasicTree
          title="账号角色"
          v-if="treeData.length"
          v-model:value="model[field]"
          :treeData="treeData"
          :fieldNames="{ key: 'id', title: 'title' }"
          checkable
          search
          defaultExpandAll
          checkStrictly
        />
      </template>
    </BasicForm>
  </BasicDrawer>
</template>
<script setup lang="ts">
  import { ref } from 'vue';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { accountEditRoles, accountRoles, getAccountRoleTreeList } from '/@/api/admin/system';
  import { BasicTree, TreeItem } from '/@/components/Tree';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { PermissionsEnum } from '/@/enums/roleEnum';
  import { notify } from '/@/api/api';

  const { hasPermission } = usePermission();
  const isUpdate = ref(false); // true 编辑
  const rowId = ref(0); // 编辑记录的id
  const title = ref('编辑账号角色'); // 标题
  const treeData = ref<TreeItem[]>([]); // 权限树结构

  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    labelWidth: 100,
    schemas: [
      {
        label: ' ',
        field: 'roles',
        slot: 'roles',
        component: 'Input',
        defaultValue: [],
        colProps: { lg: 22, md: 22 },
      },
    ],
    showActionButtonGroup: false,
    baseColProps: { lg: 12, md: 24 },
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true });
      await resetFields();
      isUpdate.value = data?.isUpdate; // 编辑

      const roles = await accountRoles(data?.record?.id || 0);

      // 需要在setFieldsValue之前先填充treeData，否则Tree组件可能会报key not exist警告
      if (treeData.value.length === 0) {
        treeData.value = (await getAccountRoleTreeList()) as any as TreeItem[];
      }

      rowId.value = data?.record?.id;
      title.value = isUpdate.value
        ? `编辑账号 ` + data?.record?.name + ` 角色信息`
        : `账号 ` + data?.record?.name + ` 角色信息`;
      await setFieldsValue({
        roles: roles,
      });
    } finally {
      setDrawerProps({ loading: false });
    }
  });

  // 提交数据
  async function handleSubmit() {
    try {
      const values = await validate();
      setDrawerProps({ loading: true });
      values.roles = values.roles.checked ?? values.roles;
      values.id = rowId.value;
      // 发起请求
      await accountEditRoles(rowId.value, values).then((res) => {
        notify(res, true);
      });

      // 关闭
      closeDrawer();
    } finally {
      setDrawerProps({ loading: false });
    }
  }
</script>
