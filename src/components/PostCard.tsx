import { Link } from "react-router-dom";
import { api } from "../services/api";
import type { Post } from "../types";

type Props = {
  post: Post;
  onLikeChanged: (post: Post) => void;
};

export const PostCard = ({ post, onLikeChanged }: Props) => {
  const toggleLike = async () => {
    const response = await api.post<Post>(`/posts/${post._id}/like`);
    onLikeChanged(response.data);
  };

  return (
    <article className="card post-card">
      <div className="post-header">
        <strong>{post.author.username}</strong>
        <span>{new Date(post.createdAt).toLocaleString()}</span>
      </div>
      <p>{post.text}</p>
      {post.imageUrl ? (
        <img
          src={`http://localhost:3001${post.imageUrl}`}
          alt="post"
          className="post-image"
        />
      ) : null}
      <div className="post-actions">
        <button onClick={toggleLike}>
          Like ({post.likesCount ?? post.likes.length})
        </button>
        <Link to={`/posts/${post._id}/comments`}>
          Comments ({post.commentsCount ?? 0})
        </Link>
        <Link to={`/posts/${post._id}/edit`}>Edit</Link>
      </div>
    </article>
  );
};
