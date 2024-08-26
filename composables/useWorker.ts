import { ChannelSubscription, ChatMessage, MessageRemovalOptions, MessageToClient } from "~/types/common"

import MyWorker from "@/assets/workers/worker.ts?sharedworker"

const useWorker = (
  subscriptions: ChannelSubscription[],
  callbacks?: {
    onAdd?: (message: ChatMessage) => void,
    onRemove?: (message: MessageRemovalOptions) => void,
  }
) => {
  let heartbeatTimerId = -1
  let worker: SharedWorker | undefined = undefined

  const restartHeartbeatTimeout = () => {
    clearTimeout(heartbeatTimerId)
    heartbeatTimerId = window.setTimeout(() => {
      console.log("useWorker did not receive a message in 5 seconds... reconnecting to worker")
      connectToWorker()
    }, 5000)
  }

  const connectToWorker = () => {
    restartHeartbeatTimeout()
    console.log("useWorker: Connecting to worker...")
    worker?.port.postMessage({ type: "close" })
    worker?.port.close()
    worker = new MyWorker() as SharedWorker // Ideally this shouldn't need to be cast. Investigate import type.

    console.log("useWorker: Connected")
    worker.port.onmessage = (event: MessageEvent) => {
      if (event.data) {
        const eventData = event.data as MessageToClient
        switch (eventData.type) {
          case "ping":
            // logger.debug("received ping, responding with pong")
            worker?.port.postMessage({ type: "pong" })
            restartHeartbeatTimeout()
            break
          case "chatMessage":
            callbacks?.onAdd?.(eventData.message)
            break
          case "removedMessage":
            callbacks?.onRemove?.(eventData.message)
            break
          default:
            console.warn("useWorker: Unknown worker message", event)
        }
      }
    }
    worker.port.onmessageerror = (event: MessageEvent) => {
      connectToWorker()
    }
    console.log("useWorker: Subscribing to channels", subscriptions)
    worker.port.postMessage({ type: "subscribe", subscriptions })
  }

  // call connectToWorker after a random amount of time to possibly fix duplicate twitch messages
  setTimeout(() => {
    connectToWorker()
  }, Math.random() * 2000)

  onScopeDispose(() => {
    console.log("useWorker: onScopeDispose")
    clearTimeout(heartbeatTimerId)
    worker?.port.postMessage({ type: "close" })
    worker?.port.close()
    worker = undefined
  })

  return { connectToWorker }
}

export default useWorker
