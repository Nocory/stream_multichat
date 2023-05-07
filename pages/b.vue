<template>
  <div class="flex flex-col">
    <input type="text">
    <button>send</button>
    <div>{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { useBroadcastChannel } from "@vueuse/core"

const message = ref("")

const { data } = useBroadcastChannel({ name: "vueuse-demo-channel" })

watch(data, () => {
  if (data.value && typeof data.value === "string") {
    message.value = data.value
  }
})
</script>
