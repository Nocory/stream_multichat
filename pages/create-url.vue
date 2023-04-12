<template>
  <div class="flex flex-col gap-4 p-4">
    <div class="flex flex-col">
      <div>Twitch</div>
      <input v-model="twitch" class="border w-32" type="text">
    </div>
    <div class="flex flex-col">
      <div>Kick</div>
      <input v-model="kick" class="border w-32" type="text">
    </div>
    <div class="flex flex-col">
      <div>Restream token</div>
      <input v-model="restreamToken" class="border w-32" type="text">
    </div>
    <button class="w-32 shadow-lg rounded bg-slate-900 text-slate-100" @click="createUrl">
      Create URL
    </button>
    <div v-if="url" class="flex items-center gap-4">
      <span>
        {{ url }}
      </span>
      <button class="bg-slate-100 p-2 border rounded" @click="() => clipBoard.copy()">
        Copy to clipboard {{ clipBoard.copied.value ? "✔" : "📋" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from "@vueuse/core"

const twitch = ref("")
const kick = ref("")
const restreamToken = ref("")
// const videoId = ref("")
// const googleApi = ref("")

const url = ref("")

const createUrl = () => {
  const parameters: string[] = []

  if (twitch.value) parameters.push(`twitch=${twitch.value}`)
  if (kick.value) parameters.push(`kick=${kick.value}`)
  if (restreamToken.value) parameters.push(`restreamToken=${restreamToken.value}`)

  if (parameters.length) url.value = `${window.location.origin}/?${parameters.join("&")}`
}

const clipBoard = useClipboard({ source: url })
</script>

<style scoped>

</style>
