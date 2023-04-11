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
    <div>
      {{ url }}
    </div>
  </div>
</template>

<script setup lang="ts">
const twitch = ref("")
const kick = ref("")
const restreamToken = ref("")
// const videoId = ref("")
// const googleApi = ref("")

const url = ref("")

const createUrl = () => {
  url.value = `${window.location.origin}/?twitch=${twitch.value}&kick=${kick.value}&restreamToken=${restreamToken.value}`
}
</script>

<style scoped>

</style>
