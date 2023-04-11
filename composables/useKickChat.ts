import { useWebSocket } from "@vueuse/core"
import { ChatMessage, MessagePart } from "~/types/common"

const splitKickMessage = (msg: string) => {
  const emoteRegex = /(\[emote:\d+:[^\]]*\])/
  const emojiRegex = /(\[emoji:\w+\])/
  const combinedRegex = new RegExp(`${emoteRegex.source}|${emojiRegex.source}`)

  const parts = msg.split(combinedRegex).filter(part => part !== "" && part !== undefined)
  // console.log(msg)
  // console.log(parts)

  return parts.map<MessagePart>(el => {
    if (emoteRegex.test(el)) {
      const emote = el.match(/:(\w+):/)![1]
      return ({
        type: "image",
        value: `https://files.kick.com/emotes/${emote}/fullsize`
      })
    } else if (emojiRegex.test(el)) {
      const emoji = el.match(/:(\w+)]/)![1]
      return ({
        type: "image",
        value: `https://dbxmjjzl5pc1g.cloudfront.net/552e5545-930e-4c6d-a620-8531ce9debdf/images/emojis/${emoji}.png`
      })
    } else {
      return ({ type: "text", value: el })
    }
  })
}

export default function(channelName: string): Ref<ChatMessage[]> {
  const chatMessages = ref<ChatMessage[]>([])

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
        channel: `chatrooms.${parsedApiResponse.chatroom.id}`
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
      case "App\\Events\\ChatMessageSentEvent":
        chatMessages.value = [
          ...chatMessages.value.slice(-49),
          {
            id: parsedData.message.id,
            created_at: Date.now(),
            platform: "kick",
            userName: parsedData.user.username,
            messageParts: splitKickMessage(parsedData.message.message),
            isDeleted: false,
          }
        ]
        break
      case "App\\Events\\ChatMessageDeletedEvent":
        for (const message of chatMessages.value) {
          if (message.id === parsedData.deletedMessage.id) {
            message.isDeleted = true
          }
        }
        break
      case "pusher:ping":
        socket.send(JSON.stringify({
          event: "pusher:pong",
          data: {}
        }))
        break
    }
  }

  useWebSocket("wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.4.0&flash=false", {
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

  return chatMessages
}
