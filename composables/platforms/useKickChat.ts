import { tryOnScopeDispose, useWebSocket } from "@vueuse/core"
import { ChatMessage, MessagePart, MessageRemovalOptions } from "~/types/common"

const splitKickMessage = (msg: string) => {
  const emoteRegex = /(\[emote:\d+:[^\]]*\])/

  const parts = msg.split(emoteRegex).filter(part => part !== "" && part !== undefined)
  // console.log(msg)
  // console.log(parts)

  return parts.map<MessagePart>(el => {
    if (emoteRegex.test(el)) {
      const emote = el.match(/:(\w+):/)![1]
      return ({
        type: "image",
        value: `https://files.kick.com/emotes/${emote}/fullsize`
      })
    } else {
      return ({ type: "text", value: el })
    }
  })
}

export default function(
  channelName: string,
  callbacks?: {
    onAdd?: (message: ChatMessage) => void,
    onRemove?: (removalOptions: MessageRemovalOptions) => void,
  }
) {
  console.log(`useKickChat(${channelName}) connecting to channel`)

  const handleConnected = async (socket: WebSocket) => {
    const apiResponse = await fetch(`https://kick.com/api/v2/channels/${channelName}/`)
    if (!apiResponse.ok) {
      throw new Error("Fetching of Kick channel information failed. Response was not OK")
    }
    const parsedApiResponse = await apiResponse.json()

    socket.send(JSON.stringify({
      event: "pusher:subscribe",
      data: {
        auth: "",
        channel: `channel.${parsedApiResponse.id}`
      }
    }))
    socket.send(JSON.stringify({
      event: "pusher:subscribe",
      data: {
        auth: "",
        channel: `chatrooms.${parsedApiResponse.chatroom.id}.v2`
      }
    }))
  }

  const handleMessage = (socket: WebSocket, event: MessageEvent<any>) => {
    const parsedEvent = JSON.parse(event.data)
    const parsedData = JSON.parse(parsedEvent.data)
    // console.log("=====")
    // console.log(parsedEvent)
    // console.log(parsedData)
    switch (parsedEvent.event) {
      case "App\\Events\\ChatMessageEvent":
        if (parsedData.type === "message" || parsedData.type === "reply") {
          // console.log("KICK CHAT", parsedData.sender.username, parsedData.content)
          const badgeTypes = parsedData.sender.identity?.badges?.map((badge: any) => badge.type)
          callbacks?.onAdd?.({
            id: parsedData.id,
            createdAt: Date.now(),
            platform: "kick",
            channel: channelName,
            userName: parsedData.sender.username,
            messageParts: splitKickMessage(parsedData.content),
            isDeleted: false,
            isHost: badgeTypes?.includes("broadcaster") ?? false,
            isModerator: badgeTypes?.includes("moderator") ?? false,
          })
        }
        break
      case "App\\Events\\MessageDeletedEvent":
        callbacks?.onRemove?.({
          type: "id",
          id: parsedData.message.id,
        })
        break
      case "pusher:ping":
        socket.send(JSON.stringify({
          event: "pusher:pong",
          data: {}
        }))
        break
    }
  }

  const websocket = useWebSocket("wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=7.6.0&flash=false", {
    onConnected: socket => {
      try {
        handleConnected(socket)
      } catch (error) {
        console.error(error)
        socket.close()
      }
    },
    onMessage: (socket, event) => {
      try {
        handleMessage(socket, event)
      } catch (error) {
        console.error({
          error,
          event,
        })
      }
    },
    onDisconnected: () => console.log(`useKickChat(${channelName}) websocket disconnected`),
    autoReconnect: { delay: 5000 },
    autoClose: false,
  })

  tryOnScopeDispose(() => {
    console.log(`useKickChat(${channelName}) tryOnScopeDispose`)
    websocket.close()
  })
}
