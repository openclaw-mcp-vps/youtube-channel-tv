export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  duration: string;
  channelId: string;
  channelTitle: string;
  url: string;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  uploadsPlaylistId: string;
  videos: YouTubeVideo[];
}

export interface UserLineup {
  email: string;
  channels: YouTubeChannel[];
  updatedAt: string;
}

export interface PurchaseRecord {
  email: string;
  stripeSessionId: string;
  purchasedAt: string;
}
