<template>
  <div
    class="h-screen overflow-hidden"
  >
    <div v-if="raffleWord !== ''" class="flex flex-col">
      <div>{{ totalParticipants }} Teilnehmer</div>
      <div class="flex flex-wrap gap-4">
        <div
          v-for="(entry, index) in raffleParticipants"
          :key="index"
          class="flex gap-2"
        >
          <img
            class="multichat-message__platform h-5 w-5 object-contain mr-1 inline"
            :src="`/platforms/${entry.platform}.png`"
          >
          <div>
            {{ entry.userName }}
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="raffleWinner" class="flex flex-col">
      <div>Gewinner:</div>
      <div class="flex">
        <img
          class="multichat-message__platform h-5 w-5 object-contain mr-1 inline"
          :src="`/platforms/${raffleWinner.platform}.png`"
        >
        <div>{{ raffleWinner.userName }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatMessage, StreamingPlatform } from "~/types/common"

type RaffleParticipant = {
  platform: StreamingPlatform,
  userName: string,
}

const raffleParticipants = ref<Record<string, RaffleParticipant>>({})
const raffleWord = ref("")
const raffleWinner = ref<RaffleParticipant | null>(null)

const totalParticipants = computed(() => Object.keys(raffleParticipants.value).length)

const startRaffle = (newRaffleWord: string) => {
  raffleParticipants.value = {}
  raffleWord.value = newRaffleWord
  raffleWinner.value = null
}

const stopRaffle = () => {
  raffleWord.value = ""
  const participantKeys = Object.keys(raffleParticipants.value)
  const randomIndex = Math.floor(Math.random() * participantKeys.length)
  raffleWinner.value = raffleParticipants.value[participantKeys[randomIndex]]
  raffleParticipants.value = {}
}

const handleCommand = (command: string) => {
  // handle raffle stop
  if (command === "!raffle stop" || command === "!raffle end" || command === "!raffle ende") {
    stopRaffle()
    return
  }

  // handle raffle simulation
  if (command === "!raffle simulate") {
    simulateRaffleEntries()
    return
  }

  // handle raffle reset
  if (command === "!raffle reset") {
    raffleParticipants.value = {}
    return
  }

  // handle raffle start
  const messageParts = command.split(" ")
  if (messageParts.length === 2 && messageParts[0] === "!raffle") {
    startRaffle(messageParts[1])
  }
}

const handleMessage = (message: ChatMessage) => {
  if (message.messageParts[0]?.type !== "text") return

  const messagePart = message.messageParts[0].value

  if (messagePart.startsWith("!raffle") && (message.isHost || message.isModerator || message.userName === "itsConroy")) {
    handleCommand(messagePart)
  } else if (raffleWord.value && !raffleParticipants.value[message.id] && messagePart.toLowerCase() === raffleWord.value.toLowerCase()) {
    if (raffleParticipants.value[message.id]) return
    const raffleId = `${message.platform}_${message.userName}`
    raffleParticipants.value[raffleId] = {
      platform: message.platform,
      userName: message.userName,
    }
  }
}

const simulateRaffleEntries = async () => {
  for (let i = 0; i < 150; i++) {
    handleMessage({
      id: "some_id",
      createdAt: 0,
      platform: "twitch",
      channel: "itsconroy",
      userName: `User_${i}`,
      messageParts: [
        {
          type: "text",
          value: "test",
        }
      ],
      isDeleted: false,
      isHost: false,
      isModerator: false,
    })
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}

const subscriptions = getChannelsFromUrl()
useWorker(subscriptions, { onAdd: handleMessage })
</script>

<style scoped>

</style>
