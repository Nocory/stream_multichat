<template>
  <div class="multichat h-screen overflow-hidden">
    <TransitionGroup
      name="list"
      tag="div"
      class="absolute bottom-0 left-0 right-0 p-4 overflow-hidden"
    >
      <div
        v-for="chatMessage in combinedChat"
        :key="chatMessage.id"
        :data-platform="chatMessage.platform"
        class="multichat-message py-1 leading-6"
      >
        <img class="multichat-message__platform h-5 w-5 object-contain inline" :src="`/platforms/${chatMessage.platform}.png`">
        <span
          class="multichat-message__user font-bold px-1 inline-block"
          v-text="chatMessage.userName + ':'"
        />
        <template
          v-for="(messagePart, i) in chatMessage.messageParts"
          :key="`messagePart_${chatMessage.id}_${i}`"
        >
          <span
            v-if="messagePart.type === 'text'"
            class="multichat-message__text break-words"
            v-text="messagePart.value"
          />
          <div
            v-else-if="messagePart.type === 'image'"
            class="inline-flex justify-center items-center h-0"
          >
            <div class="inline">
              <img
                class="multichat-message__emote w-7 h-7 object-contain inline mx-px"
                :src="messagePart.value"
              >
            </div>
          </div>
        </template>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useUrlSearchParams } from "@vueuse/core"

const params = useUrlSearchParams("history")

const routeParams = {
  kick: params.kick as string,
  twitch: params.twitch as string,
  restreamToken: params.restreamToken as string,
}

console.log("routeParams", routeParams)

const kickChat = useKickChat(routeParams.kick)
const twitchChat = useTwitchChat(routeParams.twitch)
const youtubeChat = useRestream(routeParams.restreamToken)
const combinedChat = computed(() => {
  const res = [
    ...kickChat.value,
    ...twitchChat.value,
    ...youtubeChat.value,
  ].filter(chatMessage => !chatMessage.isDeleted)
  res.sort((a, b) => a.created_at - b.created_at)
  return res
})
</script>

<style>
.list-move,
.list-leave-active,
.list-enter-active {
  transition: all 0.5s ease-out;
}

.list-leave-to {
  opacity: 0;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(64px);
}

.list-leave-active {
  position: absolute;
}
</style>
