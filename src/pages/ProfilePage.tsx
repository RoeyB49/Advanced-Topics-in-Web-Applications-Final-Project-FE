import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { Post } from "../types";

type ProfileResponse = {
  user: {
    _id: string;
    username: string;
    email: string;
    profileImage?: string;
  };
  posts: Post[];
};

export const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [username, setUsername] = useState("");
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const response = await api.get<ProfileResponse>("/users/profile");
      setUsername(response.data.user.username);
      setMyPosts(response.data.posts);
    };
    loadProfile();
  }, []);

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?._id) return;

    const formData = new FormData();
    formData.append("username", username);
    if (image) {
      formData.append("image", image);
    }

    await api.put(`/users/${user._id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    await refreshProfile();
  };

  return (
    <section className="layout">
      <form className="card form" onSubmit={onSave}>
        <h1>My Profile</h1>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        <button type="submit">Save profile</button>
      </form>

      <section>
        <h2>My Posts</h2>
        <div className="feed-grid">
          {myPosts.map((post) => (
            <article key={post._id} className="card post-card">
              <p>{post.text}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
};
