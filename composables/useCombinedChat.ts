import { ChatMessage } from "~/types/common"

export interface CombinedChat {
  messages: Ref<ChatMessage[]>
  addMessage: (message: ChatMessage) => void
  removeMessage: (id: string) => void
}

const MAX_MESSAGES_TO_DISPLAY = 100
const MAX_MESSAGE_QUEUE_LENGTH = 200
const BASE_INTERVAL = 200

const useCombinedChat = (): CombinedChat => {
  const messages = ref<ChatMessage[]>([])
  const messageQueue = ref<ChatMessage[]>([])
  const intervalTimer = ref<number | null>(null)

  const processQueue = () => {
    if (intervalTimer.value !== null) clearInterval(intervalTimer.value)

    if (messageQueue.value.length > 0) {
      messages.value = [
        ...messages.value.slice(-(MAX_MESSAGES_TO_DISPLAY - 1)),
        messageQueue.value.shift()!,
      ]
      const intervalFactor = Math.min(
        1,
        Math.max(0.1, 1.1 - (messageQueue.value.length * 2) / MAX_MESSAGE_QUEUE_LENGTH)
      )
      // console.log("processQueue", messageQueue.value.length, BASE_INTERVAL * intervalFactor)
      intervalTimer.value = window.setTimeout(processQueue, BASE_INTERVAL * intervalFactor)
    } else {
      intervalTimer.value = null
      // console.log("processQueue END")
    }
  }

  const addMessage = (message: ChatMessage) => {
    if (messageQueue.value.length > MAX_MESSAGE_QUEUE_LENGTH) {
      messageQueue.value = [
        ...messageQueue.value.slice(-(MAX_MESSAGE_QUEUE_LENGTH - 1)),
        message,
      ]
    } else {
      messageQueue.value.push(message)
    }
    if (!intervalTimer.value) {
      // console.log("processQueue START")
      processQueue()
    }
  }

  const removeMessage = (id: string) => {
    for (const message of messages.value) {
      if (message.id === id) {
        message.isDeleted = true
      }
    }
    for (const message of messageQueue.value) {
      if (message.id === id) {
        message.isDeleted = true
      }
    }
  }

  onScopeDispose(() => {
    if (intervalTimer.value !== null) clearInterval(intervalTimer.value)
  })

  return {
    messages,
    addMessage,
    removeMessage,
  }
}

export default useCombinedChat
