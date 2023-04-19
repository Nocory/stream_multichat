import { useWebSocket } from "@vueuse/core"
import { CombinedChat } from "./useCombinedChat"
import { MessagePart } from "~/types/common"

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

export default function(channelName: string, combinedChat: CombinedChat) {
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
          combinedChat.add({
            id: parsedData.id,
            createdAt: Date.now(),
            platform: "kick",
            userName: parsedData.sender.username,
            messageParts: splitKickMessage(parsedData.content),
            isDeleted: false,
          })
        }
        break
      case "App\\Events\\MessageDeletedEvent":
        combinedChat.remove({ id: parsedData.message.id })
        break
      case "pusher:ping":
        socket.send(JSON.stringify({
          event: "pusher:pong",
          data: {}
        }))
        break
    }
  }

  useWebSocket("wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0&flash=false", {
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
    onDisconnected: () => console.log("Websocket disconnected"),
    autoReconnect: { delay: 5000 },
  })
}
