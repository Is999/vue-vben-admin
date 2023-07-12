<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    :showFooter="false"
    title="服务器信息"
    :isDetail="true"
    height="auto"
    @close="handleClose"
  >
    <PageWrapper :class="prefixCls" title="">
      <div class="p-4">
        <div style="float: right; margin-right: 18px">
          <a-tooltip title="开启后每20秒刷新一次">
            <Icon class="icon" icon="ant-design:sync-outlined" color="#1890ff" />
            开启刷新
            <a-switch v-model:checked="isStart" />
          </a-tooltip>
        </div>
        <a-divider />
        <a-list>
          <a-row ref="cardBox">
            <template v-for="item in list" :key="item.title">
              <a-col :span="spanCls">
                <a-list-item>
                  <a-card :hoverable="true" :class="`${prefixCls}__card`">
                    <div :class="`${prefixCls}__card-title`">
                      <Icon class="icon" v-if="item.icon" :icon="item.icon" :color="item.color" />
                      {{ item.title }}
                    </div>
                    <a-divider />
                    <template v-for="item2 in item.data" :key="item2.key">
                      <div :class="`${prefixCls}__card-detail`">
                        {{ item2.key }}: <span style="color: #12e312">{{ item2.value }}</span>
                      </div>
                    </template>
                  </a-card>
                </a-list-item>
              </a-col>
            </template>
          </a-row>
        </a-list>
      </div>

      <div class="p-4 div-border">
        <div>
          <Icon class="icon" icon="ant-design:bar-chart-outlined" color="#1890ff" />
          键值统计
        </div>
        <a-divider />
        <a-table
          class="ant-table-striped"
          size="middle"
          :columns="columns"
          :data-source="dbs"
          :rowClassName="(record, index) => (index % 2 === 1 ? 'table-striped' : null)"
          :pagination="false"
        />
      </div>

      <div class="p-4 div-border">
        <div>
          <Icon class="icon" icon="ic:round-info" color="#1890ff" />
          Redis信息全集
          <a-input-search
            placeholder="input search text"
            style="width: 280px; float: right; margin-right: 18px"
            v-model:value="searchValue"
            @search="onSearch"
          />
        </div>
        <a-divider />
        <a-table
          class="ant-table-striped"
          size="middle"
          :columns="columns1"
          :data-source="info"
          :rowClassName="(record, index) => (index % 2 === 1 ? 'table-striped' : null)"
          :pagination="false"
        />
      </div>
    </PageWrapper>
  </BasicDrawer>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';
  import { Card, Row, Col, List, Divider, Table, Switch, Tooltip } from 'ant-design-vue';

  export default defineComponent({
    components: {
      [Switch.name]: Switch,
      [Table.name]: Table,
      [Card.name]: Card,
      [List.name]: List,
      [List.Item.name]: List.Item,
      [Row.name]: Row,
      [Col.name]: Col,
      [Divider.name]: Divider,
      [Tooltip.name]: Tooltip,
    },
  });
