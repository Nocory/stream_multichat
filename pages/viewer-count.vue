<template>
  <div class="viewer-count-page">
    <div
      v-if="routeParams.kick"
      data-platform="kick"
      class="viewer-count-number kick"
      v-text="kickViewerCount"
    />
  </div>
</template>

<script setup lang="ts">
import { useIntervalFn, useUrlSearchParams } from "@vueuse/core"

const params = useUrlSearchParams("history")
const routeParams = { kick: params.kick as string }

const kickViewerCount = ref(0)

const fetchKickViewerCount = async () => {
  try {
    const response = await fetch(`https://kick.com/api/v2/channels/${routeParams.kick}/`)
    if (!response.ok) {
      throw new Error(`Fetching of Kick channel information failed with status ${response.status}: ${response.statusText}`)
    }
    const parsedResponse = await response.json()
    kickViewerCount.value = parsedResponse?.livestream?.viewer_count ?? 0
  } catch (error) {
    console.error(error)
  }
}

if (routeParams.kick) {
  useIntervalFn(fetchKickViewerCount, 30000, { immediateCallback: true })
}
</script>
