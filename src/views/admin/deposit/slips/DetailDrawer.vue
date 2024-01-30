<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :showOkBtn="true"
    title="订单详情"
    okText="刷新订单数据"
    :isDetail="true"
    @ok="handleRefresh"
    @close="handleClose"
  >
    <Description @register="registerDesc" class="mt-4" layout="vertical" :column="2" />
    <div class="my-2" style="margin-top: 20px">
      <a-popconfirm title="确认操作[通知]吗?" @confirm="handleNotify">
        <template #icon>
          <Icon icon="ant-design:question-circle-outlined" style="color: #ff012d" />
        </template>
        <a-button
          type="primary"
          color="success"
          class="ml-2"
          preIcon="ant-design:send-outlined"
          v-if="hasPermission(PermissionsEnum.DepositNotify) && isNotify"
        >
          通知
        </a-button>
      </a-popconfirm>
      <a-popconfirm title="确认操作[尝试修复]吗?" @confirm="handleRepair">
        <template #icon>
          <Icon icon="ant-design:question-circle-outlined" style="color: #ff012d" />
        </template>
        <a-button
          type="primary"
          color="warning"
          class="ml-2"
          preIcon="ant-design:tool-outlined"
          v-if="hasPermission(PermissionsEnum.DepositRepair) && isRepair"
        >
          尝试修复
        </a-button>
      </a-popconfirm>
      <a-popconfirm title="确认操作[手工失败]吗?" @confirm="handleManuallyFailed">
        <template #icon>
          <Icon icon="ant-design:question-circle-outlined" style="color: #ff012d" />
        </template>
        <a-button
          type="primary"
          color="error"
          class="ml-2"
          preIcon="ant-design:close-circle-outlined"
          v-if="hasPermission(PermissionsEnum.DepositManuallyFailed) && isManuallyFailed"
        >
          手工失败
        </a-button>
      </a-popconfirm>
      <a-popconfirm title="确认操作[手工成功]吗?" @confirm="openModal(true, readonly(rowData))">
        <template #icon>
          <Icon icon="ant-design:question-circle-outlined" style="color: #ff012d" />
        </template>
        <a-button
          type="primary"
          style="background-color: #05ad20; border: 0px"
          class="ml-2"
          preIcon="ant-design:check-square-outlined"
          v-if="hasPermission(PermissionsEnum.DepositManuallySucceed) && isManuallySucceed"
        >
          手工成功
        </a-button>
      </a-popconfirm>
    </div>
    <ManuallySucceedModal @register="registerMoal" @handleOk="handleManuallySucceed" />
  </BasicDrawer>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';
  import { Popconfirm } from 'ant-design-vue';
  export default defineComponent({
    components: {
      [Popconfirm.name]: Popconfirm,
    },
  });