</script>
<script setup lang="ts">
  import { nextTick, onMounted, onUnmounted, reactive, ref, unref } from 'vue';
  import { PageWrapper } from '/@/components/Page';
  import Icon from '/@/components/Icon/index';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { BasicColumn } from '/@/components/Table';
  import { cacheInfo } from '/@/api/admin/system';
  import { RedisInfoModel } from '/@/api/admin/model/systemModel';

  const prefixCls = 'list-card';
  const spanCls = ref<number>(8);
  const searchValue = ref<string>('');
  let result = ref<RedisInfoModel>();

  // Redis信息全集
  let info = reactive<Array<Recordable>>([]);

  // 头部是数据
  let version = ref('--');
  let os = ref('--');
  let processId = ref(0);
  let usedMemoryHuman = ref('--');
  let usedMemoryPeakHuman = ref('--');
  let usedMemoryLuaHuman = ref('--');
  let connectedClients = ref(0);
  let totalConnectionsReceived = ref(0);
  let totalCommandsProcessed = ref(0);

  // 键值统计
  let dbs = reactive<Array<Recordable>>([]);

  const list = reactive([
    {
      title: '服务器',
      icon: 'bi:server',
      color: '#1890ff',
      data: [
        {
          key: 'Redis版本',
          value: version,
        },
        {
          key: 'OS',
          value: os,
        },
        {
          key: '进程ID',
          value: processId,
        },
      ],
    },
    {
      title: '内存',
      icon: 'bi:device-ssd-fill',
      color: '#1890ff',
      data: [
        {
          key: '已用内存',
          value: usedMemoryHuman,
        },
        {
          key: '内存占用峰值',
          value: usedMemoryPeakHuman,
        },
        {
          key: 'Lua占用内存',
          value: usedMemoryLuaHuman,
        },
      ],
    },
    {
      title: '状态',
      icon: 'bi:thermometer-sun',
      color: '#1890ff',
      data: [
        {
          key: '客户端连接数',
          value: connectedClients,
        },
        {
          key: '历史连接数',
          value: totalConnectionsReceived,
        },
        {
          key: '历史命令数',
          value: totalCommandsProcessed,
        },
      ],
    },
  ]);

  // 解析Redis信息全集
  function parseInfo(search: string, res: RedisInfoModel) {
    // 清空数据
    info.splice(0, info.length);

    // 处理数据
    for (const i in res) {
      if (search != '') {
        if (i.indexOf(search) >= 0) {
          info.push({ key: i, value: res[i] });
        }
      } else {
        info.push({ key: i, value: res[i] });
      }
    }
  }

  // 解析 键值统计
  function parseDBs(res: RedisInfoModel) {
    // 清空数据
    dbs.splice(0, dbs.length);

    // 处理数据
    for (const i in res) {
      if (/^db[0-9]{1,2}$/.test(i)) {
        let obj = { db: i };
        let arr = res[i].split(',');
        for (const i2 in arr) {
          let arr2 = arr[i2].split('=');
          obj[arr2[0]] = arr2[1];
        }
        dbs.push(obj);
      }
    }
  }

  // 解析头部是数据
  function parseTopData(res: RedisInfoModel) {
    version.value = res.redis_version;
    os.value = res.os;
    processId.value = res.process_id;
    usedMemoryHuman.value = res.used_memory_human;
    usedMemoryPeakHuman.value = res.used_memory_peak_human;
    usedMemoryLuaHuman.value = res.used_memory_lua_human;
    connectedClients.value = res.connected_clients;
    totalConnectionsReceived.value = res.total_connections_received;
    totalCommandsProcessed.value = res.total_commands_processed;
  }

  // 请求数据
  function getInfo() {
    cacheInfo().then((res) => {
      result.value = res;
      parseInfo(searchValue.value.trim(), res);
      parseDBs(res);
      parseTopData(res);
    });
  }

  // 搜索
  const onSearch = (searchValue: string) => {
    parseInfo(searchValue.trim(), unref(result.value) as RedisInfoModel);
  };

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    setDrawerProps({ loading: true }); // loading
    getInfo();
    start(); // 开启定时器
    setDrawerProps({ loading: false }); // loading
    isStart.value = false;
  });

  // 数据列
  const columns: BasicColumn[] = [
    {
      title: 'DB',
      dataIndex: 'db',
      width: 200,
      sorter: (a, b) => a.db.localeCompare(b.db),
    },
    {
      title: 'Keys',
      dataIndex: 'keys',
      width: 200,
      sorter: (a, b) => a.keys.localeCompare(b.keys),
    },
    {
      title: 'Expires',
      dataIndex: 'expires',
      width: 200,
      sorter: (a, b) => a.expires.localeCompare(b.expires),
    },
    {
      title: 'Avg TTL',
      dataIndex: 'avg_ttl',
      width: 200,
      sorter: (a, b) => a.avg_ttl.localeCompare(b.avg_ttl),
    },
  ];

  // 数据列
  const columns1: BasicColumn[] = [
    {
      title: 'Key',
      dataIndex: 'key',
      width: 200,
      sorter: (a, b) => a.key.localeCompare(b.key),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      width: 200,
    },
  ];

  // 监听容器变化
  onMounted(() => {
    getWidth();
    window.addEventListener('resize', getWidth);
  });
  onUnmounted(() => {
    window.removeEventListener('resize', getWidth);
  });
  const cardBox = ref();
  const getWidth = () => {
    nextTick(() => {
      if (cardBox.value) {
        //div容器获取tableBox.value.clientWidth
        let newWidth = cardBox.value.$el.clientWidth;
        if (newWidth < 1020) {
          spanCls.value = 24;
        } else {
          spanCls.value = 8;
        }
        // console.log('@@@@', newWidth, spanCls.value);
      }
    });
  };
  // 监听容器变化 end

  // 关闭
  function handleClose() {
    closeDrawer();
    stop();
  }

  const isStart = ref(false);

  let timerId: ReturnType<typeof setInterval> | null;

  function clear() {
    timerId && window.clearInterval(timerId);
  }

  function stop() {
    isStart.value = false;
    clear();
    timerId = null;
  }

  function start() {
    if (unref(isStart) || !!timerId) {
      return;
    }
    isStart.value = true;
    timerId = setInterval(() => {
      if (isStart.value) {
        getInfo();
      }
    }, 20000);
  }
</script>
<style lang="less" scoped>
  .p-4 {
    padding: 0px;
    margin: 0px 0px 01rem 0px;
  }

  .list-card {
    &__content {
      padding-left: 16px;
      padding-right: 16px;
    }

    &__link {
      margin-top: 10px;
      font-size: 14px;

      a {
        margin-right: 30px;
      }

      span {
        margin-left: 5px;
      }
    }

    &__card {
      width: 100%;
      margin-bottom: -8px;
      border-radius: 5px;

      .ant-card-body {
        padding: 16px;
      }

      &-title {
        margin-bottom: 5px;
        font-size: 16px;
        font-weight: 500;
        color: @text-color;

        .icon {
          margin-top: -5px;
          margin-right: 10px;
          font-size: 18px !important;
        }
      }

      &-detail {
        padding: 5px 0px 5px 18px;
        font-size: 14px;
        margin-bottom: 3px;
        color: @text-color-secondary;
        background: rgb(255, 255, 255);
        border: 1px solid #ffe58f;
        border-radius: 5px;
      }
    }
  }
  //.div-border {
  //  border: 1px solid #ffe58f;
  //}
  .ant-table-striped :deep(.table-striped) td {
    background-color: #fafafa;
  }
</style>
