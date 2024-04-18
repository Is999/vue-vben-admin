<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :showOkBtn="
      hasPermission(
        isUpdate ? PermissionsEnum.PermissionEditSave : PermissionsEnum.PermissionAddSave,
      )
    "
    :title="getTitle"
    :isDetail="true"
    @ok="handleSubmit"
  >
    <BasicForm @register="registerForm" />

    <Divider />
    <div>
      <h3><SoundTwoTone twoToneColor="#eb2f96" /> 说明</h3>
      <h4>1. 权限标识</h4>
      <p> 权限标识是唯一的，用于前端，根据用户权限显示或隐藏：目录、菜单、页面、按钮等。 </p>
      <h4>2. 权限模型</h4>
      <p> 权限模型用于后端，根据用户权限控制是否可以访问接口路由。 </p>
      <h4>3. 权限类型</h4>
      <p> 菜单或目录类型的权限标识可用于绑定菜单，以根据用户权限显示或隐藏菜单。 </p>
    </div>
  </BasicDrawer>
</template>

<script setup lang="ts">
  import { ref, computed, unref } from 'vue';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import { SoundTwoTone } from '@ant-design/icons-vue';
  import { FormSchema } from '/@/components/Table';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import {
    permissionAdd,
    permissionEdit,
    getPermissionTreeList,
    getPermissionMaxUuid,
  } from '/@/api/admin/system';
  import { TreeSelect } from '/@/api/admin/model/systemModel';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { PermissionsEnum } from '/@/enums/permissionsEnum';
  import { notify } from '/@/api/api';
  import { Divider } from 'ant-design-vue';
  import { useMessage } from '@/hooks/web/useMessage';

  const { hasPermission } = usePermission();

  const emit = defineEmits(['success', 'register']);

  const isUpdate = ref(true); // true 编辑, false 新增
  const rowId = ref(0); // 编辑记录的id
  const maxUuid = ref(0); // maxUuid
  const isGetParentTreeData = ref(true); // 是否请求下拉框数据
  const parentTreeData = ref<TreeSelect[]>([]); // pid 上级菜单下拉框
  // 添加|编辑权限
  const formSchema: FormSchema[] = [
    {
      field: 'uuid',
      label: '权限标识',
      component: 'Input',
      componentProps: {
        placeholder: '请输入权限标识',
      },
      helpMessage: [
        '权限标识主要用于前端权限控制',
        '权限标识不能重复',
        '可以咨询前端开发所填写参数',
      ],
      required: true,
    },
    {
      field: 'title',
      label: '权限名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入权限名称',
        // onChange: (e: any) => {
        //   console.log(e);
        // },
      },
      required: true,
    },
    {
      field: 'pid',
      label: '上级权限',
      component: 'TreeSelect',
      required: true,
      helpMessage: ['新增的权限类型为目录或菜单类型,上级一定要是目录类型哦'],
      componentProps: {
        showSearch: true,
        treeNodeFilterProp: 'title',
        treeDefaultExpandAll: true,
        placeholder: '请选择上级权限',
        fieldNames: {
          label: 'title',
          key: 'id',
          value: 'id',
        },
        getPopupContainer: () => document.body,
      },
    },
    {
      field: 'module',
      label: '权限模型',
      component: 'Input',
      componentProps: {
        placeholder: '请输入权限模型',
      },
      helpMessage: ['权限模型主要用于后端路由拦截', '可以咨询后端开发所填写参数'],
    },
    {
      field: 'type',
      label: '类型',
      component: 'RadioButtonGroup',
      defaultValue: 7,
      colProps: { lg: 24, md: 24 },
      helpMessage: ['目录和菜单的权限类型一定要选择对应的类型哦'],
      componentProps: {
        options: [
          { label: '目录', value: 4 },
          { label: '菜单', value: 5 },
          { label: '按钮', value: 7 },
          { label: '新增', value: 1 },
          { label: '修改', value: 2 },
          { label: '删除', value: 3 },
          { label: '查看', value: 0 },
          { label: '页面', value: 6 },
          { label: '其它', value: 8 },
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
      setDrawerProps({ loading: true });
      await resetFields();
      isUpdate.value = !!data?.isUpdate;

      // pid 上级菜单下拉框
      if (unref(parentTreeData).length === 0 || isGetParentTreeData.value) {
        parentTreeData.value = [{ id: 0, title: '/根目录' }] as TreeSelect[];
        parentTreeData.value[0].children = await getPermissionTreeList();
        isGetParentTreeData.value = false; // 数据未变动, 不在请请求接口
      }

      // uuid 处理
      maxUuid.value = isUpdate.value
        ? 0
        : await getPermissionMaxUuid()
            .then((result) => {
              // console.log('@@@ result: ', result);
              return result.uuid.toString();
            })
            .catch((e) => {
              console.log('@@@ getPermissionMaxUuid', e);
              return Math.floor(Math.random() * 100000).toString();
            })
            .finally(() => {});

      // updateSchema
      await updateSchema([
        {
          field: 'pid',
          dynamicDisabled: isUpdate.value,
          componentProps: { treeData: parentTreeData },
        },
        {
          field: 'uuid',
          defaultValue: maxUuid,
          dynamicDisabled: isUpdate.value,
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
      setDrawerProps({ loading: false });
    }
  });

  // 标题
  const getTitle = computed(() => (!unref(isUpdate) ? '新增权限' : '编辑权限'));

  // 提交数据
  async function handleSubmit() {
    try {
      const values = await validate();
      setDrawerProps({ loading: true });
      // console.log('@@@提交数据', values);
      // 发起请求
      if (unref(isUpdate)) {
        // 编辑
        await permissionEdit(rowId.value, values).then((res) => {
          notify(res, true);
        });
      } else {
        // 新增
        await permissionAdd(values).then(async (res) => {
          // uuid 特殊的处理
          if (res.success === false && res.code === 100034) {
            // notify(res, false);
            const { createMessage } = useMessage();

            createMessage.loading(
              '【' + res.code + '】' + res.message + ', 正在重新为你加载权限标识......',
            );

            // uuid 处理
            maxUuid.value = await getPermissionMaxUuid()
              .then((result) => {
                // console.log('@@@ result: ', result);
                return result.uuid.toString();
              })
              .catch((e) => {
                console.log('@@@ getPermissionMaxUuid', e);
                return Math.floor(Math.random() * 100000).toString();
              })
              .finally(() => {});

            // updateSchema
            await updateSchema([
              {
                field: 'uuid',
                defaultValue: maxUuid,
                dynamicDisabled: isUpdate.value,
              },
            ]);
            //throw new Error(res.message);
            return Promise.reject(res.message);
          } else {
            notify(res, true);
          }
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
