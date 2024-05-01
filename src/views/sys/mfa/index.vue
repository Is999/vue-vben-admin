<template>
  <transition name="fade-bottom" mode="out-in">
    <TwoStepVerificationPage v-if="getTwoStepVerification" />
  </transition>
</template>
<script lang="ts" setup>
  import { computed } from 'vue';
  import TwoStepVerificationPage from './TwoStepVerificationPage.vue';
  import { useMfaStore } from '/@/store/modules/mfa';

  const mfaStore = useMfaStore();
  const getTwoStepVerification = computed(
    () => mfaStore?.getMfaInfo?.isTwoStepVerification ?? false,
  );
</script>
