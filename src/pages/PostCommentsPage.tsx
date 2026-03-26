import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { api, resolveApiAssetUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { Comment, Post } from "../types";
import {
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  Space,
  Typography,
} from "antd";
import { MessageOutlined, UserOutlined } from "@ant-design/icons";

export const PostCommentsPage = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [postImageSrc, setPostImageSrc] = useState<string | undefined>();

  const fetchComments = async () => {
    if (!postId) return;
    const response = await api.get<Comment[]>(`/posts/${postId}/comments`);
    setComments(response.data);
  };

  const fetchPost = async () => {
    if (!postId) return;
    const response = await api.get<Post>(`/posts/${postId}`);
    setPostImageSrc(resolveApiAssetUrl(response.data.imageUrl));
  };

  useEffect(() => {
    fetchComments();
    fetchPost();
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
      <Card className="form-card" title="Discussion">
        <Typography.Paragraph type="secondary">
          Drop your thoughts on this anime review.
        </Typography.Paragraph>
        {postImageSrc ? (
          <img
            src={postImageSrc}
            alt="Post preview"
            className="discussion-post-image"
          />
        ) : null}
        <Form layout="vertical" onSubmitCapture={onCreate}>
          <Form.Item label="Comment" required>
            <Input
              placeholder="Write your comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<MessageOutlined />}>
            Add comment
          </Button>
        </Form>
      </Card>

      <Card>
        {!comments.length ? (
          <Empty description="No comments yet" />
        ) : (
          <List
            dataSource={comments}
            renderItem={(comment) => {
              const authorName = comment.author?.username ?? "Unknown user";
              const isCurrentUserComment = comment.author?._id === user?._id;
              const avatarSrc = resolveApiAssetUrl(
                comment.author.profileImage ??
                  (isCurrentUserComment ? user?.profileImage : undefined),
              );
              const fallbackInitial = authorName.charAt(0).toUpperCase();

              return (
                <List.Item key={comment._id}>
                  <Space align="start">
                    <Avatar
                      src={avatarSrc}
                      icon={!avatarSrc ? <UserOutlined /> : undefined}
                      style={
                        !avatarSrc ? { backgroundColor: "#4338ca" } : undefined
                      }
                    >
                      {!avatarSrc ? fallbackInitial : null}
                    </Avatar>
                    <Space orientation="vertical" size={0}>
                      <Typography.Text strong>{authorName}</Typography.Text>
                      <Typography.Text>{comment.text}</Typography.Text>
                    </Space>
                  </Space>
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </section>
  );
};
