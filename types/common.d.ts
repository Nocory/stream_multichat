export type StreamingPlatform = "twitch" | "kick" | "youtube" | "x"

export type MessagePart = {
  type: "text" | "image"
  value: string
}

export type ChatMessage = {
  id: string
  createdAt: number
  platform: StreamingPlatform
  channel: string
  userName: string
  messageParts: MessagePart[]
  isDeleted: boolean
  isModerator: boolean
  isHost: boolean
}

export type MessageRemovalOptions = 
  | {
    type: "id"
    id: string
  }
  | {
    type: "channel"
    platform: StreamingPlatform
    channel: string
  }
  | {
    type: "user"
    platform: StreamingPlatform
    channel: string
    userName: string
  }

export type ChannelSubscription = {
  platform: StreamingPlatform,
  channel: string
}

export type MessageToWorker = 
  | {
    type: "pong"
  }
  | {
    type: "close"
  }
  | {
    type: "subscribe",
    subscriptions: ChannelSubscription[]
  }
  | {
    type: "unsubscribe",
    subscriptions: ChannelSubscription[]
  }
  | {
    type: "broadcast",
    message: string,
  }

export type MessageToClient =
  | {
    type: "ping"
  }
  | {
    type: "chatMessage",
    message: ChatMessage,
  }
  | {
    type: "initialChatMessages",
    messages: ChatMessage[],
  }
  | {
    type: "removedMessage",
    message: MessageRemovalOptions,
  }