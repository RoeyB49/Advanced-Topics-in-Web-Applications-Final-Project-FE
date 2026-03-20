import { Link } from "react-router-dom";
import { api } from "../services/api";
import type { Post } from "../types";
import { Button, Card, Space, Tag, Typography } from "antd";
import {
  EditOutlined,
  HeartOutlined,
  MessageOutlined,
} from "@ant-design/icons";

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
    <Card
      className="post-card"
      title={
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{post.author.username}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {new Date(post.createdAt).toLocaleString()}
          </Typography.Text>
        </Space>
      }
      extra={<Tag color="blue">Anime Review</Tag>}
    >
      <Typography.Paragraph
        style={{ whiteSpace: "pre-wrap", marginBottom: 12 }}
      >
        {post.text}
      </Typography.Paragraph>
      {post.imageUrl ? (
        <img
          src={`http://localhost:3000${post.imageUrl}`}
          alt="post"
          className="post-image"
        />
      ) : null}
      <Space style={{ marginTop: 12, display: "flex", flexWrap: "wrap" }}>
        <Button icon={<HeartOutlined />} onClick={toggleLike}>
          Like ({post.likesCount ?? post.likes.length})
        </Button>
        <Link to={`/posts/${post._id}/comments`}>
          <Button icon={<MessageOutlined />}>
            Comments ({post.commentsCount ?? 0})
          </Button>
        </Link>
        <Link to={`/posts/${post._id}/edit`}>
          <Button icon={<EditOutlined />}>Edit</Button>
        </Link>
      </Space>
    </Card>
  );
};
