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

export interface IntelligentSearchAI {
  source: "gemini" | "fallback";
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
