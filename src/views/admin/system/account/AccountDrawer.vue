<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :showOkBtn="false"
    :title="getTitle"
    :isDetail="true"
    @close="handleClose"
  >
    <PageWrapper title="" contentBackground contentClass="p-4">
      <div class="step-form-form">
        <Steps :current="current">
          <Step title="新增账号" />
          <Step title="编辑权限" />
          <Step title="完成" />
        </Steps>
      </div>
      <div class="mt-5">
        <Step1 @next="handleStep1Next" v-show="current === 0" v-if="current === 0" />
        <Step2 @redo="handleClose" v-show="current === 1" v-if="current === 1" :id="id" />
      </div>
    </PageWrapper>
  </BasicDrawer>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import Step1 from './Step1.vue';
  import Step2 from './Step2.vue';
  import { PageWrapper } from '@/components/Page';
  import { Steps, Step } from 'ant-design-vue';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';

  const emit = defineEmits(['success', 'register']);

  // 标题
  const getTitle = computed(() => '新增账号');
  const current = ref(0);
  const id = ref(0);

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async () => {
    current.value = 0;
    setDrawerProps({ confirmLoading: false });
  });

  // 下一步
  function handleStep1Next(step1Values: any) {
    current.value++;

    id.value = step1Values.id;

    // console.log('step1Values', step1Values);
  }

  // 关闭
  function handleClose() {
    closeDrawer();
    if (current.value !== 0) {
      emit('success');
    }
    current.value = -1; // 重置current, 配合 v-if 达到强制刷新的效果
  }
</script>

<style lang="less" scoped>
  .step-form-content {
    padding: 24px;
    background-color: @component-background;
  }

  .step-form-form {
    width: 750px;
    margin: 0 auto;
  }
</style>
