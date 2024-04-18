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
        <div style="margin-right: 18px; float: right">
          <Tooltip title="开启后每20秒刷新一次">
            <Icon class="icon" icon="ant-design:sync-outlined" color="#1890ff" />
            开启刷新
            <Switch v-model:checked="isStart" />
          </Tooltip>
        </div>
        <Divider />
        <List>
          <Row ref="cardBox">
            <template v-for="item in list" :key="item.title">
              <Col :span="spanCls">
                <ListItem>
                  <Card :hoverable="true" :class="`${prefixCls}__card`">
                    <div :class="`${prefixCls}__card-title`">
                      <Icon class="icon" v-if="item.icon" :icon="item.icon" :color="item.color" />
                      {{ item.title }}
                    </div>
                    <Divider />
                    <template v-for="item2 in item.data" :key="item2.key">
                      <div :class="`${prefixCls}__card-detail`">
                        {{ item2.key }}: <span style="color: #12e312">{{ item2.value }}</span>
                      </div>
                    </template>
                  </Card>
                </ListItem>
              </Col>
            </template>
          </Row>
        </List>
      </div>

      <div class="p-4 div-border">
        <div>
          <Icon class="icon" icon="ant-design:bar-chart-outlined" color="#1890ff" />
          键值统计
        </div>
        <Divider />
        <Table
          class="ant-table-striped"
          size="middle"
          :columns="columns"
          :data-source="dbs"
          :rowClassName="(record, index) => (index % 2 === 1 ? 'table-striped' : undefined)"
          :pagination="false"
        />
      </div>

      <div class="p-4 div-border">
        <div>
          <Icon class="icon" icon="ic:round-info" color="#1890ff" />
          Redis信息全集
          <InputSearch
            placeholder="input search text"
            style="width: 280px; margin-right: 18px; float: right"
            v-model:value="searchValue"
            @search="onSearch"
          />
        </div>
        <Divider />
        <Table
          class="ant-table-striped"
          size="middle"
          :columns="columns1"
          :data-source="info"
          :rowClassName="(record, index) => (index % 2 === 1 ? 'table-striped' : undefined)"
          :pagination="false"
        />
      </div>
    </PageWrapper>
  </BasicDrawer>
</template>
<script setup lang="ts">
  import { nextTick, onMounted, onUnmounted, reactive, ref, unref } from 'vue';
  import {
    Card,
    Row,
    Col,
    List,
    Divider,
    Table,
    Switch,
    Tooltip,
    ListItem,
    InputSearch,
  } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import Icon from '/@/components/Icon//Icon.vue';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { cacheInfo } from '/@/api/admin/system';
  import { RedisInfoModel } from '/@/api/admin/model/systemModel';
  import { ColumnType } from 'ant-design-vue/lib/table';

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
    cacheInfo()
      .then((res) => {
        result.value = res;
        parseInfo(searchValue.value.trim(), res);
        parseDBs(res);
        parseTopData(res);
      })
      .catch((e) => {
        console.log('@@@ cacheRenew', e);
      })
      .finally(() => {
        //setLoading(false);
      });
  }

  // 搜索
  const onSearch = (searchValue: string) => {
    parseInfo(searchValue.trim(), unref(result.value) as RedisInfoModel);
  };

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async () => {
    // console.log(data);
    setDrawerProps({ loading: true }); // loading
    getInfo();
    start(); // 开启定时器
    setDrawerProps({ loading: false }); // loading
    isStart.value = false;
  });

  // 数据列
  const columns: ColumnType[] = [
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
  const columns1: ColumnType[] = [
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
    margin: 0 0 01rem;
    padding: 0;
  }

  .list-card {
    &__content {
      padding-right: 16px;
      padding-left: 16px;
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
        color: @text-color;
        font-size: 16px;
        font-weight: 500;

        .icon {
          margin-top: -5px;
          margin-right: 10px;
          font-size: 18px !important;
        }
      }

      &-detail {
        margin-bottom: 3px;
        padding: 5px 0 5px 18px;
        border: 1px solid #ffe58f;
        border-radius: 5px;
        background: rgb(255 255 255);
        color: @text-color-secondary;
        font-size: 14px;
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
