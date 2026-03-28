import { Link } from "react-router-dom";
import { api, resolveApiAssetUrl } from "../services/api";
import type { Post } from "../types";
import {
  Button,
  Card,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  HeartOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

type Props = {
  post: Post;
  onLikeChanged: (post: Post) => void;
  onDeleted?: (postId: string) => void;
};

export const PostCard = ({ post, onLikeChanged, onDeleted }: Props) => {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const authorName = post.author?.username ?? "Unknown user";
  const likesCount = post.likesCount ?? post.likes?.length ?? 0;
  const isOwner = user?._id === post.author?._id;
  const imageSrc = resolveApiAssetUrl(post.imageUrl);

  const toggleLike = async () => {
    const response = await api.post<Post>(`/posts/${post._id}/like`);
    onLikeChanged(response.data);
  };

  const deletePost = async () => {
    setDeleting(true);
    try {
      await api.delete(`/posts/${post._id}`);
      onDeleted?.(post._id);
      message.success("Post deleted");
    } finally {
      setDeleting(false);
    }
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
      <Space
        className="post-card-actions"
        style={{ marginTop: 12, display: "flex", flexWrap: "wrap" }}
      >
        <Button icon={<HeartOutlined />} onClick={toggleLike}>
          Like ({likesCount})
        </Button>
        <Link to={`/posts/${post._id}/comments`}>
          <Button icon={<MessageOutlined />}>
            Comments ({post.commentsCount ?? 0})
          </Button>
        </Link>
        {isOwner ? (
          <>
            <Link to={`/posts/${post._id}/edit`}>
              <Button icon={<EditOutlined />}>Edit</Button>
            </Link>
            <Popconfirm
              title="Delete post"
              description="This action cannot be undone."
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: deleting }}
              onConfirm={deletePost}
            >
              <Button danger icon={<DeleteOutlined />} loading={deleting}>
                Delete
              </Button>
            </Popconfirm>
          </>
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
