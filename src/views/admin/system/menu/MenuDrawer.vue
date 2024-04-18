<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :showOkBtn="
      hasPermission(isUpdate ? PermissionsEnum.MenuEditSave : PermissionsEnum.MenuAddSave, false)
    "
    :title="getTitle"
    :isDetail="true"
    @ok="handleSubmit"
  >
    <BasicForm @register="registerForm">
      <template #sort="{ model, field }">
        <Tooltip title="0 值会自动计算排序值哦" placement="right">
          <InputNumber placeholder="请输入排序" v-model:value="model[field]" />
        </Tooltip>
      </template>
    </BasicForm>

    <Divider />
    <div>
      <h3><SoundTwoTone twoToneColor="#eb2f96" /> 说明</h3>
      <h4>1. 权限标识</h4>
      <p>
        权限标识是唯一的，每一个菜单对应一个权限标识，已绑定过的权限标识不能重复绑定。去
        <Tooltip title="点我跳转到权限管理" placement="top">
          <a @click="handleClick('/system/permission')" style="color: #0cc00c"
            ><strong>权限管理</strong></a
          >
        </Tooltip>
        添加权限标识。
      </p>
      <h4>2. 排序</h4>
      <p> 排序值越大，排序越靠前，<span style="color: #3b8cf6">0 值会自动计算排序值</span>。 </p>
      <h4>3. 菜单(语言)</h4>
      <p> 前端菜单显示名称，支持多语种（中文，英文），具体值可咨询前端开发。 </p>
      <h4>4. 路由地址</h4>
      <p> 前端路由，具体值可咨询前端开发。 </p>
      <h4>5. 组件路径</h4>
      <p> 前端组件，具体值可咨询前端开发。 </p>
    </div>
  </BasicDrawer>
