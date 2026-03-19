import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import type { Comment } from "../types";

export const PostCommentsPage = () => {
  const { postId } = useParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");

  const fetchComments = async () => {
    if (!postId) return;
    const response = await api.get<Comment[]>(`/posts/${postId}/comments`);
    setComments(response.data);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!postId) return;

    await api.post(`/posts/${postId}/comments`, { text });
    setText("");
    await fetchComments();
  };

  return (
    <section className="layout">
      <form className="card form" onSubmit={onCreate}>
        <h1>Comments</h1>
        <input
          placeholder="Write your comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <button type="submit">Add comment</button>
      </form>

      <div className="feed-grid">
        {comments.map((comment) => (
          <article key={comment._id} className="card post-card">
            <strong>{comment.author.username}</strong>
            <p>{comment.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
