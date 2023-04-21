<template>
  <div class="h-screen flex justify-center items-center bg-neutral-100">
    <div class="flex flex-col gap-4 mx-4 p-4 max-w-lg w-full shadow-xl rounded bg-white">
      <div class="flex flex-col w-full">
        <div class="font-bold">
          Twitch Channel
        </div>
        <input
          v-model="twitch"
          class="border-2 border-slate-800 text-black px-1"
          type="text"
        >
      </div>
      <div class="flex flex-col">
        <div class="font-bold">
          Kick Channel
        </div>
        <input
          v-model="kick"
          class="border-2 border-slate-800 text-black px-1"
          type="text"
        >
      </div>
      <div class="flex flex-col">
        <div class="font-bold">
          Restream Token
        </div>
        <input
          v-model="restreamToken"
          class="border-2 border-slate-800 text-black px-1"
          type="text"
        >
      </div>
      <hr>
      <div
        class="flex flex-col gap-4"
      >
        <div class="flex flex-col">
          <div class="font-bold">
            URL
          </div>
          <div
            class="bg-gray-100 break-all min-h-[4.25rem] opacity-80 border-2 border-slate-300  p-2"
          >
            {{ url }}
          </div>
          <div
            v-if="restreamToken"
            class="flex flex-col text-xs text-gray-500"
          >
            🛈 This URL may contain sensitive information! Be careful who you share it with!
          </div>
        </div>
        <button
          :disabled="!url"
          class="bg-slate-700 text-white p-2 border rounded disabled:bg-gray-400"
          @click="() => clipBoard.copy()"
        >
          Copy URL to clipboard {{ clipBoard.copied.value ? "✅" : "📋" }}
        </button>
      </div>
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

const url = computed(() => {
  const parameters: string[] = []

  if (twitch.value) parameters.push(`twitch=${twitch.value}`)
  if (kick.value) parameters.push(`kick=${kick.value}`)
  if (restreamToken.value) parameters.push(`restreamToken=${restreamToken.value}`)

  if (parameters.length) {
    return `${window.location.origin}/?${parameters.join("&")}`
  } else {
    return ""
  }
})

const clipBoard = useClipboard({ source: url })
</script>

<style scoped>

</style>
