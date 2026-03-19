import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import type { Post } from "../types";

export const PostEditorPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (!postId) return;
    api.get<Post>(`/posts/${postId}`).then((response) => {
      setText(response.data.text);
    });
  }, [postId]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("text", text);
    if (image) {
      formData.append("image", image);
    }

    if (postId) {
      await api.put(`/posts/${postId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    navigate("/");
  };

  return (
    <section className="center-page">
      <form className="card form" onSubmit={onSubmit}>
        <h1>{postId ? "Edit Post" : "Create Post"}</h1>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
        />
        <button type="submit">{postId ? "Update" : "Publish"}</button>
      </form>
    </section>
  );
};