</script>
<script setup lang="ts">
  import { h, ref, readonly } from 'vue';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { Icon } from '/@/components/Icon';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Description, DescItem, useDescription } from '/@/components/Description/index';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { PermissionsEnum } from '/@/enums/roleEnum';
  import {
    getSlipDetail,
    slipNotify,
    slipRepair,
    slipManuallyFailed,
    slipManuallySucceed,
  } from '/@/api/admin/deposit';
  import ManuallySucceedModal from './ManuallySucceedModal.vue';
  import { useModal } from '/@/components/Modal';

  const { hasPermission } = usePermission();

  const emit = defineEmits(['success', 'register']);
  const isSuccess = ref(false); // 是否刷新页面

  // 按钮显示状态
  const isNotify = ref(false); // 通知
  const isRepair = ref(false); // 尝试修复
  const isManuallyFailed = ref(false); // 手工失败
  const isManuallySucceed = ref(false); // 手工成功(扣减余额)

  const rowNo = ref('');
  const rowData = ref({});

  const schema: DescItem[] = [
    {
      field: 'no',
      label: 'No.',
    },
    {
      field: 'platform',
      label: 'Platform',
    },
    {
      field: 'order_no',
      label: 'Order No.',
    },
    {
      field: 'channel',
      label: 'Channel',
    },
    {
      field: 'tx_no',
      label: 'Tx No.',
      show: (arg) => {
        return Boolean(arg?.tx_no) || Boolean(arg?.response?.tx_no);
      },
      render: (curVal, data) => {
        return curVal || data.response?.tx_no || '';
      },
    },
    {
      field: 'gateway',
      label: 'Gateway',
    },
    {
      field: 'bank',
      label: 'Bank',
      show: (arg) => {
        return arg?.gateway === 'banks';
      },
    },
    {
      field: 'amount',
      label: 'Amount',
    },
    {
      field: 'bb_amount',
      label: 'Bb Amount',
    },
    {
      field: 'actual_amount',
      label: 'Actual Amount',
    },
    {
      field: 'fee',
      label: 'Fee',
    },
    {
      field: 'rank',
      label: 'Rank',
    },
    {
      field: 'real_name',
      label: 'Real Name',
      show: (arg) => {
        return arg?.real_name !== '';
      },
    },
    {
      field: 'platform_created_at',
      label: 'Platform Created At',
    },
    {
      field: 'created_at',
      label: 'Created At',
    },
    {
      field: 'updated_at',
      label: 'Updated At',
    },
    {
      field: 'status',
      label: 'Status',
      render: (curVal, data) => {
        let color = 'default';
        switch (curVal) {
          case 'created':
            color = 'default';
            break;
          case 'issued':
            color = '#0433a9';
            break;
          case 'in-progress':
            color = '#986416';
            break;
          case 'failed':
            color = '#ea0630';
            break;
          case 'succeed':
            color = '#05ad20';
            break;
          case 'unconfirmable':
            color = '#503a18';
            break;
          default:
            color = '#56534f';
        }
        return h('span', { style: { color: color } }, data.status);
      },
    },
    {
      field: 'currency_type',
      label: 'Currency type',
      render: (curVal) => {
        return curVal || 'rmb';
      },
    },
  ];

  const [registerMoal, { openModal }] = useModal();

  const [registerDesc, { setDescProps }] = useDescription({
    // data: slipData,
    schema: schema,
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({
        loading: true,
      }); // loading
      rowNo.value = data.record?.no;
      parseData(data.record);
    } finally {
      setDrawerProps({ loading: false }); // loading
    }
  });

  // 解析数据
  function parseData(record) {
    setDescProps({ data: record });
    rowData.value = record;
    isNotify.value = ['succeed', 'failed', 'unconfirmable'].indexOf(record.status) > -1;
    isRepair.value = ['issued', 'in-progress'].indexOf(record.status) > -1;
    isManuallyFailed.value = ['issued', 'in-progress'].indexOf(record.status) > -1;
    isManuallySucceed.value = ['issued', 'in-progress'].indexOf(record.status) > -1;
  }

  // 取消
  function handleClose() {
    if (isSuccess.value == true) {
      emit('success');
    }
    closeDrawer();
  }

  // 数据刷新
  async function handleRefresh() {
    const { createMessage } = useMessage();
    try {
      setDrawerProps({ confirmLoading: true });
      // 发起请求
      await getSlipDetail(rowNo.value).then((res) => {
        //console.log(res);
        parseData(res);
        createMessage.success('数据刷新成功');
      });
    } finally {
      setDrawerProps({ confirmLoading: false });
    }
  }

  // 通知
  async function handleNotify() {
    const { createMessage } = useMessage();
    try {
      setDrawerProps({ loading: true });
      // 发起请求
      await slipNotify(rowNo.value).then((res) => {
        //console.log(res);
        createMessage.success(res.message);
      });
    } finally {
      setDrawerProps({ loading: false });
    }
  }

  // 修复
  async function handleRepair() {
    const { createMessage } = useMessage();
    try {
      setDrawerProps({ loading: true });
      // 发起请求
      await slipRepair(rowNo.value).then((res) => {
        //console.log(res);
        createMessage.success(res.message + ': 准备刷新订单数据......');
        isSuccess.value = true;
        handleRefresh();
      });
    } finally {
      setDrawerProps({ loading: false });
    }
  }

  // 手工失败
  async function handleManuallyFailed() {
    const { createMessage } = useMessage();
    try {
      setDrawerProps({ loading: true });
      // 发起请求
      await slipManuallyFailed(rowNo.value).then((res) => {
        //console.log(res);
        createMessage.success(res.message + ': 准备刷新订单数据......');
        isSuccess.value = true;
        handleRefresh();
      });
    } finally {
      setDrawerProps({ loading: false });
    }
  }

  // 手工成功
  async function handleManuallySucceed(params: Recordable) {
    // console.log('@@@@ params', params);
    const { createMessage } = useMessage();
    try {
      setDrawerProps({ loading: true });
      // 发起请求
      await slipManuallySucceed(rowNo.value, params).then((res) => {
        //console.log(res);
        createMessage.success(res.message + ': 准备刷新订单数据......');
        isSuccess.value = true;
        handleRefresh();
      });
    } finally {
      setDrawerProps({ loading: false });
    }
  }
</script>
