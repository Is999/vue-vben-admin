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
              <div class="description"> {{ item.description }}</div>
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
  import { responseNotify } from '@/api/api';
  import Icon from '@/components/Icon/Icon.vue';
  import { reactive, ref } from 'vue';
  import { useMfaStore } from '@/store/modules/mfa';
  import { MfaInfo } from '#/store';
  import { CheckMfaScenariosEnum } from '@/enums/checkMfaScenariosEnum';
  import { usePermission } from '@/hooks/web/usePermission';

  const { isCheckMfa } = usePermission();
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
    const newStatus = mfa_status ? 0 : 1; // 取反状态
    const afterAction = (param) => {
      const values = {
        mfa_status: newStatus,
      };

      // 赋值两步验证参数
      values.twoStepKey = param?.twoStepKey;
      values.twoStepValue = param?.twoStepValue;

      // 设置MFA设备状态
      setUpdateMFAStatus(values)
        .then((res) => {
          responseNotify(res, true);
          user.mfa_status = newStatus;
          title3.value = `校验 MFA(${parseInt(user.mfa_status) === 1 ? '<span style="color: green">已启用</span>' : '<span style="color: red">未启用</span>'})`;
          extra3.value = parseInt(user.mfa_status) === 1 ? '关闭' : '启用';
        })
        .catch((e) => {
          console.log('@@@ setAccountStatus', e);
        });
    };

    // 关闭前验证MFA设备
    if (newStatus == 0 && isCheckMfa(CheckMfaScenariosEnum.MFA_STATUS)) {
      const mfaInfo: MfaInfo = useMfaStore().getMfaInfo;
      // 先设置标题， 和执行方法，当返回10006的时候可以直接弹框校验
      mfaInfo.title = 'MFA设备校验关闭，请先验证身份';
      mfaInfo.scenarios = CheckMfaScenariosEnum.MFA_STATUS; // 2 修改MFA状态（关闭）
      mfaInfo.isOff = true; // 打开身份验证页面
      useMfaStore().setMfaInfo(mfaInfo); // 修改MfaInfo
      useMfaStore().afterSuccessVerify = afterAction; // 设置验证完后的操作
      useMfaStore().openVerify(); // 打开验证
    } else {
      afterAction(null);
    }
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
