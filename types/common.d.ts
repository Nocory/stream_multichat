export type MessagePart = {
  type: "text" | "image"
  value: string
}

export type ChatMessage = {
  id: string
  created_at: number
  platform: string
  userName: string
  messageParts: MessagePart[]
  isDeleted: boolean
}
