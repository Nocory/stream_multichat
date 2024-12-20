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
      <button class="ring" @click="showParticipants">
        Participants
      </button>
      <button class="ring" @click="showWinners">
        Winners
      </button>
      <div>{{ totalParticipants }}</div>
    </div>
    <Transition mode="out-in">
      <div
        v-if="recentWinner"
        :key="recentWinner?.userName"
        class="flex items-center gap-2 bg-white rounded-full ring-1 ring-slate-700 ring-opacity-75 px-8 py-6 shadow-lg max-w-[90vw]"
      >
        <img
          class="multichat-message__platform h-10 w-10 object-contain mr-1"
          :src="`/platforms/${recentWinner.platform}.png`"
        >
        <div class="text-slate-700 text-3xl font-bold truncate">
          {{ recentWinner.userName }}
        </div>
      </div>
      <div
        v-else-if="(areParticipantsVisible || areWinnersVisible) && !recentWinner"
        :key="areParticipantsVisible ? 'participants' : 'winners'"
        class="p-4"
        :class="recentWinner ? 'hidden' : ''"
      >
        <div class="flex flex-col gap-4 items-center">
          <div v-if="areParticipantsVisible" class="bg-white text-slate-700 text-2xl font-bold ring ring-slate-700 px-4 py-2 shadow-lg">
            Raffle: "{{ raffleWord }}"
          </div>
          <div v-else-if="areWinnersVisible" class="bg-white text-slate-700 text-2xl font-bold ring ring-slate-700 px-4 py-2 shadow-lg">
            Winners
          </div>
          <div class="flex flex-wrap items-center gap-1">
            <div
              v-for="entry in areParticipantsVisible ? raffleParticipants : raffleWinners"
              :key="`${entry.platform}_${entry.userName}`"
              class="flex items-center bg-white p-1 ring-1 ring-slate-700"
              :class="areParticipantsVisible ? 'max-w-[16rem]' : 'max-w-[80vw]'"
            >
              <img
                class="multichat-message__platform h-5 w-5 object-contain mr-1 inline"
                :src="`/platforms/${entry.platform}.png`"
              >
              <div class="text-slate-700 font-bold truncate">
                {{ entry.userName }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="recentRaffleWord">
        <div class="flex flex-col gap-2 items-center bg-white text-slate-700 text-2xl font-bold ring ring-slate-700 px-4 py-2 shadow-lg">
          <div>
            New Raffle
          </div>
          <div>
            "{{ raffleWord }}"
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
const recentRaffleWord = refAutoReset("", 8000)
watchEffect(() => {
  recentRaffleWord.value = raffleWord.value
})
const raffleWordFilter = ref<string[]>([])
const recentWinner = refAutoReset<RaffleParticipant | null>(null, 10000)
const areParticipantsVisible = ref(false)
const areWinnersVisible = ref(false)

const totalParticipants = computed(() => Object.keys(raffleParticipants.value).length)

const location = useBrowserLocation()
const urlParams = useUrlSearchParams()

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
  areParticipantsVisible.value = false
  areWinnersVisible.value = false
  recentWinner.value = raffleParticipants.value[winnerKey]

  delete raffleParticipants.value[winnerKey]
  if (urlParams.confetti !== "false") {
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 90,
        startVelocity: 40,
        origin: { y: 0.6 },
      })
    }, 200)
  }
}

const showParticipants = () => {
  areWinnersVisible.value = false
  areParticipantsVisible.value = !areParticipantsVisible.value
}

const showWinners = () => {
  areParticipantsVisible.value = false
  areWinnersVisible.value = !areWinnersVisible.value
}

const stopRaffle = () => {
  raffleWord.value = ""
  raffleWinners.value = {}
  raffleParticipants.value = {}
}

const handleCommand = (command: string) => {
  // handle raffle stop
  if (command.startsWith("!raffle stop") || command.startsWith("!raffle end")) {
    stopRaffle()
    return
  }

  // handle raffle simulation
  if (command.startsWith("!raffle simulate")) {
    simulateRaffleEntries()
    return
  }

  // handle raffle reset
  if (command.startsWith("!raffle reset")) {
    raffleParticipants.value = {}
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

  if (command.startsWith("!raffle pick")) {
    pickWinner()
    return
  }

  if (command.startsWith("!raffle entries") || command.startsWith("!raffle show") || command.startsWith("!raffle participants")) {
    showParticipants()
    return
  }

  if (command.startsWith("!raffle winners")) {
    showWinners()
  }
}

const handleMessage = (message: ChatMessage) => {
  if (message.messageParts[0]?.type !== "text") return

  const messagePart = message.messageParts[0].value.trim()

  if (messagePart.startsWith("!raffle") && (message.isHost || message.isModerator || message.userName === "itsConroy")) {
    handleCommand(messagePart)
  } else if (raffleWord.value && messagePart === raffleWord.value) {
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
  for (let i = 0; i < 200; i++) {
    handleMessage({
      id: "some_id",
      createdAt: 0,
      platform: "twitch",
      channel: "itsconroy",
      userName: `Uuuuusssssseeeeerr_${i}`,
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
