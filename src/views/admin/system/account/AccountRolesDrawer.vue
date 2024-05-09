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
      <template #tools>
        <div class="px-4">
          <AButton @click="expandAll(true)" class="mr-2"> 展开全部 </AButton>
          <AButton @click="expandAll(false)" class="mr-2"> 折叠全部 </AButton>
          <AInput
            type="number"
            @input="expandOne"
            class="w-24"
            step="1"
            max="10"
            min="0"
            placeholder="展开层级"
          />
        </div>
      </template>
      <template #roles="{ model, field }">
        <BasicTree
          title="账号角色"
          v-if="treeData.length"
          v-model:value="model[field]"
          :treeData="treeData"
          :fieldNames="{ key: 'id', title: 'title' }"
          :checkable="true"
          :search="true"
          :defaultExpandAll="true"
          :checkStrictly="true"
          :showLine="true"
          @check="actionCheck"
          :actionList="actionList"
          ref="treeRef"
        />
      </template>
    </BasicForm>
  </BasicDrawer>
</template>
<script setup lang="ts">
  import { h, ref, unref } from 'vue';
  import { BasicForm, useForm } from '@/components/Form/index';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import { accountEditRoles, accountRoles, getAccountRoleTreeList } from '@/api/admin/system';
  import {
    BasicTree,
    TreeActionType,
    CheckKeys,
    TreeItem,
    KeyType,
    TreeActionItem,
  } from '@/components/Tree';
  import { usePermission } from '@/hooks/web/usePermission';
  import { PermissionsEnum } from '@/enums/permissionsEnum';
  import { notify } from '@/api/api';
  import type { Nullable } from '@vben/types';
  import type { TreeDataItem } from 'ant-design-vue/es/tree/Tree';
  import { isArray } from '@/utils/is';
  import { useMessage } from '@/hooks/web/useMessage';
  import { Tooltip } from 'ant-design-vue';
  import { AccountRoleModel } from '@/api/admin/model/systemModel';

  const { hasPermission } = usePermission();
  const isUpdate = ref(false); // true 编辑
  const rowId = ref(0); // 编辑记录的id
  const title = ref('编辑账号角色'); // 标题
  const treeData = ref<TreeItem[]>([]); // 权限树结构
  const treeRef = ref<Nullable<TreeActionType>>(null);
  const { createConfirm, createMessage } = useMessage();

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

  function expandOne(event: Event) {
    getTree().filterByLevel(Number((event.target as HTMLInputElement).value));
  }

  function actionCheck(checkKeys, e) {
    let keys = isArray(checkKeys) ? checkKeys : checkKeys.checked;
    // console.log('checkKeys: ', checkKeys, 'node: ', e, 'keys: ', keys);
    if (isUpdate.value) {
      const keyLength = keys.length;
      if (e.checked) {
        // 检查是否已有父级角色
        for (const pid of e.node.pids.split(',')) {
          if (keys.includes(parseInt(pid))) {
            if (e.node.name) {
              let parentNode: TreeDataItem = {} as TreeDataItem;

              for (const checkedNode of e.checkedNodes) {
                if (checkedNode.id === parseInt(pid)) {
                  parentNode = checkedNode;
                }
              }

              createConfirm({
                iconType: 'info',
                okText: '取消选择',
                cancelText: '保留选择',
                title: '不推荐的角色分配',
                content: `已经选择了更高权限的父级角色<span style="color: #0ed11d">【${parentNode?.name}】</span>，是否依然要选择子级角色<span style="color: #b6085f">【${e.node.name}】</span>！<br/>`,
                onOk: () => {
                  // 这里重新获取并设置checkedKeys, createConfirm onOK 函数可能在 主函数actionCheck执行完之后才执行
                  let checkKeys: CheckKeys = getTree().getCheckedKeys();
                  let keys = isArray(checkKeys) ? checkKeys : (checkKeys.checked as KeyType[]);
                  const index = keys.indexOf(e.node.eventKey);
                  if (index !== -1) {
                    keys.splice(index, 1);
                    if (!isArray(checkKeys)) {
                      checkKeys.checked = keys as number[] | string[];
                    }
                    getTree().setCheckedKeys(checkKeys);
                  }
                },
              });
            } else {
              createMessage.error(`已经选择了更高权限的父级角色，无须选择子级角色！`);
            }
            break;
          }
        }

        // 取消子级角色
        if (e.node.children && e.node.children.length) {
          getChildrenKeys(e.node.children, 'children', (node) => {
            if (keys.includes(parseInt(node.id))) {
              const index = keys.indexOf(node.id);
              if (index !== -1) {
                keys.splice(index, 1);
              }
            }
            return true;
          });
        }

        // console.log('@@@setCheckedKeys', keyLength, keys.length);
        if (keyLength !== keys.length) {
          if (!isArray(checkKeys)) {
            checkKeys.checked = keys;
          }
          getTree().setCheckedKeys(checkKeys);
        }
      }
    } else {
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
  }

  function getChildrenKeys(
    treeData: TreeDataItem[],
    childrenField: string,
    filter: (a: TreeDataItem) => boolean,
  ) {
    for (let index = 0; index < treeData.length; index++) {
      const node = treeData[index];
      if (!filter(node)) {
        break;
      }
      const children = node[childrenField];
      if (children && children.length) {
        getChildrenKeys(children, childrenField, filter);
      }
    }
  }

  const actionList: TreeActionItem[] = [
    {
      render: (record) => {
        let content = `角色：${record.title} <br/>`;
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

  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    labelWidth: 100,
    schemas: [
      {
        label: ' ',
        field: '',
        slot: 'tools',
        componentProps: {
          id: 'form_item_tools',
        },
        colProps: { lg: 22, md: 22 },
      },
      {
        label: ' ',
        field: 'roles',
        slot: 'roles',
        defaultValue: [],
        componentProps: {
          id: 'form_item_roles',
        },
        colProps: { lg: 22, md: 22 },
      },
    ],
    showActionButtonGroup: false,
    baseColProps: { lg: 12, md: 24 },
  });

  // Checkbox 禁用
  function recursion(arr: TreeItem[], roles: Number[]) {
    arr.forEach((value) => {
      if (value.disabled && roles.includes(Number(value.id))) {
        value.disabled = !value.disabled;
        value.style = { color: '#dd7022' };
      }
      if (value.children) {
        recursion(value.children, roles);
      }
    });
  }

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true });
      await resetFields();
      isUpdate.value = data?.isUpdate; // 编辑

      const roles = await accountRoles(data?.record?.id || 0);

      // 需要在setFieldsValue之前先填充treeData，否则Tree组件可能会报key not exist警告
      // if (treeData.value.length === 0) {
      treeData.value = (await getAccountRoleTreeList()) as TreeItem[];
      // }

      if (!isUpdate.value) {
        recursion(treeData.value, roles);
      }

      rowId.value = data?.record?.id;
      title.value = isUpdate.value
        ? `编辑账号 ` + data?.record?.name + ` 角色信息`
        : `账号 ` + data?.record?.name + ` 角色信息`;
      await setFieldsValue({
        roles: roles,
      });
    } catch (e) {
      console.log('@@@ useDrawerInner', e);
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
      await accountEditRoles(rowId.value, values as AccountRoleModel).then((res) => {
        notify(res, true);
      });

      // 关闭
      closeDrawer();
    } catch (e) {
      console.log('@@@ handleSubmit', e);
    } finally {
      setDrawerProps({ loading: false });
    }
  }
</script>
