import { useDocumentVisibility, useIntervalFn } from "@vueuse/core"
import { ChatMessage } from "~/types/common"

type MessageRemovalOptions = Partial<Omit<ChatMessage, "createdAt" | "messageParts" | "isDeleted">>

export interface CombinedChat {
  messages: Ref<ChatMessage[]>
  add: (message: ChatMessage) => void
  remove: (removalOptions: MessageRemovalOptions) => void
}

const MAX_MESSAGES_TO_DISPLAY = 100
const MESSAGE_BUFFER_SIZE = 500
const MAX_INTERVAL = 333

/**
 * The composable is designed to hold the combined chat messages of various platforms.
 * New messages are first added to a circular buffer and then continuously added to the `messages` array.
 * The transfer rate is based on the average rate of recent new messages.
 *
 * @returns the `message` array and associated `add` and `remove` functions
 *
 */
const useCombinedChat = (): CombinedChat => {
  const messages = ref<ChatMessage[]>([])
  const messageBuffer: ChatMessage[] = []
  const recentMessagesPerSecond = ref<number[]>([])

  let previousAddIndex = 0
  let nextAddIndex = 0
  let nextTakeIndex = 0
  let timerId: undefined | number = undefined

  const documentVisibility = useDocumentVisibility()

  watch(documentVisibility, newVisibility => {
    console.log("documentVisibility", newVisibility)
    if (newVisibility === "visible") {
      window.clearTimeout(timerId)
      timerId = undefined
      nextTakeIndex = nextAddIndex
      const newMessages: ChatMessage[] = []
      for (let i = Math.max(0, nextAddIndex - MAX_MESSAGES_TO_DISPLAY); i < nextAddIndex; i++) {
        newMessages.push(messageBuffer[i % MESSAGE_BUFFER_SIZE])
      }
      messages.value = newMessages
    }
  })

  const averagerecentMessagesPerSecond = computed(() => {
    if (recentMessagesPerSecond.value.length === 0) return Number.POSITIVE_INFINITY
    return recentMessagesPerSecond.value.reduce((a, b) => a + b, 0) / recentMessagesPerSecond.value.length
  })

  let lastIntervalTime = Date.now()
  useIntervalFn(() => {
    const messagesSinceLastCheck = (nextAddIndex - previousAddIndex)
    previousAddIndex = nextAddIndex
    if (recentMessagesPerSecond.value.length >= 5) {
      recentMessagesPerSecond.value.shift()
    }
    const now = Date.now()
    const timeDiff = now - lastIntervalTime
    lastIntervalTime = now
    recentMessagesPerSecond.value.push(messagesSinceLastCheck / (timeDiff / 1000))
  }, 1000)

  const processNextMessage = () => {
    window.clearInterval(timerId)

    if (nextTakeIndex < nextAddIndex) {
      messages.value = [
        ...messages.value.slice(-(MAX_MESSAGES_TO_DISPLAY - 1)),
        messageBuffer[nextTakeIndex % MESSAGE_BUFFER_SIZE],
      ]
      nextTakeIndex = nextTakeIndex + 1
      const averagedInterval = 1000 / averagerecentMessagesPerSecond.value
      const intervalFactor = Math.max(0, 1 - (((nextAddIndex - nextTakeIndex) - 10) * 5 / MESSAGE_BUFFER_SIZE))
      const nextInterval = Math.min(MAX_INTERVAL, averagedInterval * intervalFactor)
      // console.log(
      //   "processNextMessage",
      //   nextAddIndex,
      //   nextTakeIndex,
      //   averagerecentMessagesPerSecond.value.toFixed(2),
      //   (nextAddIndex - nextTakeIndex),
      //   averagedInterval.toFixed(2),
      //   intervalFactor.toFixed(2),
      //   nextInterval.toFixed(2),
      // )
      timerId = window.setTimeout(processNextMessage, nextInterval)
    } else {
      timerId = undefined
      // console.log("processNextMessage END")
    }
  }

  const add = (message: ChatMessage) => {
    if (nextAddIndex - nextTakeIndex >= MESSAGE_BUFFER_SIZE) {
      processNextMessage()
    }

    messageBuffer[nextAddIndex % MESSAGE_BUFFER_SIZE] = message
    nextAddIndex = nextAddIndex + 1

    if (timerId === undefined) {
      // console.log("processNextMessage START")
      processNextMessage()
    }
  }

  const remove = (removalOptions:MessageRemovalOptions) => {
    const checkMessage = (message: ChatMessage) => {
      if (message.id === removalOptions.id ||
        (message.userName === removalOptions.userName && message.platform === removalOptions.platform) ||
        (message.userName === "" && message.platform === removalOptions.platform)) {
        message.isDeleted = true
      }
    }
    messages.value.forEach(checkMessage)
    messageBuffer.forEach(checkMessage)
  }

  onScopeDispose(() => {
    window.clearInterval(timerId)
  })

  return {
    messages,
    add,
    remove,
  }
}

export default useCombinedChat
