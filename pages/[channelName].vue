<template>
  <div class="h-screen overflow-hidden">
    <TransitionGroup
      name="list"
      tag="div"
      class="absolute bottom-0 left-0 p-4"
    >
      <div
        v-for="chatMessage in combinedChat"
        :key="chatMessage.id"
        class="py-1"
      >
        <img class="h-5 inline" :src="`/platforms/${chatMessage.platform}.png`">
        <span
          class="font-bold px-1"
          v-text="chatMessage.userName + ':'"
        />
        <template
          v-for="(messagePart, i) in chatMessage.messageParts"
          :key="`messagePart_${chatMessage.id}_${i}`"
        >
          <span
            v-if="messagePart.type === 'text'"
            v-text="messagePart.value"
          />
          <img
            v-else-if="messagePart.type === 'image'"
            class="h-5 inline"
            :src="messagePart.value"
          >
        </template>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const kickChat = useKickChat(route.params.channelName as string)
// useTwitchChat
// useYoutubeChat
const combinedChat = computed(() => kickChat.value.filter(chatMessage => !chatMessage.isDeleted))
</script>

<style>
.list-move,
.list-leave-active {
  transition: all 0.5s ease-out;
}
.list-enter-active {
  transition: all 0.5s ease-out 0.2s;
}

.list-leave-to,
.list-enter-from {
  opacity: 0;
}

.list-leave-active {
  position: absolute;
}
</style>
