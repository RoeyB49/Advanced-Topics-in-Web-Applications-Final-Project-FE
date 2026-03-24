export type Provider = "local" | "google" | "facebook";

export interface User {
  _id: string;
  username: string;
  email: string;
  profileImage?: string;
  provider?: Provider;
}

export interface Post {
  _id: string;
  text: string;
  imageUrl?: string;
  author: User;
  likes: string[];
  likesCount?: number;
  commentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  text: string;
  author: Pick<User, "_id" | "username" | "profileImage">;
  post: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ChatHistoryItem {
  role: "user" | "assistant";
  text: string;
}

export interface AnimeRecommendation {
  title: string;
  reason: string;
  genres: string[];
  mood: string;
  confidence: number;
}

export interface RecommendationChatResponse {
  source: "gemini" | "fallback";
  reply: string;
  recommendations: AnimeRecommendation[];
  extractedPreferences: string[];
  basedOn: {
    watchedCount: number;
    preferenceCount: number;
    userSignalCount: number;
  };
}
