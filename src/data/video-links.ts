export type VideoLink = {
  title: string
  href: string
  type: "short" | "long" | "stream"
  platform: "youtube" | "twitch"
}

// Add entries as you publish. Homepage reads this list directly.
export const videoLinks: VideoLink[] = []
