import { tryOnScopeDispose, useWebSocket } from "@vueuse/core"
import { ChatMessage, MessageRemovalOptions } from "~/types/common"

export default function(
  restreamToken: string,
  callbacks?: {
    onAdd?: (message: ChatMessage) => void,
    onRemove?: (removalOptions: MessageRemovalOptions) => void,
  }
) {
  console.log("useRestream init", restreamToken)
  if (!restreamToken) {
    console.log("RESTREAM: No token provided")
    return
  }

  const handleMessage = (event: MessageEvent<any>) => {
    const parsedEvent = JSON.parse(event.data)
    // console.log("=====")
    // console.log("RESTREAM", parsedEvent)
    switch (parsedEvent.action) {
      case "event":
        if (
          parsedEvent?.payload?.eventPayload?.author?.displayName !== undefined &&
          parsedEvent?.payload?.eventPayload?.text !== undefined
        ) {
          // console.log("YT CHAT", parsedEvent?.payload?.eventPayload)
          callbacks?.onAdd?.({
            id: parsedEvent.payload.eventIdentifier,
            createdAt: Date.now(),
            platform: "youtube",
            channel: "unknown",
            userName: parsedEvent?.payload?.eventPayload?.author.displayName ?? "unknown",
            messageParts: [
              {
                type: "text",
                value: parsedEvent?.payload?.eventPayload?.text ?? "unknown"
              }
            ],
            isDeleted: false,
            isHost: parsedEvent?.payload?.eventPayload?.author?.isChatOwner ?? false,
            isModerator: parsedEvent?.payload?.eventPayload?.author?.isChatModerator ?? false,
          })
        }
        break
      case "heartbeat":
        // console.log("RESTREAM heartbeat")
        break
    }
  }

  const websocket = useWebSocket(`wss://backend.chat.restream.io/ws/embed?token=${restreamToken}`, {
    onConnected: socket => {
      console.log("Restream websocket connected", restreamToken)
    },
    onMessage: (socket, event) => {
      try {
        handleMessage(event)
      } catch (error) {
        console.error(error)
      }
    },
    onDisconnected: () => console.log("Restream Websocket disconnected", restreamToken),
    autoReconnect: { delay: 5000 },
    autoClose: false,
  })

  tryOnScopeDispose(() => {
    console.log("useKickChat tryOnScopeDispose", restreamToken)
    websocket.close()
  })
}
