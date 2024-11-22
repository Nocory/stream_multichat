import { tryOnScopeDispose, useWebSocket } from "@vueuse/core"
import { ChatMessage, MessageRemovalOptions } from "~/types/common"

export default function(
  broadcastId: string,
  callbacks?: {
    onAdd?: (message: ChatMessage) => void,
    onRemove?: (removalOptions: MessageRemovalOptions) => void,
  }
) {
  console.log(`useXChat(${broadcastId}) connecting to channel`)

  const handleConnected = async (socket: WebSocket) => {
    const apiResponse = await fetch(`https://corsproxy.io/?https://api.x.com/1.1/broadcasts/show.json?ids=${broadcastId}&include_events=true`)
    if (!apiResponse.ok) {
      console.log(apiResponse)
      throw new Error("Fetching of X channel information failed. Response was not OK")
    }
    const parsedApiResponse = await apiResponse.json()
    const mediaKey = parsedApiResponse.broadcasts[broadcastId].media_key

    console.log(`useXChat parsedApiResponse ${parsedApiResponse}`)
    console.log(`useXChat mediaKey ${mediaKey}`)

    const apiResponse2 = await fetch(`https://corsproxy.io/?https://api.x.com/1.1/live_video_stream/status/${mediaKey}.json`)
    const parsedApiResponse2 = await apiResponse2.json()
    const chatToken = parsedApiResponse2.chatToken

    console.log(`useXChat apiResponse2 ${apiResponse2.status}`)
    console.log(`useXChat chatToken ${chatToken}`)

    const apiResponse3 = await fetch("https://corsproxy.io/?https://proxsee.pscp.tv/api/v2/accessChatPublic", {
      method: "POST",
      body: JSON.stringify({ chat_token: chatToken })
    })
    const parsedApiResponse3 = await apiResponse3.json()
    const accessToken = parsedApiResponse3.access_token

    console.log(`useXChat parsedApiResponse3 ${apiResponse3.ok} ${apiResponse3.status}`)
    console.log(`useXChat accessToken ${accessToken}`)

    socket.send(JSON.stringify({ payload: `{"access_token":"${accessToken}"}`, kind: 3 }))
    await new Promise(resolve => setTimeout(resolve, 500))
    socket.send(JSON.stringify({ payload: `{"body":"{\\"room\\":\\"${broadcastId}\\"}","kind":1}`, kind: 2 }))

    console.log(`useXChat(${broadcastId}) handleConnected DONE`)
  }

  const handleMessage = (socket: WebSocket, event: MessageEvent<any>) => {
    const parsedEvent = JSON.parse(event.data)

    if (parsedEvent.kind === 1) {
      const payload = JSON.parse(parsedEvent.payload)
      const body = JSON.parse(payload.body)

      callbacks?.onAdd?.({
        id: body.uuid,
        createdAt: Date.now(),
        platform: "x",
        channel: broadcastId,
        userName: body.displayName,
        messageParts: [{ type: "text", value: body.body }],
        isDeleted: false,
        isHost: false,
        isModerator: false,
      })
    }
  }

  console.log(`useXChat(${broadcastId}) connecting to websocket`)
  const websocket = useWebSocket("wss://prod-chatman-ancillary-eu-central-1.pscp.tv/chatapi/v1/chatnow", {
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
    onDisconnected: (ws, event) => console.warn(`useXChat(${broadcastId}) websocket disconnected ${event.code}`),
    autoReconnect: { delay: 5000 },
    autoClose: false,
  })

  tryOnScopeDispose(() => {
    console.log(`useXChat(${broadcastId}) tryOnScopeDispose`)
    websocket.close()
  })
}
