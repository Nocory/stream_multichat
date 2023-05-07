import { ChatMessage, MessageRemovalOptions } from "~/types/common"

export interface MessageBuffer {
  writeIndex: Ref<number>
  wrappedWriteIndex: ComputedRef<number>
  messageBuffer: Ref<ChatMessage[]>
  add: (message: ChatMessage) => void
  remove: (removalOptions: MessageRemovalOptions) => void
  getAllMessages: () => ChatMessage[],
  MESSAGE_BUFFER_SIZE: number,
}

const MESSAGE_BUFFER_SIZE = 500

const useMessageBuffer = (): MessageBuffer => {
  const writeIndex = ref(0)
  const wrappedWriteIndex = computed(() => writeIndex.value % MESSAGE_BUFFER_SIZE)
  const messageBuffer = ref<ChatMessage[]>([])

  const add = (message: ChatMessage) => {
    messageBuffer.value[wrappedWriteIndex.value] = message
    writeIndex.value = writeIndex.value + 1
  }

  const remove = (removalOptions: MessageRemovalOptions) => {
    const checkMessage = (message: ChatMessage) => {
      if ((
        removalOptions.type === "id" &&
        message.id === removalOptions.id
      ) || (
        removalOptions.type === "channel" &&
        message.platform === removalOptions.platform &&
        message.channel === removalOptions.channel
      ) || (
        removalOptions.type === "user" &&
        message.platform === removalOptions.platform &&
        message.channel === removalOptions.channel &&
        message.userName === removalOptions.userName
      )) {
        message.isDeleted = true
      }
    }
    messageBuffer.value.forEach(checkMessage) // TODO: does messageBuffer need to be reactive?
  }

  const getAllMessages = () => {
    return [
      ...messageBuffer.value.slice(wrappedWriteIndex.value),
      ...messageBuffer.value.slice(0, wrappedWriteIndex.value)
    ]
  }

  return {
    writeIndex,
    wrappedWriteIndex,
    messageBuffer,
    add,
    remove,
    getAllMessages,
    MESSAGE_BUFFER_SIZE,
  }
}

export default useMessageBuffer
