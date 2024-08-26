import { EffectScope } from "nuxt/dist/app/compat/capi"
import { reactive, watch, effectScope } from "vue"
import useKickChat from "~/composables/platforms/useKickChat"
import useRestream from "~/composables/platforms/useRestream"
import useTwitchChat from "~/composables/platforms/useTwitchChat"
import {
  ChannelSubscription,
  ChatMessage,
  MessageRemovalOptions,
  MessageToWorker,
  StreamingPlatform,
} from "~/types/common"

interface SharedWorkerGlobalScope {
  onconnect: (event: MessageEvent) => void;
}
const _self: SharedWorkerGlobalScope = self as any

const workerId = Math.floor(Math.random() * 1000000)
console.log(`WORKER(${workerId}) started`)

const allPorts = reactive(new Set<MessagePort>())

const portSubscriptions : Record<StreamingPlatform, Record<string, {
  ports: MessagePort[],
  scope: EffectScope | undefined
}>> = reactive({
  twitch: {},
  kick: {},
  youtube: {},
})

type BroadCastToPortsArg =
| {
  ports: MessagePort[]
  type: "chatMessage"
  message: ChatMessage
}
| {
  ports: MessagePort[],
  type: "removedMessage",
  message: MessageRemovalOptions,
}

const broadcastToPorts = ({ ports, type, message }:BroadCastToPortsArg) => {
  // if (type === "chatMessage") {
  //   if (message.messageParts[0].type === "text" && message.messageParts[0].value === "!closeAllPorts") {
  //     console.log(`WORKER(${workerId}) closing all ports!`)
  //     allPorts.forEach(port => port.close())
  //     return
  //   }
  // }
  ports.forEach(port => {
    port.postMessage({
      type,
      message,
    })
  })
}

// setInterval(() => {
//   broadcastToPorts(Array.from(allPorts), "chatMessage", {
//     id: (Math.random() * 9999999).toString(),
//     createdAt: Date.now(),
//     platform: "twitch",
//     channel: "test",
//     userName: "test",
//     messageParts: [
//       {
//         type: "text",
//         value: `worker ${workerId}, ports: ${allPorts.size}`,
//       }
//     ],
//     isDeleted: false,
//     isModerator: false,
//     isHost: false,
//   })
// }, 1000)

watch(allPorts, newPorts => {
  // logger.debug("= watch allPorts = allPorts changed")
  // lmao
  for (const [platform, channels] of Object.entries(portSubscriptions)) {
    for (const channel in channels) {
      // logger.debug(`= watch allPorts = filtering ${channels[channel].ports.length} old ports from ${newPorts.size} new ports`)
      channels[channel].ports = channels[channel].ports.filter(port => newPorts.has(port))
      if (channels[channel].ports.length === 0 && channels[channel].scope !== undefined) {
        channels[channel].scope?.stop()
        delete channels[channel].scope
      }
    }
  }
}, { deep: true })

const handleSubscription = (port: MessagePort, subscriptions: ChannelSubscription[]) => {
  for (const { platform, channel } of subscriptions) {
    if (!portSubscriptions[platform][channel]) {
      portSubscriptions[platform][channel] = {
        ports: [],
        scope: undefined,
      }
    }
    portSubscriptions[platform][channel].ports.push(port)
    if (portSubscriptions[platform][channel].scope === undefined) {
      console.log(`WORKER(${workerId}) handleSubscription = Creating scope for ${platform}/${channel}`)
      const scope = effectScope()
      portSubscriptions[platform][channel].scope = scope
      scope.run(() => {
        console.log(`WORKER(${workerId}) scope.run`, platform, channel)
        switch (platform) {
          case "twitch":
            useTwitchChat(channel, {
              onAdd: message => {
                broadcastToPorts({
                  ports: portSubscriptions[platform][channel].ports,
                  type: "chatMessage",
                  message,
                })
              },
              onRemove: removalOptions => {
                broadcastToPorts({
                  ports: portSubscriptions[platform][channel].ports,
                  type: "removedMessage",
                  message: removalOptions,
                })
              }
            })
            break
          case "kick":
            useKickChat(channel, {
              onAdd: message => {
                broadcastToPorts({
                  ports: portSubscriptions[platform][channel].ports,
                  type: "chatMessage",
                  message,
                })
              },
              onRemove: removalOptions => {
                broadcastToPorts({
                  ports: portSubscriptions[platform][channel].ports,
                  type: "removedMessage",
                  message: removalOptions,
                })
              }
            })
            break
          case "youtube":
            useRestream(channel, {
              onAdd: message => {
                broadcastToPorts({
                  ports: portSubscriptions[platform][channel].ports,
                  type: "chatMessage",
                  message,
                })
              },
              onRemove: removalOptions => {
                broadcastToPorts({
                  ports: portSubscriptions[platform][channel].ports,
                  type: "removedMessage",
                  message: removalOptions,
                })
              }
            })
            break
        }
      })
    }
  }
}

let clientCounter = 1

_self.onconnect = function(e) {
  const clientId = (clientCounter++).toString()

  const port = e.ports[0]
  allPorts.add(port)

  console.log(`WORKER(${workerId}) opened port to CLIENT(${clientId}) [active: ${allPorts.size}]`)

  const removePort = () => {
    clearInterval(pingIntervalId)
    clearTimeout(pongTimeoutId)
    allPorts.delete(port)
    port.close()
    console.log(`WORKER(${workerId}) closed port of CLIENT(${clientId}) [active: ${allPorts.size}]`)
  }

  let pingIntervalId: ReturnType<typeof setTimeout> | undefined = undefined
  let pongTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined

  const restartPongTimeout = () => {
    clearTimeout(pongTimeoutId)
    pongTimeoutId = setTimeout(() => {
      console.log(`WORKER(${workerId}) did not receive "pong" from CLIENT(${clientId}). Closing port.`)
      removePort()
    }, 7000)
  }

  port.onmessage = event => {
    if (event.data) {
      const eventData = event.data as MessageToWorker
      switch (eventData.type) {
        case "pong":
          // console.log(`Received client ${clientId} pong`)
          restartPongTimeout()
          break
        case "subscribe":
          console.log(`WORKER(${workerId}) received subscription request from CLIENT(${clientId}) for ${eventData.subscriptions.length} channels`)
          handleSubscription(port, eventData.subscriptions)
          // logger.debug(`= subscribe = client ${clientId} subscribed to ${eventData.subscriptions.length} channels`)
          break
        case "unsubscribe": {
          // const { subscriptions } = eventData
          break
        }
        case "close":
          console.log(`WORKER(${workerId}) closing port by CLIENT(${clientId}) request`)
          removePort()
          break
        default:
          console.warn(`WORKER(${workerId}) received unknown message:`, eventData)
      }
    }
  }

  pingIntervalId = setInterval(() => {
    // console.log(`Sending ping to client ${clientId}`)
    port.postMessage({ type: "ping" })
  }, 2000)

  restartPongTimeout()
}
