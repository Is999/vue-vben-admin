<template>
  <BasicModal
    v-bind="$attrs"
    @register="register"
    title="Order Amount"
    @visible-change="handleVisibleChange"
    @ok="handleOk"
  >
    <div class="pt-3px pr-3px">
      <BasicForm @register="registerForm" />
    </div>
    <a-divider />
    <div>
      <h3><SoundTwoTone twoToneColor="#eb2f96" /> 说明</h3>
      <h4>1. Actual Amount</h4>
      <p> 实际充值金额和订单提交充值金额不允许差距大于或者小于100元。 </p>
    </div>
  </BasicModal>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';
  import { Divider } from 'ant-design-vue';
  export default defineComponent({
    components: {
      [Divider.name]: Divider,
    },
  });
</script>
<script setup lang="ts">
  import { nextTick } from 'vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form/index';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { SoundTwoTone } from '@ant-design/icons-vue';

  // props
  const props = defineProps({
    userData: { type: Object },
  });

  // emit
  const emit = defineEmits(['register', 'handleOk']);
  const schemas: FormSchema[] = [
    {
      field: 'actual_amount',
      label: 'Actual Amount',
      labelWidth: 100,
      component: 'InputNumber',
      colProps: {
        span: 24,
      },
      defaultValue: 0,
      componentProps: {
        step: 0.01,
        min: 0,
      },
    },
  ];

  let modelRef: Recordable = {};

  const [
    registerForm,
    {
      setFieldsValue,
      // setProps
      getFieldsValue,
      // validate,
    },
  ] = useForm({
    labelWidth: 120,
    schemas,
    showActionButtonGroup: false,
    actionColOptions: {
      span: 24,
    },
  });

  const [register, { closeModal, changeOkLoading }] = useModalInner((data) => {
    console.log('useModalInner', data);
    data && onDataReceive(data);
  });

  function onDataReceive(data) {
    console.log('Data Received', data);

    modelRef = data;

    // 方式1;
    setFieldsValue({
      actual_amount: data.currency_type === 'usdt' ? data.bb_amount : data.amount,
    });

    // 方式2
    // setProps({
    //   model:{ field2: data.data, field1: data.info }
    // })
  }

  function handleVisibleChange(v) {
    console.log('handleVisibleChange', v);
    v && props.userData && nextTick(() => onDataReceive(props.userData));
  }

  function handleOk() {
    let values = getFieldsValue();
    console.log('@@@handleOk', modelRef, values);
    if (modelRef.currency_type !== 'usdt') {
      if (Math.abs(Number(values.actual_amount) - Number(modelRef.amount)) > 100) {
        const { createMessage } = useMessage();
        createMessage.warning('金额不允许差距大于或者小于100元');
        return false;
      }
    }
    try {
      changeOkLoading(true);
      emit('handleOk', values);
      closeModal();
    } finally {
      changeOkLoading(false);
    }
  }
</script>
