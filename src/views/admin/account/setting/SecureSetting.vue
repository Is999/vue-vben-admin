<template>
  <CollapseContainer title="安全设置" :canExpan="false">
    <List>
      <template v-for="item in list" :key="item.key">
        <ListItem>
          <ListItemMeta>
            <template #title>
              {{ item.title }}
              <div class="extra" v-if="item.extra" @click="item.click">
                {{ item.extra }}
              </div>
            </template>
            <template #description>
              <div>{{ item.description }}</div>
            </template>
          </ListItemMeta>
        </ListItem>
      </template>
    </List>
    <Password @register="registerDrawer" />
    <SecureKey @register="registerDrawer1" />
  </CollapseContainer>
</template>
<script lang="ts">
  import { List } from 'ant-design-vue';
  import { defineComponent } from 'vue';

  export default defineComponent({
    components: { List, ListItem: List.Item, ListItemMeta: List.Item.Meta },
  });
</script>

<script setup lang="ts">
  import type { ListItem } from './data';
  import { CollapseContainer } from '/@/components/Container/index';
  import Password from './Password.vue';
  import SecureKey from './SecureKey.vue';
  import { useDrawer } from '/@/components/Drawer';

  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerDrawer1, { openDrawer: openDrawer1 }] = useDrawer();

  // 安全设置 list
  const list: ListItem[] = [
    {
      key: '1',
      title: '账户密码',
      description: '',
      extra: '修改',
      click: handleEditPassword,
    },
    {
      key: '2',
      title: 'Google安全码',
      description: '',
      extra: '修改',
      click: handleEditSecureCard,
    },
    // {
    //   key: '2',
    //   title: '密保手机',
    //   description: '已绑定手机：：138****8293',
    //   extra: '修改',
    // },
    // {
    //   key: '3',
    //   title: '密保问题',
    //   description: '未设置密保问题，密保问题可有效保护账户安全',
    //   extra: '修改',
    // },
    // {
    //   key: '4',
    //   title: '备用邮箱',
    //   description: '已绑定邮箱：：ant***sign.com',
    //   extra: '修改',
    // },
    // {
    //   key: '5',
    //   title: 'MFA 设备',
    //   description: '未绑定 MFA 设备，绑定后，可以进行二次确认',
    //   extra: '修改',
    // },
  ];

  // 修改 账户密码
  function handleEditPassword() {
    openDrawer(true, {});
  }

  // 修改 Google安全码
  function handleEditSecureCard() {
    openDrawer1(true, {});
  }
</script>
<style lang="less" scoped>
  .extra {
    float: right;
    margin-top: 10px;
    margin-right: 30px;
    font-weight: normal;
    color: #1890ff;
    cursor: pointer;
  }
</style>
