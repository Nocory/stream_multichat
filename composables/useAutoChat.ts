import { useIntervalFn } from "@vueuse/core"
import { CombinedChat } from "./useCombinedChat"

export default function(combinedChat: CombinedChat) {
  let autoChatCounter = 0

  useIntervalFn(
    () => {
      combinedChat.add({
        id: `autoChat_${autoChatCounter}`,
        createdAt: Date.now(),
        platform: ["kick", "twitch", "youtube"][autoChatCounter % 3],
        userName: "User",
        messageParts: [
          {
            type: "text",
            value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam fermentum est nec purus efficitur condimentum."
          },
          { type: "image", value: "https://static-cdn.jtvnw.net/emoticons/v1/25/1.0" },
          { type: "image", value: "https://static-cdn.jtvnw.net/emoticons/v2/12/default/dark/1.0" },
          {
            type: "text",
            value: "Vestibulum feugiat, sem quis ultrices scelerisque, sem sem mattis ante, vel luctus nunc mauris quis lectus. Nunc sed mollis odio."
          }
        ],
        isDeleted: false,
      })
      autoChatCounter += 1
    },
    5000,
    { immediateCallback: true }
  )
}
