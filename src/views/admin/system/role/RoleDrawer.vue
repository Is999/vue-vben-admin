<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :showOkBtn="
      hasPermission(isUpdate ? PermissionsEnum.RoleEditSave : PermissionsEnum.RoleAddSave, false)
    "
    :title="getTitle"
    :isDetail="true"
    @ok="handleSubmit"
  >
    <BasicForm @register="registerForm">
      <template #permissions="{ model, field }">
        <BasicTree
          v-if="treeData.length"
          v-model:value="model[field]"
          :treeData="treeData"
          :fieldNames="{ key: 'id', title: 'title' }"
          checkable
          :search="true"
          :defaultExpandLevel="5"
          checkStrictly
          :actionList="actionList"
          toolbar
        />
      </template>
    </BasicForm>
  </BasicDrawer>
</template>
<script setup lang="ts">
  import { ref, computed, unref, h } from 'vue';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form/index';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import {
    getRolePermissionTreeList,
    roleAdd,
    roleEdit,
    getRoleTreeList,
  } from '/@/api/admin/system';
  import { TreeSelect } from '/@/api/admin/model/systemModel';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { PermissionsEnum } from '/@/enums/permissionsEnum';
  import { BasicTree, TreeActionItem, TreeItem } from '/@/components/Tree';
  import { Tooltip } from 'ant-design-vue';
  import { notify } from '/@/api/api';

  const { hasPermission } = usePermission();

  const emit = defineEmits(['success', 'register']);

  const isUpdate = ref(true); // true 编辑, false 新增
  const rowId = ref(0); // 编辑记录的id
  const treeData = ref<TreeItem[]>([]); // 权限树结构
  const isGetParentTreeData = ref(true); // 是否请求下拉框数据
  const parentTreeData = ref<TreeSelect[]>([]); // 父级下拉框

  const formSchema: FormSchema[] = [
    {
      field: 'title',
      label: '角色名称',
      required: true,
      component: 'Input',
      componentProps: {
        placeholder: '请输入角色名称',
      },
    },
    {
      field: 'status',
      label: '状态',
      component: 'RadioButtonGroup',
      defaultValue: 1,
      componentProps: {
        options: [
          { label: '启用', value: 1 },
          { label: '停用', value: 0 },
        ],
      },
    },
    {
      field: 'pid',
      label: '上级角色',
      component: 'TreeSelect',
      required: true,
      helpMessage: ['新增的权限类型为目录或菜单类型,上级一定要是目录类型哦'],
      componentProps: {
        showSearch: true,
        treeNodeFilterProp: 'title',
        treeDefaultExpandAll: true,
        placeholder: '请选择上级角色',
        fieldNames: {
          label: 'title',
          key: 'id',
          value: 'id',
        },
        getPopupContainer: () => document.body,
      },
    },
    {
      label: '备注',
      field: 'describe',
      helpMessage: ['最多输入255个字符'],
      component: 'InputTextArea',
      componentProps: {
        placeholder: '请输入备注信息, 最多输入255个字符',
        showCount: true,
        maxlength: 255,
      },
      colProps: { lg: 22, md: 22 },
      rules: [{ max: 255, message: '最多输入255个字符' }],
    },
    {
      label: '权限分配',
      field: 'permissions_id',
      slot: 'permissions',
      component: 'Input',
      defaultValue: [],
      helpMessage: ['权限分配规则: 超级管理员权限不可编辑, 上级角色有得权限下级角色才能编辑'],
      colProps: { lg: 22, md: 22 },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, updateSchema, validate }] = useForm({
    labelWidth: 100,
    schemas: formSchema,
    showActionButtonGroup: false,
    baseColProps: { lg: 12, md: 24 },
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true });
      await resetFields();
      isUpdate.value = !!data?.isUpdate;

      // 需要在setFieldsValue之前先填充treeData，否则Tree组件可能会报key not exist警告
      treeData.value = (await getRolePermissionTreeList(
        data?.record?.id || 0,
        !isUpdate.value,
      )) as any as TreeItem[];

      // pid 上级角色下拉框
      if (unref(parentTreeData).length === 0 || isGetParentTreeData.value) {
        parentTreeData.value = [{ id: 0, title: '超级管理员' }] as TreeSelect[];
        parentTreeData.value[0].children = await getRoleTreeList();
        isGetParentTreeData.value = false; // 数据未变动, 不在请请求接口
      }

      // updateSchema
      await updateSchema([
        {
          field: 'pid',
          dynamicDisabled: true,
          componentProps: { treeData: parentTreeData },
        },
      ]);

      // 编辑设置值
      if (unref(isUpdate)) {
        const permissionsId = isNaN(data?.record?.permissions_id)
          ? data?.record?.permissions_id?.split(',').map(function (item) {
              return parseInt(item, 10);
            })
          : [];

        rowId.value = data?.record.id;
        await setFieldsValue({
          ...data.record,
          permissions_id: permissionsId,
        });
      } else {
        const permissionsId = isNaN(data?.record?.permissions_id)
          ? data?.record?.permissions_id?.split(',').map(function (item) {
              return parseInt(item, 10);
            })
          : [];
        await setFieldsValue({
          pid: data?.record?.id,
          permissions_id: permissionsId,
        });
      }
    } catch (e) {
      console.log('@@@ useDrawerInner', e);
    } finally {
      setDrawerProps({ loading: false });
    }
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

  // 标题
  const getTitle = computed(() => (!unref(isUpdate) ? '新增角色' : '编辑角色'));

  // 提交数据
  async function handleSubmit() {
    try {
      const values = await validate();
      setDrawerProps({ loading: true });
      // 层级独立取values.permissions_id.checked 层级关联 values.permissions_id
      values.permissions = values.permissions_id.checked ?? values.permissions_id;
      // 发起请求
      if (unref(isUpdate)) {
        // 编辑
        await roleEdit(rowId.value, values).then((res) => {
          notify(res, true);
        });
      } else {
        // 新增
        await roleAdd(values).then((res) => {
          notify(res, true);
        });
      }

      closeDrawer();
      emit('success');

      isGetParentTreeData.value = true; // 数据变动, 下次重新请求接口
    } catch (e) {
      console.log('@@@ handleSubmit', e);
    } finally {
      setDrawerProps({ loading: false });
    }
  }
</script>
