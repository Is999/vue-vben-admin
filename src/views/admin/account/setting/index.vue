<template>
  <ScrollContainer>
    <div ref="wrapperRef" :class="prefixCls">
      <Tabs tab-position="left" :tabBarStyle="tabBarStyle">
        <template v-for="item in settingList" :key="item.key">
          <TabPane :tab="item.name">
            <component :is="item.component" />
          </TabPane>
        </template>
      </Tabs>
    </div>
  </ScrollContainer>
</template>

<script setup lang="ts">
  import { ScrollContainer } from '@/components/Container';
  import { Tabs, TabPane } from 'ant-design-vue';
  import BaseSetting from './BaseSetting.vue';
  import SecureSetting from './SecureSetting.vue';
  // import AccountBind from './AccountBind.vue';
  import MsgNotify from './MsgNotify.vue';
  // tab的list
  const settingList = [
    {
      key: '1',
      name: '基本设置',
      component: BaseSetting,
    },
    {
      key: '2',
      name: '安全设置',
      component: SecureSetting,
    },
    // {
    //   key: '3',
    //   name: '账号绑定',
    //   component: AccountBind,
    // },
    {
      key: '4',
      name: '新消息通知',
      component: MsgNotify,
    },
  ];

  const prefixCls = 'account-setting';
  const tabBarStyle = {
    width: '220px',
  };
</script>
<style lang="less">
  .account-setting {
    margin: 12px;
    background-color: @component-background;

    .base-title {
      padding-left: 0;
    }

    .ant-tabs-tab-active {
      background-color: @item-active-bg;
    }
  }
</style>
