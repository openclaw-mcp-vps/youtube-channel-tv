export type TVChannel = {
  channelId: string;
  title: string;
  thumbnail: string;
  description?: string;
};

export type TVVideo = {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
  description?: string;
};

export type StripeWebhookEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: Record<string, unknown>;
  };
};
