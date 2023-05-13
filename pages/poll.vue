<template>
  <div v-if="pollOptions.length !== 0" class="h-screen overflow-hidden">
    <div class="flex flex-col gap-1 items-stretch w-full ">
      <div
        v-if="pollTitle"
        class="bg-gray-600 text-white min-h-[2rem] px-2 py-1"
      >
        <span>
          Chat Umfrage:
        </span>
        <span class="font-bold">
          {{ pollTitle }}
        </span>
      </div>
      <div
        v-for="(option, index) in pollOptions"
        :key="option"
        class="flex flex-1 leading-none min-h-[2rem] border border-white"
        :class="{
          'min-h-[1.5rem]': pollOptions.length >= 4 && pollOptions.length < 6,
          'min-h-[1.25rem]': pollOptions.length >= 6,
        }"
      >
        <div
          class="font-bold w-10 flex justify-center items-center bg-slate-50 leading-none p-px box-content"
        >
          {{ isYesNoPoll ? pollOptions[index] : index + 1 }}
        </div>
        <div
          class="flex items-center bg-slate-400/60 relative flex-1 box-content"
        >
          <div
            class="bg-slate-900 h-full w-full absolute top-0 left-0 origin-left z-0
                  transition-all ease-linear duration-500"
            :style="`transform: scaleX(${talliedVotes[index + 1] ? talliedVotes[index + 1] / totalVotes : 0});`"
          />
          <div class="z-50 h-full flex items-center gap-2 px-2 font-bold leading-none text-white flex-1 overflow-hidden">
            <div
              v-if="showOptionNames"
              class="relative flex items-center"
            >
              <div class="absolute inset-0 bg-black/10 z-0 -m-8 blur-lg" />
              <div class="z-10">
                {{ option }}
              </div>
            </div>
            <div
              v-if="showOptionNames"
              class="flex-1"
            />
            <div v-if="talliedVotes[index + 1]" class="relative z-50">
              {{ Math.round((talliedVotes[index + 1] / totalVotes) * 1000) / 10 }}%
            </div>
            <div v-if="talliedVotes[index + 1]" class="relative z-50">
              ({{ talliedVotes[index + 1] }})
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- <button class="bg-slate-800 text-white p-4 m-2" @click="startVote(['option a','option b','option c','option d'])">
      start vote
    </button> -->
    <!-- <button class="bg-slate-800 text-white p-4 m-2" @click="simulateVotes">
      randomize
    </button> -->
  </div>
</template>

<script setup lang="ts">
import { ChatMessage } from "~/types/common"

const VOTE_GRACE_PERIOD_MS = 5000

const pollOptions = ref<string[]>([])
const showOptionNames = ref(true)
const pollTitle = ref("")
const isYesNoPoll = ref(false)
const votes = ref<Record<string, {
  choice: number,
  timestamp: number,
}>>({
  123: {
    choice: 1,
    timestamp: 0,
  }
})

const talliedVotes = computed(() => {
  const result = Object.values(votes.value).reduce((acc, vote) => {
    acc[vote.choice] = acc[vote.choice] ? acc[vote.choice] + 1 : 1
    return acc
  }, {} as Record<string, number>)
  return result
})

const totalVotes = computed(() => Object.keys(votes.value).length)

const startNumberPoll = (optionCount: number) => {
  pollOptions.value = Array.from({ length: optionCount }, (_, i) => `${i + 1}`)
  showOptionNames.value = false
  // filter previously cast votes by grace period and check if choice is in valid range
  const now = Date.now()
  votes.value = Object.fromEntries(Object.entries(votes.value).filter(([key, value]) => {
    return (now - value.timestamp < VOTE_GRACE_PERIOD_MS) && (value.choice >= 1 && value.choice <= optionCount)
  }))
}

const startYesNoPoll = (title: string) => {
  isYesNoPoll.value = true
  pollTitle.value = title
  pollOptions.value = ["ja", "nein"]
  showOptionNames.value = false
}

const startNamedPoll = (title: string, options: string[]) => {
  pollTitle.value = title
  pollOptions.value = options
  showOptionNames.value = true
  // filter previously cast votes by grace period and check if choice is in valid range
  const now = Date.now()
  votes.value = Object.fromEntries(Object.entries(votes.value).filter(([key, value]) => {
    return (now - value.timestamp < VOTE_GRACE_PERIOD_MS) && (value.choice >= 1 && value.choice <= options.length)
  }))
}

const stopPoll = () => {
  pollOptions.value = []
  votes.value = {}
  pollTitle.value = ""
  isYesNoPoll.value = false
}

const handleCommand = (command: string) => {
  // handle poll stop
  if (command === "!poll stop" || command === "!poll end" || command === "!poll ende") {
    stopPoll()
    return
  }

  // handle poll simulation
  if (command === "!poll simulate") {
    simulateVotes()
    return
  }

  // handle poll reset
  if (command === "!poll reset") {
    votes.value = {}
    return
  }

  if (pollOptions.value.length !== 0) return

  // handle poll start with default options
  if (command === "!poll") {
    startNumberPoll(2)
    return
  }

  // handle poll start with numeric options
  const pollDigit = command.match(/^!poll (\d+)$/i)?.[1]
  if (pollDigit) {
    const parsedNumber = parseInt(pollDigit)
    if (parsedNumber >= 0 && parsedNumber <= 100) {
      startNumberPoll(parsedNumber)
    }
    return
  }

  // handle poll start with text options
  const matchList = command.match(/^!poll\s+(.*)$/i)
  if (matchList) {
    const itemsString = matchList[1]
    if (itemsString.length > 1000) return
    const items = itemsString.split(/\s*,\s*/)
    console.log(items)
    if (items.length === 1) {
      startYesNoPoll(items[0])
    } else if (items.length > 1) {
      startNamedPoll(items[0], items.slice(1))
    }
  }
}

const checkForChoice = (identifier: string, message: string) => {
  if (isYesNoPoll.value) {
    const yesNoChoice = message.match(/^(ja|nein)[ ,]?/i)?.[1].toLowerCase()
    if (!yesNoChoice) return
    votes.value[identifier] = {
      choice: yesNoChoice === "ja" ? 1 : 2,
      timestamp: Date.now()
    }
  } else {
    const choice = message.match(/^(\d+)[ ,]?/i)?.[1]
    if (!choice) return
    const parsedChoice = parseInt(choice)
    if (
      pollOptions.value.length === 0 ||
      (parsedChoice >= 1 && parsedChoice <= pollOptions.value.length)) {
      votes.value[identifier] = {
        choice: parsedChoice,
        timestamp: Date.now()
      }
    }
  }
}

const handleMessage = (message: ChatMessage) => {
  if (message.messageParts[0]?.type !== "text") return

  const messagePart = message.messageParts[0].value
  if (messagePart.startsWith("!poll")) {
    if (message.isHost || message.isModerator) {
      handleCommand(messagePart)
    }
  } else {
    checkForChoice(`${message.platform}_${message.userName}`, message.messageParts[0].value)
  }
}

const simulateVotes = async () => {
  for (let i = 0; i < 150; i++) {
    handleMessage({
      id: "some_id",
      createdAt: 0,
      platform: "twitch",
      channel: "itsconroy",
      userName: i.toString(),
      messageParts: [
        {
          type: "text",
          value: Math.floor(Math.random() * pollOptions.value.length + 1).toString(),
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
