export type Provider = "local" | "google" | "facebook";

export interface User {
  _id: string;
  username: string;
  email: string;
  profileImage?: string;
  provider?: Provider;
}

export interface LikeUser {
  _id: string;
  username?: string;
  profileImage?: string;
}

export interface Post {
  _id: string;
  text: string;
  imageUrl?: string;
  tags?: string[];
  author: User;
  likes: Array<string | LikeUser>;
  likedByUsers?: LikeUser[];
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

export interface IntelligentSearchAI {
  source: "gemini" | "groq" | "fallback";
  intent: "recommendation" | "comparison" | "analysis" | "general-search";
  sentimentHint: "positive" | "negative" | "mixed" | "neutral";
  detectedAnimeTitles: string[];
  detectedGenres: string[];
  keywords: string[];
}

export interface IntelligentSearchResponse {
  query: string;
  ai: IntelligentSearchAI;
  posts: Post[];
}