</template>
<script setup lang="ts">
  import { ref, computed, unref } from 'vue';
  import { SoundTwoTone } from '@ant-design/icons-vue';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import {
    menuAdd,
    menuEdit,
    getMenuPermissionUuidTreeList,
    getMenuTreeList,
  } from '/@/api/admin/system';
  import { TreeSelect } from '/@/api/admin/model/systemModel';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { PermissionsEnum } from '/@/enums/permissionsEnum';
  import { cloneDeep } from 'lodash-es';
  import { useGo } from '/@/hooks/web/usePage';
  import { Tooltip, Divider, InputNumber } from 'ant-design-vue';
  import { FormSchema } from '/@/components/Table';
  import { notify } from '/@/api/api';

  const go = useGo();
  const { hasPermission } = usePermission();

  const emit = defineEmits(['success', 'register']);

  const isUpdate = ref(true); // true 编辑, false 新增
  const rowId = ref(0); // 编辑记录的id
  const isGetParentTreeData = ref(true); // 是否请求下拉框数据
  const parentTreeData = ref<TreeSelect[]>([]); // pid 上级菜单下拉框
  const menuPermissionUuidTreeData = ref<TreeSelect[]>([]); // 权限标识

  // const isDir = (type: string) => type === '0';
  const isMenu = (type: number) => type === 1;

  // 添加|编辑菜单
  const formSchema: FormSchema[] = [
    {
      field: 'type',
      label: '菜单类型',
      component: 'RadioButtonGroup',
      defaultValue: 0,
      componentProps: {
        options: [
          { label: '目录', value: 0 },
          { label: '菜单', value: 1 },
        ],
      },
      colProps: { lg: 24, md: 24 },
    },
    {
      field: 'permissions_uuid',
      label: '权限标识',
      helpMessage: ['权限标识不能重复'],
      component: 'TreeSelect',
      required: true,
      componentProps: {
        showSearch: true,
        treeNodeFilterProp: 'title',
        treeDefaultExpandAll: true,
        placeholder: '请选择权限标识, 不能和其它菜单重复哦',
        fieldNames: {
          label: 'title',
          value: 'value',
        },
        getPopupContainer: () => document.body,
        onChange: (value: string, title: Array<string>) => {
          console.log('@@@onChange', value, title);
          if (title !== undefined) {
            setFieldsValue({
              title: title[0].split(' (')[0],
            });
          }
        },
      },
    },
    {
      field: 'title',
      label: '菜单名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入菜单名称',
        // onChange: (e: any) => {
        //   console.log(e);
        // },
      },
      required: true,
    },
    {
      field: 'pid',
      label: '上级菜单',
      component: 'TreeSelect',
      required: true,
      componentProps: {
        showSearch: true,
        treeNodeFilterProp: 'title',
        treeDefaultExpandAll: true,
        placeholder: '请选择上级菜单',
        fieldNames: {
          label: 'title',
          value: 'value',
        },
        getPopupContainer: () => document.body,
      },
    },
    {
      field: 'sort',
      label: '排序',
      helpMessage: ['0 值会自动计算排序哦'],
      component: 'InputNumber',
      defaultValue: 0,
      slot: 'sort',
      required: true,
    },
    {
      field: 'icon',
      label: '图标',
      component: 'IconPicker',
      componentProps: {
        placeholder: '请选择图标',
      },
      required: true,
    },
    {
      field: 'title_lang',
      label: '菜单(语言)',
      helpMessage: ['多语言系统,请咨询前端开发对应的key'],
      component: 'Input',
      componentProps: {
        placeholder: '请输入菜单语言key',
      },
      required: true,
    },
    {
      field: 'path',
      label: '路由地址',
      helpMessage: [
        '路由地址: 请咨询前端开发对应的路由地址',
        '除了 layout 对应的 path 前面需要加 /，其余子路由都不要以/开头',
      ],
      component: 'Input',
      componentProps: {
        placeholder: '请输入路由地址',
      },
      // ifShow: ({ values }) => isMenu(values.type),
    },
    {
      field: 'component',
      label: '组件路径',
      helpMessage: ['组件路径: 请咨询前端开发对应的组件路径'],
      component: 'Input',
      componentProps: {
        placeholder: '请输入组件路径',
      },
      ifShow: ({ values }) => isMenu(values.type),
    },
    {
      field: 'status',
      label: '状态',
      component: 'RadioButtonGroup',
      defaultValue: 1,
      componentProps: {
        options: [
          { label: '显示', value: 1 },
          { label: '隐藏', value: 0 },
        ],
      },
    },
    {
      field: 'is_shortcut',
      label: '快捷',
      component: 'RadioButtonGroup',
      defaultValue: 0,
      componentProps: {
        options: [
          { label: '否', value: 0 },
          { label: '是', value: 1 },
        ],
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
      colProps: { lg: 24, md: 24 },
      rules: [{ max: 255, message: '最多输入255个字符' }],
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
      setDrawerProps({ loading: true }); // loading
      await resetFields(); // 重置
      isUpdate.value = !!data?.isUpdate; // 编辑

      // 上级菜单下拉框
      if (unref(parentTreeData).length === 0 || isGetParentTreeData.value) {
        parentTreeData.value = [{ value: 0, title: '/根目录' }] as TreeSelect[];
        parentTreeData.value[0].children = await getMenuTreeList();
        isGetParentTreeData.value = false; // 数据未变动, 不在请请求接口
      }

      // 权限标识
      if (unref(menuPermissionUuidTreeData).length === 0) {
        menuPermissionUuidTreeData.value = await getMenuPermissionUuidTreeList();
      }

      const permissions_uuid = computed(() => {
        if (isUpdate.value) {
          let arr = cloneDeep(menuPermissionUuidTreeData.value);
          if (data.record?.permissions_uuid) {
            recursion(arr, data.record?.permissions_uuid);
          }
          return arr;
        }
        return menuPermissionUuidTreeData.value;
      });

      // updateSchema
      await updateSchema([
        {
          field: 'pid',
          componentProps: { treeData: parentTreeData },
        },
        {
          field: 'permissions_uuid',
          componentProps: { treeData: permissions_uuid },
        },
      ]);

      // 编辑设置值
      if (unref(isUpdate)) {
        rowId.value = data.record.id;
        await setFieldsValue({
          ...data.record,
        });
      } else {
        if (data?.record?.id) {
          await setFieldsValue({
            pid: data?.record?.id,
          });
        }
      }
    } catch (e) {
      console.log('@@@ useDrawerInner', e);
    } finally {
      setDrawerProps({ loading: false }); // loading
    }
  });

  // 下拉状态
  function recursion(arr: TreeSelect[], id: string | number) {
    for (let value of arr) {
      if (id.toString() == value.value?.toString()) {
        value.disabled = false;
        return false;
      }
      if (value.children) {
        recursion(value.children, id);
      }
    }
  }

  // 标题
  const getTitle = computed(() => (!unref(isUpdate) ? '新增菜单' : '编辑菜单'));

  // 提交数据
  async function handleSubmit() {
    try {
      const values = await validate();
      setDrawerProps({ loading: true });
      // console.log('@@@提交数据', values);
      // 发起请求
      if (unref(isUpdate)) {
        // 编辑
        await menuEdit(rowId.value, values).then((res) => {
          notify(res, true);
        });
      } else {
        // 新增
        await menuAdd(values).then((res) => {
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

  // 跳转
  function handleClick(path: string) {
    console.log('@@@@@ go', path);
    go(path);
  }
</script>
