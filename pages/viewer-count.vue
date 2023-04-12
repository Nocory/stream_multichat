<template>
  <div class="viewer-count">
    <div
      v-if="routeParams.kick"
      data-platform="kick"
      class="kick"
      v-text="kickViewerCount"
    />
  </div>
</template>

<script setup lang="ts">
import { useIntervalFn, useUrlSearchParams } from "@vueuse/core"

const params = useUrlSearchParams("history")

const routeParams = { kick: params.kick as string }

const kickViewerCount = ref(0)

if (routeParams.kick) {
  useIntervalFn(async () => {
    try {
      const apiResponse = await fetch(`https://kick.com/api/v2/channels/${routeParams.kick}/`)
      if (!apiResponse.ok) {
        throw new Error("Fetching of Kick channel information failed. Response was not OK")
      }
      const parsedApiResponse = await apiResponse.json()
      kickViewerCount.value = parsedApiResponse?.livestream?.viewer_count ?? 0
    } catch (error) {
      console.error(error)
    }
  }, 30000, { immediateCallback: true })
}
</script>
