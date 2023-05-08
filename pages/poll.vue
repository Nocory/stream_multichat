<template>
  <div v-if="voteOptions.length !== 0" class="h-screen overflow-hidden">
    <div class="flex flex-col items-stretch w-full">
      <div
        v-for="(option, index) in voteOptions"
        :key="option"
        class="flex flex-col"
      >
        <div class="flex flex-col flex-1 mb-1 border border-white">
          <div class="flex">
            <div class="font-bold w-10 flex justify-center items-center bg-slate-50 leading-none">
              {{ index + 1 }}
            </div>
            <div
              class="flex items-center bg-slate-500/90 h-8 relative flex-1"
              :class="{
                '!h-6': voteOptions.length > 4 && voteOptions.length <= 6,
                '!h-5': voteOptions.length > 6 && voteOptions.length <= 8,
                '!h-4': voteOptions.length > 8,
              }"
            >
              <div
                class="bg-slate-900 h-full w-full absolute top-0 left-0 origin-left z-0 transition-all ease-linear duration-200"
                :style="`transform: scaleX(${talliedVotes[index + 1] ? talliedVotes[index + 1] / totalVotes : 0});`"
              />
              <div
                class="z-50 flex items-center gap-2 mx-2 font-bold leading-none text-white flex-1"
              >
                <div v-if="showOptionNames" class="flex-1">
                  {{ option }}
                </div>
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

const voteOptions = ref<string[]>([])
const showOptionNames = ref(false)
const votes = ref<Record<string, {
  choice: number,
  timestamp: number,
}>>({})

const talliedVotes = computed(() => {
  const result = Object.values(votes.value).reduce((acc, vote) => {
    acc[vote.choice] = acc[vote.choice] ? acc[vote.choice] + 1 : 1
    return acc
  }, {} as Record<string, number>)
  return result
})

const totalVotes = computed(() => Object.keys(votes.value).length)

const startVote = (voteNames: string[]) => {
  voteOptions.value = voteNames
  // filter previously cast votes by grace period and check if choice is in valid range
  const now = Date.now()
  votes.value = Object.fromEntries(Object.entries(votes.value).filter(([key, value]) => {
    return (now - value.timestamp < VOTE_GRACE_PERIOD_MS) && (value.choice >= 1 && value.choice <= voteNames.length)
  }))
}

const stopVote = () => {
  voteOptions.value = []
  votes.value = {}
}

const handleCommand = (command: string) => {
  // handle poll stop
  if (command === "!poll stop" || command === "!poll end" || command === "!poll ende") {
    stopVote()
    return
  }

  // handle poll simulation
  if (command === "!poll simulate") {
    simulateVotes()
    return
  }

  if (voteOptions.value.length !== 0) return

  // handle poll start with default options
  if (command === "!poll") {
    showOptionNames.value = false
    startVote(["1", "2"])
    return
  }

  // handle poll reset
  if (command === "!poll reset") {
    votes.value = {}
    return
  }

  // handle poll start with numeric options
  const pollDigit = command.match(/^!poll (\d+)$/i)?.[1]
  if (pollDigit) {
    const parsedNumber = parseInt(pollDigit)
    if (parsedNumber >= 0 && parsedNumber <= 100) {
      const stringOptions = Array.from({ length: parsedNumber }, (_, i) => `${i + 1}`)
      showOptionNames.value = false
      startVote(stringOptions)
    }
    return
  }

  // handle poll start with text options
  const matchList = command.match(/^!poll\s+(.*)$/i)
  if (matchList) {
    const itemsString = matchList[1]
    if (itemsString.length > 1000) return
    const items = itemsString.split(/\s*,\s*/)
    if (items.length > 0 && items.length <= 100) {
      showOptionNames.value = true
      startVote(items)
    }
  }
}

const checkForChoice = (identifier: string, message: string) => {
  const numberChoice = message.match(/^(\d+)[ ,]?/i)?.[0]

  if (numberChoice) {
    const numericChoice = parseInt(numberChoice)
    if (
      voteOptions.value.length === 0 ||
      (numericChoice >= 1 && numericChoice <= voteOptions.value.length)) {
      votes.value[identifier] = {
        choice: numericChoice,
        timestamp: Date.now()
      }
    }
  }
}

const handleMessage = (message: ChatMessage) => {
  if (message.messageParts[0]?.type !== "text") return

  const messagePart = message.messageParts[0].value
  if (messagePart.startsWith("!")) {
    if (message.isHost || message.isModerator) {
      handleCommand(messagePart)
    }
  } else {
    checkForChoice(`${message.platform}_${message.userName}`, message.messageParts[0].value)
  }
}

const simulateVotes = async () => {
  for (let i = 0; i < 250; i++) {
    handleMessage({
      id: "some_id",
      createdAt: 0,
      platform: "twitch",
      channel: "itsconroy",
      userName: i.toString(),
      messageParts: [
        {
          type: "text",
          value: Math.floor(Math.random() * voteOptions.value.length + 1).toString(),
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
