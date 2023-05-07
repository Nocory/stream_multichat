import "@/types/global-shim.js"
import * as tmi from "tmi.js"
import { tryOnScopeDispose } from "@vueuse/core"
import { ChatMessage, MessagePart, MessageRemovalOptions } from "~/types/common"

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
  return messageParts
    .map<MessagePart>(part => typeof part === "string" ? { type: "text", value: part } : part)
    .filter(part => part.value !== " ")
}

export default function(
  channelName: string,
  callbacks?: {
    onAdd?: (message: ChatMessage) => void,
    onRemove?: (removalOptions: MessageRemovalOptions) => void,
  }
) {
  console.log("useTwitchChat init", channelName)

  const client = new tmi.Client({
    options: { debug: false },
    connection: {
      secure: true,
      reconnect: true,
    },
    identity: { username: `justinfan${Math.floor(Math.random() * 10000000)}` },
    channels: [channelName],
  })

  client.connect().catch(console.error)

  client.on("disconnected", reason => {
    console.log("Twitch Websocket disconnected. reason:", reason, channelName)
  })

  client.on("message", (channel, tags, message, self) => {
    //
  })

  client.on("chat", (channel, userstate, message, self) => {
    // console.log("TWITCH CHAT", userstate, message)
    callbacks?.onAdd?.({
      id: userstate.id ?? "unknown",
      createdAt: Date.now(),
      platform: "twitch",
      channel: channelName,
      userName: userstate["display-name"] ?? "unknown",
      messageParts: splitTwitchMessage(message, userstate.emotes ?? {}),
      isDeleted: false,
      isHost: userstate.badges?.broadcaster === "1",
      isModerator: userstate.badges?.moderator === "1",
    })
  })

  client.on("cheer", (channel, userstate, message) => {
    // console.log("TWITCH CHEER", userstate, message)
    callbacks?.onAdd?.({
      id: userstate.id ?? "unknown",
      createdAt: Date.now(),
      platform: "twitch",
      channel: channelName,
      userName: userstate["display-name"] ?? "unknown",
      messageParts: splitTwitchMessage(message, userstate.emotes ?? {}),
      isDeleted: false,
      isHost: false,
      isModerator: userstate.mod ?? false,
    })
  })

  client.on("messagedeleted", (channel, username, deletedMessage, userstate) => {
    callbacks?.onRemove?.({
      type: "id",
      id: userstate["target-msg-id"] as string
    })
  })

  client.on("action", (channel, userstate, message, self) => {
    //
  })

  client.on("clearchat", channel => {
    callbacks?.onRemove?.({
      type: "channel",
      platform: "twitch",
      channel: channelName,
    })
  })

  client.on("notice", (channel, msgid, message) => {
    //
  })

  client.on("roomstate", (channel, state) => {
    //
  })

  client.on("timeout", (channel, username, reason, duration, userState) => {
    callbacks?.onRemove?.({
      type: "user",
      platform: "twitch",
      channel: channelName,
      userName: username,
    })
  })

  client.on("ban", (channel, username, reason, userState) => {
    callbacks?.onRemove?.({
      type: "user",
      platform: "twitch",
      channel: channelName,
      userName: username,
    })
  })

  client.on("raw_message", (message, tags) => {
    //
  })

  // client.on("primepaidupgrade", (channel, username, userstate) => {
  //   console.log("TWITCH PRIMEPAIDUPGRADE", { channel, username, userstate })
  // })

  // client.on("raw_message", (message, tags) => {
  //   console.log("TWITCH RAW_MESSAGE", { message, tags })
  // })

  // client.on("subscribers", (channel, enabled) => {
  //   console.log("TWITCH SUBSCRIBERS", { channel, enabled })
  // })

  // client.on("subscription", (channel, username, method, message, userstate) => {
  //   console.log("TWITCH SUBSCRIPTION", { channel, username, method, message, userstate })
  // })

  // client.on("subgift", (channel, username, streakMonths, recipient, methods, userstate) => {
  //   console.log("TWITCH SUBGIFT", { channel, username, streakMonths, recipient, methods, userstate })
  // })

  // client.on("resub", (channel, username, months, message, userstate, methods) => {
  //   console.log("TWITCH RESUB", { channel, username, months, message, userstate, methods })
  // })

  // client.on("submysterygift", (channel, username, numbOfSubs, methods, userstate) => {
  //   console.log("TWITCH SUBMYSTERYGIFT", { channel, username, numbOfSubs, methods, userstate })
  // })

  // client.on("giftpaidupgrade", (channel, username, sender, userstate) => {
  //   console.log("TWITCH GIFTPAIDUPGRADE", { channel, username, sender, userstate })
  // })

  tryOnScopeDispose(() => {
    console.log("useTwitchChat tryOnScopeDispose", channelName)
    client.disconnect()
  })
}
