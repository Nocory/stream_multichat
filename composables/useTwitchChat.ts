import * as tmi from "tmi.js"
import { ChatMessage, MessagePart } from "~/types/common"

/**
 * Splits a Twitch message into text and emote parts.
 *
 * @param message - The Twitch chat message string.
 * @param emotes - An object containing emote information from Twitch chat.
 * @returns An array of message parts.
 */
const splitTwitchMessage = (message: string, emotes: tmi.CommonUserstate["emotes"]) => {
  let lastIndex = 0
  const messageParts: (MessagePart|string)[] = []

  // Create an array of all emote positions with their respective IDs
  const emotePositionsArray: {
    start: number;
    end: number;
    emoteId: string;
  }[] = []

  for (const emoteId in emotes) {
    const emotePositions = emotes[emoteId]
    for (const position of emotePositions) {
      const [start, end] = position.split("-").map(Number)
      emotePositionsArray.push({ start, end, emoteId })
    }
  }

  // Sort the emote positions array by start position
  emotePositionsArray.sort((a, b) => a.start - b.start)

  // Process the sorted emote positions
  for (const { start, end, emoteId } of emotePositionsArray) {
    messageParts.push(message.slice(lastIndex, start))
    lastIndex = end + 1
    messageParts.push({
      type: "image",
      value: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/1.0`,
    })
  }
  messageParts.push(message.slice(lastIndex))

  // TODO: handle betterttv emotes by splitting the message on spaces and then check if the part is a betterttv emote
  return messageParts.map<MessagePart>(part => {
    if (typeof part === "string") {
      return {
        type: "text",
        value: part
      }
    } else {
      return part
    }
  })
}

export default function(channelName: string) {
  const chatMessages = ref<ChatMessage[]>([])

  if (!channelName) {
    console.log("No twitch channel name provided.")
    return chatMessages
  }

  const client = new tmi.Client({
    options: { debug: true },
    connection: {
      secure: true,
      reconnect: true
    },
    identity: { username: `justinfan${Math.floor(Math.random() * 10000000)}` },
    channels: [channelName],
  })

  client.connect().catch(console.error)

  client.on("disconnected", reason => {
    console.log("TWITCH DISCONNECTED", reason)
  })

  client.on("message", (channel, tags, message, self) => {
    //
  })

  client.on("chat", (channel, userstate, message, self) => {
    // console.log("TWITCH CHAT", userstate.username, message)
    chatMessages.value = [
      ...chatMessages.value.slice(-49),
      {
        id: userstate.id ?? "unknown",
        created_at: Date.now(),
        platform: "twitch",
        userName: userstate.username ?? "unknown",
        messageParts: splitTwitchMessage(message, userstate.emotes ?? {}),
        isDeleted: false,
      }
    ]
  })

  client.on("cheer", (channel, userstate, message) => {
    // console.log("TWITCH CHEER", userstate.username, message)
    chatMessages.value = [
      ...chatMessages.value.slice(-49),
      {
        id: userstate.id ?? "unknown",
        created_at: Date.now(),
        platform: "twitch",
        userName: userstate.username ?? "unknown",
        messageParts: splitTwitchMessage(message, userstate.emotes ?? {}),
        isDeleted: false,
      }
    ]
  })

  client.on("messagedeleted", (channel, username, deletedMessage, userstate) => {
    for (const message of chatMessages.value) {
      if (message.id === userstate["target-msg-id"]) {
        message.isDeleted = true
      }
    }
  })

  client.on("action", (channel, userstate, message, self) => {
    //
  })

  client.on("clearchat", channel => {
    chatMessages.value = []
  })

  client.on("notice", (channel, msgid, message) => {
    //
  })

  client.on("roomstate", (channel, state) => {
    //
  })

  client.on("timeout", (channel, username, reason, duration, userState) => {
    for (const message of chatMessages.value) {
      if (message.userName === username) {
        message.isDeleted = true
      }
    }
  })

  client.on("ban", (channel, username, reason, userState) => {
    for (const message of chatMessages.value) {
      if (message.userName === username) {
        message.isDeleted = true
      }
    }
  })

  client.on("raw_message", (message, tags) => {
    //
  })

  onScopeDispose(() => {
    client.disconnect()
  })

  return chatMessages
}
