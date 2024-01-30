<template>
  <div class="step2">
    <BasicForm @register="registerForm">
      <template #roles="{ model, field }">
        <BasicTree
          v-if="treeData.length"
          v-model:value="model[field]"
          :treeData="treeData"
          :fieldNames="{ key: 'id', title: 'title' }"
          checkable
          search
          title="账号角色"
          defaultExpandAll
          checkStrictly
        />
      </template>
    </BasicForm>
  </div>
</template>

<script setup lang="ts">
  import { onBeforeMount, ref } from 'vue';
  import { BasicForm, useForm } from '/@/components/Form';
  import { BasicTree, TreeItem } from '/@/components/Tree';
  import { accountEditRoles, getAccountRoleTreeList } from '/@/api/admin/system';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { PermissionsEnum } from '/@/enums/roleEnum';
  import { notify } from '/@/api/api';

  const { hasPermission } = usePermission();

  const emit = defineEmits(['redo']);
  const props = defineProps({
    id: Number,
  });

  const treeData = ref<TreeItem[]>([]); // 角色树结构

  const [registerForm, { validate, setProps }] = useForm({
    labelWidth: 100,
    schemas: [
      {
        label: ' ',
        field: 'roles',
        slot: 'roles',
        component: 'Input',
        defaultValue: [],
        colProps: { lg: 22, md: 24 },
      },
    ],
    actionColOptions: {
      span: 14,
    },
    resetButtonOptions: {
      text: '跳过',
    },
    submitButtonOptions: {
      text: '提交',
      disabled: !hasPermission(PermissionsEnum.AccountEditRolesSave, false),
    },
    // showActionButtonGroup: false,
    baseColProps: { lg: 24, md: 24 },
    resetFunc: customResetFunc,
    submitFunc: customSubmitFunc,
  });

  // 跳过
  async function customResetFunc() {
    emit('redo');
  }

  // 提交
  async function customSubmitFunc() {
    try {
      const values = await validate();
      values.roles = values.roles.checked ?? values.roles;
      values.id = props.id;
      setProps({
        submitButtonOptions: {
          loading: true,
        },
      });

      accountEditRoles(values.id, values)
        .then((res) => {
          notify(res, true);
          emit('redo');
        })
        .finally(() => {
          setProps({
            submitButtonOptions: {
              loading: false,
            },
          });
        });
    } catch (error) {
      console.log('@@@ account/Step2 customSubmitFunc', error);
    }
  }

  // 挂载前请求接口
  onBeforeMount(() => {
    if (treeData.value.length === 0) {
      getAccountRoleTreeList().then((res) => {
        treeData.value = res;
      });
    }
  });
</script>
<style lang="less" scoped>
  .step2 {
    width: 800px;
    margin: 0 auto;
  }
</style>
