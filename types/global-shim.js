if (typeof global === "undefined" && typeof self !== "undefined") {
  self.global = self
  self.global.WebSocket = self.WebSocket
}
