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
        <img
          v-if="showPlatformIcons"
          class="multichat-message__platform h-5 w-5 object-contain mr-1 inline"
          :src="`/platforms/${chatMessage.platform}.png`"
        >
        <span
          class="multichat-message__user font-bold mr-1 inline-block"
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
import { useIntervalFn, useUrlSearchParams } from "@vueuse/core"
import useWorker from "~/composables/useWorker"

const router = useRouter()
const params = useUrlSearchParams("history")

const routeParams = {
  // debug
  autochat: params.autochat as string,
  // appearance
  forcePlatformIcons: params["force-platform-icons"] as string,
}
console.log("routeParams", routeParams, params)

const subscriptions = getChannelsFromUrl()

// navigate to /create-url if no parameters are set
if (subscriptions.length === 0 && !routeParams.autochat) {
  router.push("/create-url")
}
const showPlatformIcons = routeParams.forcePlatformIcons === "true" ||
  routeParams.autochat === "true" ||
  subscriptions.length > 1

const messageBuffer = useMessageBuffer()
useWorker(subscriptions, {
  onAdd: messageBuffer.add,
  onRemove: messageBuffer.remove,
})
const displayedMessages = useDisplayedMessages(messageBuffer)

const visibleChat = computed(() => {
  return displayedMessages.value.filter(chatMessage => !chatMessage.isDeleted)
  // return []
})

useIntervalFn(
  () => {
  // fetch "redirect.txt" on this address with an additional parameter to bust the cache
  // this will trigger a redirect to the latest version of the site
    fetch(`/redirect-branch.txt?cachebust=${Date.now()}`)
      .then(response => {
        if (response.headers.get("content-type")?.includes("text/plain")) {
          return response.text()
        } else {
          throw new Error("redirect-branch.txt not found")
        }
      })
      .then(redirectBranch => {
        if (redirectBranch && process.env.NODE_ENV === "production") {
          window.location.assign(`https://${redirectBranch}--stream-multichat.netlify.app/${location.search}`)
        }
      })
      .catch(error => {
        console.warn("redirect-branch.txt warn", error)
      })
  },
  10000,
)
</script>
