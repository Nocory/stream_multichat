<template>
  <div class="flex flex-col">
    <input type="text">
    <button>send</button>
    <div>{{ counter }}</div>
  </div>
</template>

<script setup lang="ts">
import { useBroadcastChannel, useInterval, useIntervalFn } from "@vueuse/core"

const { post } = useBroadcastChannel({ name: "vueuse-demo-channel" })

const counter = ref(0)
useIntervalFn(() => {
  post(counter.value.toFixed(2))
  counter.value = counter.value + 0.1
}, 1000)
</script>
