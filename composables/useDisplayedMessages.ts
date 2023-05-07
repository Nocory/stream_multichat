import { tryOnScopeDispose, useDocumentVisibility, useIntervalFn } from "@vueuse/core"
import { MessageBuffer } from "./useMessageBuffer"
import { ChatMessage } from "~/types/common"

const MAX_MESSAGES_TO_DISPLAY = 20
const MAX_INTERVAL = 333

const useDisplayedMessages = (messageBuffer: MessageBuffer) => {
  const messages = ref<ChatMessage[]>([])
  const messagesPerSecond = ref<number[]>([])

  let indexCheckSnapshot = 0
  let nextTakeIndex = 0
  let timerId: undefined | number = undefined

  const documentVisibility = useDocumentVisibility()

  watch(documentVisibility, newVisibility => {
    console.log("documentVisibility", newVisibility)
    if (newVisibility === "visible") {
      window.clearTimeout(timerId)
      timerId = undefined
      nextTakeIndex = messageBuffer.writeIndex.value
      messages.value = messageBuffer.getAllMessages().slice(-MAX_MESSAGES_TO_DISPLAY)
    }
  })

  const averageMessagesPerSecond = computed(() => {
    if (messagesPerSecond.value.length === 0) return Number.POSITIVE_INFINITY
    return messagesPerSecond.value.reduce((a, b) => a + b, 0) / messagesPerSecond.value.length
  })

  let lastIntervalTime = Date.now()
  useIntervalFn(() => {
    const messagesSinceLastCheck = (messageBuffer.writeIndex.value - indexCheckSnapshot)
    indexCheckSnapshot = messageBuffer.writeIndex.value
    if (messagesPerSecond.value.length >= 5) {
      messagesPerSecond.value.shift()
    }
    const now = Date.now()
    const timeDiff = now - lastIntervalTime
    lastIntervalTime = now
    messagesPerSecond.value.push(messagesSinceLastCheck / (timeDiff / 1000))
  }, 1000)

  const processNextMessage = () => {
    window.clearInterval(timerId)

    if (nextTakeIndex < messageBuffer.writeIndex.value) {
      messages.value = [
        ...messages.value.slice(-(MAX_MESSAGES_TO_DISPLAY - 1)),
        messageBuffer.messageBuffer.value[nextTakeIndex % messageBuffer.MESSAGE_BUFFER_SIZE],
      ]
      nextTakeIndex = nextTakeIndex + 1
      const averagedInterval = 1000 / averageMessagesPerSecond.value
      const intervalFactor = Math.max(
        0,
        1 - (((messageBuffer.writeIndex.value - nextTakeIndex) - 10) * 5 / messageBuffer.MESSAGE_BUFFER_SIZE)
      )
      const nextInterval = Math.min(MAX_INTERVAL, averagedInterval * intervalFactor)
      // console.log("nextInterval", {
      //   backlog: messageBuffer.writeIndex.value - nextTakeIndex,
      //   perSec: averageMessagesPerSecond.value.toFixed(2),
      //   delay: nextInterval.toFixed(2),
      // })
      timerId = window.setTimeout(processNextMessage, nextInterval)
    } else {
      timerId = undefined
    }
  }

  watch(messageBuffer.writeIndex, newWriteIndex => {
    if (newWriteIndex - nextTakeIndex >= messageBuffer.MESSAGE_BUFFER_SIZE) {
      processNextMessage()
    }

    if (timerId === undefined) {
      processNextMessage()
    }
  })

  tryOnScopeDispose(() => {
    console.log("useDisplayedMessages tryOnScopeDispose")
    window.clearInterval(timerId)
  })

  return messages
}

export default useDisplayedMessages
