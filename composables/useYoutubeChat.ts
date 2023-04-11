import { useScriptTag } from "@vueuse/core"
// import { google } from "googleapis"
import { ChatMessage } from "~/types/common"

const chatMessages = ref<ChatMessage[]>([])

async function fetchLiveChatIdFromVideo(videoId: string): Promise<string> {
  console.log("YOUTUBE fetching live chat ID from video:", videoId)
  // Fetch live chat ID from live broadcast
  const liveBroadcastResponse = await gapi.client.youtube.videos.list({
    part: "liveStreamingDetails",
    id: videoId,
  })

  const liveChatId = liveBroadcastResponse.result.items[0].liveStreamingDetails.activeLiveChatId
  console.log("YOUTUBE live Chat ID:", liveChatId)
  return liveChatId
}

async function fetchChatMessages(liveChatId: string, nextPageToken?: string) {
  console.log("YOUTUBE fetching chat messages")
  const response = await gapi.client.youtube.liveChatMessages.list({
    liveChatId,
    part: "snippet,authorDetails",
    fields: "items(id,snippet(displayMessage),authorDetails(displayName)),nextPageToken,pollingIntervalMillis",
    maxResults: 50, // Adjust this value as needed, max is 2000
    pageToken: nextPageToken,
  })
  console.log("YOUTUBE fetched chat messages", response.result.items)
  for (const item of response.result.items) {
    // console.log("YOUTUBE adding message", item.authorDetails.displayName, item.snippet.displayMessage)
    chatMessages.value = [
      ...chatMessages.value.slice(-49),
      {
        id: item.id,
        created_at: Date.now(),
        platform: "youtube",
        userName: item.authorDetails.displayName,
        messageParts: [
          {
            type: "text",
            value: item.snippet.displayMessage,
          }
        ],
        isDeleted: false,
      }
    ]
  }
  return {
    nextPageToken: response.result.nextPageToken,
    pollingInterval: response.result.pollingIntervalMillis,
  }
}

async function streamChatMessages(liveChatId: string, nextPageToken?: string) {
  try {
    const {
      nextPageToken: newNextPageToken,
      pollingInterval
    } = await fetchChatMessages(liveChatId, nextPageToken)

    // Continue streaming chat messages after the specified polling interval
    setTimeout(() => {
      streamChatMessages(liveChatId, newNextPageToken)
    }, Math.max(pollingInterval, 9500))
  } catch (err) {
    console.error("Error streaming chat messages:", err)
    setTimeout(() => {
      streamChatMessages(liveChatId, nextPageToken)
    }, 10000)
  }
}

export default function(videoId: string, apiKey: string) {
  if (!videoId || !apiKey) {
    return chatMessages
  }
  useScriptTag(
    "https://apis.google.com/js/api.js",
    () => {
      console.log("script loaded")

      const gapi = window.gapi as any

      gapi.load("client", async () => {
        console.log("Google API client loaded.")

        // Initialize the client with your API key and the YouTube API
        await gapi.client.init({
          apiKey,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"],
        })
          .then(async () => {
            console.log("YouTube API loaded.")
            const liveChatId = await fetchLiveChatIdFromVideo(videoId)
            streamChatMessages(liveChatId)
          })
      })
    }
  )

  return chatMessages
}
