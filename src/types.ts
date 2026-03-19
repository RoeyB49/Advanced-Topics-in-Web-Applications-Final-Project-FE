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
