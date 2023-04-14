<template>
  <div class="multichat h-screen overflow-hidden">
    <div
      class="absolute bottom-0 left-0 right-0 p-4 overflow-hidden"
    >
      <div
        v-for="chatMessage in visibleChat"
        :key="chatMessage.id"
        :data-platform="chatMessage.platform"
        :data-id="chatMessage.id"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUrlSearchParams } from "@vueuse/core"
import useCombinedChat from "~/composables/useCombinedChat"

const params = useUrlSearchParams("history")

const routeParams = {
  // platforms
  kick: params.kick as string,
  twitch: params.twitch as string,
  restreamToken: params.restreamToken as string,
  // debug
  autochat: params.autochat as string,
}

console.log("routeParams", routeParams)

const combinedChat = useCombinedChat()

if (routeParams.kick) useKickChat(routeParams.kick, combinedChat)
if (routeParams.twitch) useTwitchChat(routeParams.twitch, combinedChat)
if (routeParams.restreamToken) useRestream(routeParams.restreamToken, combinedChat)
if (routeParams.autochat) useAutoChat(combinedChat)

const visibleChat = computed(() => {
  return combinedChat.messages.value.filter(chatMessage => !chatMessage.isDeleted)
})
</script>
