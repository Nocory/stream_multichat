import { ChannelSubscription, ChatMessage, MessageRemovalOptions, MessageToClient } from "~/types/common"

import MyWorker from "@/assets/workers/worker.ts?sharedworker"

const useWorker = (
  subscriptions: ChannelSubscription[],
  callbacks?: {
    onAdd?: (message: ChatMessage) => void,
    onRemove?: (message: MessageRemovalOptions) => void,
  }
) => {
  let worker: SharedWorker | undefined = undefined

  const connectToWorker = () => {
    console.log("useWorker connectToWorker A")
    worker = new MyWorker() as SharedWorker // Ideally this shouldn't need to be cast. Investigate import type.

    console.log("useWorker connectToWorker B")
    worker.port.onmessage = (event: MessageEvent) => {
      if (event.data) {
        const eventData = event.data as MessageToClient
        switch (eventData.type) {
          case "ping":
            // logger.debug("received ping, responding with pong")
            worker?.port.postMessage({ type: "pong" })
            break
          case "chatMessage":
            callbacks?.onAdd?.(eventData.message)
            break
          case "removedMessage":
            callbacks?.onRemove?.(eventData.message)
            break
          default:
            console.warn("Unknown worker message", event)
        }
      }
    }
    console.log("useWorker subscribing to channels", subscriptions)
    worker.port.postMessage({ type: "subscribe", subscriptions })
  }

  connectToWorker()

  onScopeDispose(() => {
    console.log("useWorker onScopeDispose")
    worker?.port.postMessage({ type: "close" })
    worker?.port.close()
    worker = undefined
  })
}

export default useWorker
