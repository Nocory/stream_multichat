import { useUrlSearchParams } from "@vueuse/core"
import { ChannelSubscription } from "~/types/common"

const getChannelsFromUrl = () => {
  const params = useUrlSearchParams("history")

  const routeParams = {
    // platforms
    kick: params.kick as string,
    twitch: params.twitch as string,
    restreamToken: (params["restream-token"] || params.restreamToken) as string,
    xBroadcastId: params["x-broadcast-id"] as string,
  }

  const subscriptions: ChannelSubscription[] = []

  routeParams.twitch?.split(" ").forEach(channel => {
    subscriptions.push({
      platform: "twitch",
      channel,
    })
  })

  routeParams.kick?.split(" ").forEach(channel => {
    subscriptions.push({
      platform: "kick",
      channel,
    })
  })

  if (routeParams.restreamToken) {
    subscriptions.push({
      platform: "youtube",
      channel: routeParams.restreamToken,
    })
  }

  if (routeParams.xBroadcastId) {
    subscriptions.push({
      platform: "x",
      channel: routeParams.xBroadcastId,
    })
  }

  return subscriptions
}

export default getChannelsFromUrl
