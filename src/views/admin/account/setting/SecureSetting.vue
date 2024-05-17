<template>
  <CollapseContainer title="安全设置" :canExpan="false">
    <List :pagination="pagination">
      <template v-for="item in list" :key="item.id">
        <List.Item class="list">
          <List.Item.Meta>
            <template #avatar v-if="item.icon">
              <Icon class="icon" :icon="item.icon" :color="item.color" />
            </template>
            <template #title>
              <span v-html="item.title"></span>
              <div class="extra" v-if="item.extra" @click="item.click">
                {{ item.extra }}
              </div>
            </template>
            <template #description>
              <div class="description"> {{ item.description }} </div>
              <div class="info" v-if="item.author">
                <div><span>Owner</span>{{ item.author }}</div>
                <div><span>开始时间</span>{{ item.datetime }}</div>
              </div>
              <div class="progress" v-if="item.percent">
                <Progress :percent="item.percent" status="active" />
              </div>
            </template>
          </List.Item.Meta>
        </List.Item>
      </template>
    </List>
    <Password @register="registerDrawer" />
    <SecureKey @register="registerDrawer1" />
  </CollapseContainer>
</template>

<script setup lang="ts">
  import { List, Progress } from 'ant-design-vue';
  import { CollapseContainer } from '@/components/Container';
  import Password from './Password.vue';
  import SecureKey from './SecureKey.vue';
  import { useDrawer } from '@/components/Drawer';
  import { useUserStore } from '@/store/modules/user';
  import { setUpdateMFAStatus } from '@/api/admin/system';
  import { notify } from '@/api/api';
  import Icon from '@/components/Icon/Icon.vue';
  import { reactive, ref } from 'vue';

  const userStore = useUserStore();
  const user = userStore.getUserInfo;
  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerDrawer1, { openDrawer: openDrawer1 }] = useDrawer();
  const title3 = ref(
    `校验 MFA(${parseInt(user.mfa_status) === 1 ? '<span style="color: green">已启用</span>' : '<span style="color: red">未启用</span>'})`,
  );
  const extra3 = ref(parseInt(user.mfa_status) === 1 ? '关闭' : '启用');
  // 分页
  const pagination = {
    show: true,
    pageSize: 0,
  };

  // 安全设置 list
  const list: any[] = reactive([
    {
      id: '1',
      title: '账户密码',
      description: '防止密码泄露，定时修改密码',
      extra: '修改',
      click: handleEditPassword,
    },
    {
      id: '2',
      title: `MAF 设备(${user.exist_mfa ? '<span style="color: green">已绑定</span>' : '<span style="color: red">未绑定</span>'})`,
      description:
        'MFA设备(基于时间的动态密码并可用于多重身份验证的应用程序)：如 Google Authenticator、Microsoft Authenticator ......',
      extra: user.exist_mfa ? '修改' : '绑定',
      click: handleEditMFASecure,
    },
    {
      id: '3',
      title: title3,
      description:
        '登录或其它敏感操作时使用MFA设备生成的动态密码验证身份，为了您的账号安全强烈建议你启用该功能',
      extra: extra3,
      click: handleEditMFAStatus,
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
  ]);

  // 修改 账户密码
  function handleEditPassword() {
    openDrawer(true, {});
  }

  // 修改 MFA 秘钥
  function handleEditMFASecure() {
    openDrawer1(true, { exist_mfa: user.exist_mfa });
  }

  // 修改 MFA 状态
  function handleEditMFAStatus() {
    if (!user.exist_mfa) {
      openDrawer1(true, { exist_mfa: false });
    }
    let mfa_status = false;
    if (parseInt(user.mfa_status) === 1) {
      mfa_status = true;
    }
    // 请求接口
    setUpdateMFAStatus(!mfa_status ? 1 : 0)
      .then((res) => {
        notify(res, true);
        user.mfa_status = !mfa_status ? 1 : 0;
        title3.value = `校验 MFA(${parseInt(user.mfa_status) === 1 ? '<span style="color: green">已启用</span>' : '<span style="color: red">未启用</span>'})`;
        extra3.value = parseInt(user.mfa_status) === 1 ? '关闭' : '启用';
      })
      .catch((e) => {
        console.log('@@@ setAccountStatus', e);
      })
      .finally(() => {});
  }
</script>
<style lang="less" scoped>
  .extra {
    margin-top: 10px;
    margin-right: 30px;
    float: right;
    color: #1890ff;
    font-weight: normal;
    cursor: pointer;
  }
</style>
