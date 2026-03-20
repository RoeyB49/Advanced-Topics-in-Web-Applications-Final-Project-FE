import { Link } from "react-router-dom";
import { api } from "../services/api";
import type { Post } from "../types";
import { Button, Card, Space, Tag, Tooltip, Typography } from "antd";
import {
  EditOutlined,
  HeartOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";

type Props = {
  post: Post;
  onLikeChanged: (post: Post) => void;
};

export const PostCard = ({ post, onLikeChanged }: Props) => {
  const { user } = useAuth();
  const authorName = post.author?.username ?? "Unknown user";
  const likesCount = post.likesCount ?? post.likes?.length ?? 0;
  const isOwner = user?._id === post.author?._id;
  const imageSrc = post.imageUrl
    ? post.imageUrl.startsWith("http")
      ? post.imageUrl
      : `${api}${post.imageUrl}`
    : undefined;

  const toggleLike = async () => {
    const response = await api.post<Post>(`/posts/${post._id}/like`);
    onLikeChanged(response.data);
  };

  return (
    <Card
      className="post-card"
      title={
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>{authorName}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {new Date(post.createdAt).toLocaleString()}
          </Typography.Text>
        </Space>
      }
      extra={<Tag color="purple">Anime Review</Tag>}
    >
      <Typography.Paragraph
        style={{ whiteSpace: "pre-wrap", marginBottom: 12 }}
      >
        {post.text}
      </Typography.Paragraph>
      {post.imageUrl ? (
        <img src={imageSrc} alt="post" className="post-image" />
      ) : null}
      <Space style={{ marginTop: 12, display: "flex", flexWrap: "wrap" }}>
        <Button icon={<HeartOutlined />} onClick={toggleLike}>
          Like ({likesCount})
        </Button>
        <Link to={`/posts/${post._id}/comments`}>
          <Button icon={<MessageOutlined />}>
            Comments ({post.commentsCount ?? 0})
          </Button>
        </Link>
        {isOwner ? (
          <Link to={`/posts/${post._id}/edit`}>
            <Button icon={<EditOutlined />}>Edit</Button>
          </Link>
        ) : (
          <Tooltip title="You can only edit your own posts">
            <Button icon={<EditOutlined />} disabled>
              Edit
            </Button>
          </Tooltip>
        )}
      </Space>
    </Card>
  );
};
