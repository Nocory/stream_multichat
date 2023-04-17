import { useWebSocket } from "@vueuse/core"
import { CombinedChat } from "./useCombinedChat"
import { ChatMessage } from "~/types/common"

export default function(restreamToken: string, combinedChat: CombinedChat) {
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
          combinedChat.add({
            id: parsedEvent.payload.eventIdentifier,
            createdAt: Date.now(),
            platform: "youtube",
            userName: parsedEvent?.payload?.eventPayload?.author.displayName ?? "unknown",
            messageParts: [
              {
                type: "text",
                value: parsedEvent?.payload?.eventPayload?.text ?? "unknown"
              }
            ],
            isDeleted: false,
          })
        }
        break
      case "heartbeat":
        // console.log("RESTREAM heartbeat")
        break
    }
  }

  useWebSocket(`wss://backend.chat.restream.io/ws/embed?token=${restreamToken}`, {
    onConnected: socket => {
      console.log("Restream websocket connected")
    },
    onMessage: (socket, event) => {
      try {
        handleMessage(event)
      } catch (error) {
        console.error(error)
      }
    },
    onDisconnected: () => console.log("Websocket disconnected"),
    autoReconnect: { delay: 5000 },
  })
}
