<template>
  <div
    class="h-screen overflow-hidden flex justify-center items-center"
  >
    <div v-if="location.hostname === 'localhost'" class="flex gap-4 absolute top-0 left-0">
      <button class="ring" @click="startRaffle('test')">
        Start
      </button>
      <button class="ring" @click="simulateRaffleEntries">
        Simulate
      </button>
      <button class="ring" @click="pickWinner">
        PickWinner
      </button>
      <button class="ring" @click="stopRaffle">
        Stop
      </button>
      <button class="ring" @click="areParticipantsVisible = true">
        Participants
      </button>
      <button class="ring" @click="areWinnersVisible = true">
        Winners
      </button>
      <div>{{ totalParticipants }}</div>
    </div>
    <Transition>
      <div
        v-if="recentWinner"
        class="flex items-center gap-2 bg-white rounded-full ring-1 ring-slate-700 ring-opacity-75 px-8 py-6 shadow-lg"
      >
        <img
          class="multichat-message__platform h-10 w-10 object-contain mr-1"
          :src="`/platforms/${recentWinner.platform}.png`"
        >
        <div class="text-slate-700 text-3xl font-bold">
          {{ recentWinner.userName }}
        </div>
      </div>
    </Transition>
    <Transition>
      <div
        v-if="(areParticipantsVisible || areWinnersVisible) && !recentWinner"
        class="p-4"
        :class="recentWinner ? 'hidden' : ''"
      >
        <div class="flex flex-col gap-4 items-center">
          <div v-if="areParticipantsVisible" class="bg-white text-slate-700 text-2xl font-bold ring ring-slate-700 px-4 py-2">
            Raffle: "{{ raffleWord }}"
          </div>
          <div v-else-if="areWinnersVisible" class="bg-white text-slate-700 text-2xl font-bold ring ring-slate-700 px-4 py-2">
            Winners
          </div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="entry in areParticipantsVisible ? raffleParticipants : raffleWinners"
              :key="`${entry.platform}_${entry.userName}`"
              class="flex items-center bg-white px-2 ring-1 ring-slate-700"
            >
              <img
                class="multichat-message__platform h-5 w-5 object-contain mr-1 inline"
                :src="`/platforms/${entry.platform}.png`"
              >
              <div class="text-slate-700 text-xl font-bold ">
                {{ entry.userName }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { refAutoReset, useBrowserLocation, useUrlSearchParams } from "@vueuse/core"
import confetti from "canvas-confetti"
import { ChatMessage, StreamingPlatform } from "~/types/common"

type RaffleParticipant = {
  platform: StreamingPlatform,
  userName: string,
}

const raffleParticipants = ref<Record<string, RaffleParticipant>>({})
const raffleWinners = ref<Record<string, RaffleParticipant>>({})
const raffleWord = ref("")
const raffleWordFilter = ref<string[]>([])
const recentWinner = refAutoReset<RaffleParticipant | null>(null, 10000)
const areParticipantsVisible = refAutoReset(false, 10000)
const areWinnersVisible = refAutoReset(false, 10000)

const totalParticipants = computed(() => Object.keys(raffleParticipants.value).length)

const location = useBrowserLocation()

const startRaffle = (newRaffleWord: string) => {
  raffleParticipants.value = {}
  raffleWinners.value = {}
  raffleWord.value = newRaffleWord
}

const pickWinner = () => {
  const participantKeys = Object.keys(raffleParticipants.value)
  if (participantKeys.length === 0) return

  const randomIndex = Math.floor(Math.random() * participantKeys.length)
  const winnerKey = participantKeys[randomIndex]

  raffleWinners.value[winnerKey] = (raffleParticipants.value[winnerKey])
  recentWinner.value = raffleParticipants.value[winnerKey]

  delete raffleParticipants.value[winnerKey]
  confetti({
    particleCount: 60,
    spread: 90,
    startVelocity: 40,
    origin: { y: 0.6 },
  })
}

const stopRaffle = () => {
  raffleWord.value = ""
  raffleWinners.value = {}
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
    raffleWinners.value = {}
    return
  }

  // handle disqualification
  const disqualifiedWord = command.match(/(?<=!raffle (dq|disqualified) ).*/g)
  if (disqualifiedWord?.length === 1) {
    raffleWordFilter.value.push(disqualifiedWord[0])
    raffleParticipants.value = Object.fromEntries(Object.entries(raffleParticipants.value).filter(([key, value]) => !value.userName.includes(disqualifiedWord[0])))
    raffleWinners.value = Object.fromEntries(Object.entries(raffleWinners.value).filter(([key, value]) => !value.userName.includes(disqualifiedWord[0])))
    return
  }

  // handle raffle start
  const newRaffleWord = command.match(/(?<=!raffle start ).*/g)
  if (newRaffleWord?.length === 1) {
    startRaffle(newRaffleWord[0])
    return
  }

  if (command === "!raffle pick") {
    pickWinner()
    return
  }

  if (command === "!raffle entries") {
    areParticipantsVisible.value = true
    return
  }

  if (command === "!raffle winners") {
    areParticipantsVisible.value = true
  }
}

const handleMessage = (message: ChatMessage) => {
  if (message.messageParts[0]?.type !== "text") return

  const messagePart = message.messageParts[0].value

  if (messagePart.startsWith("!raffle") && (message.isHost || message.isModerator || message.userName === "itsConroy")) {
    handleCommand(messagePart)
  } else if (raffleWord.value && messagePart.trim() === raffleWord.value) {
    const raffleId = `${message.platform}_${message.userName}`
    if (raffleParticipants.value[raffleId]) return
    if (raffleWinners.value[raffleId]) return
    if (raffleWordFilter.value.some(word => message.userName.includes(word))) return
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
          value: raffleWord.value,
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
.v-enter-active {
  transition: opacity 0.33s ease-out, transform 0.67s cubic-bezier(.47,1.64,.41,.8);
  transform: translateY(0);
}
.v-leave-active {
  transition: all 0.5s ease-in;
  transform: translateY(0);
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translateY(5rem);
}
</style>
