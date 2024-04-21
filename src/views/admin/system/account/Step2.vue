<template>
  <div class="step2">
    <BasicForm @register="registerForm">
      <template #roles="{ model, field }">
        展开层级
        <a-input
          type="number"
          @input="expandOne"
          class="mr-2 w-18"
          step="1"
          max="10"
          min="0"
          placeholder="展开层级"
        />
        <a-button @click="expandAll(true)" class="mr-2"> 展开全部 </a-button>
        <a-button @click="expandAll(false)" class="mr-2"> 折叠全部 </a-button>
        <BasicTree
          v-if="treeData.length"
          v-model:value="model[field]"
          :treeData="treeData"
          :fieldNames="{ key: 'id', title: 'title' }"
          :checkable="true"
          :search="true"
          title="账号角色"
          :defaultExpandAll="true"
          :checkStrictly="true"
          :showLine="true"
          @check="actionCheck"
          :actionList="actionList"
          ref="treeRef"
        />
      </template>
    </BasicForm>
  </div>
</template>

<script setup lang="ts">
  import { h, onBeforeMount, ref, unref } from 'vue';
  import { BasicForm, useForm } from '/@/components/Form';
  import {
    BasicTree,
    TreeItem,
    TreeActionType,
    CheckKeys,
    KeyType,
    TreeActionItem,
  } from '/@/components/Tree';
  import { accountEditRoles, getAccountRoleTreeList } from '/@/api/admin/system';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { PermissionsEnum } from '/@/enums/permissionsEnum';
  import { notify } from '/@/api/api';
  import type { Nullable } from '@vben/types';
  import { isArray } from '@/utils/is';
  import type { TreeDataItem } from 'ant-design-vue/es/tree/Tree';
  import { useMessage } from '@/hooks/web/useMessage';
  import { Tooltip } from 'ant-design-vue';

  const { hasPermission } = usePermission();

  const emit = defineEmits(['redo']);
  const props = defineProps({
    id: Number,
  });

  const treeData = ref<TreeItem[]>([]); // 角色树结构
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
    const keyLength = keys.length;
    // console.log('checkedKey: ', 'checkKeys: ', checkKeys, 'node: ', e);
    if (e.checked) {
      // 检查是否已有父级角色
      for (const pid of e.node.pids.split(',')) {
        if (keys.includes(parseInt(pid))) {
          if (e.node.name) {
            let parentNode: TreeDataItem = <TreeDataItem>{};

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
      await setProps({
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
      getAccountRoleTreeList()
        .then((res) => {
          treeData.value = res;
        })
        .catch((e) => {
          console.log('@@@ getAccountRoleTreeList', e);
        })
        .finally(() => {});
    }
  });
</script>
<style lang="less" scoped>
  .step2 {
    width: 800px;
    margin: 0 auto;
  }
</style>
