import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { API_ORIGIN, api } from "../services/api";
import type { Comment } from "../types";
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
      <Card className="form-card" title="Discussion">
        <Typography.Paragraph type="secondary">
          Drop your thoughts on this anime review.
        </Typography.Paragraph>
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
            renderItem={(comment) => (
              <List.Item key={comment._id}>
                <Space align="start">
                  <Avatar
                    src={
                      comment.author.profileImage
                        ? `http://localhost:3000${comment.author.profileImage}`
                        : undefined
                    }
                    icon={<UserOutlined />}
                  />
                  <Space orientation="vertical" size={0}>
                    <Typography.Text strong>
                      {comment.author?.username ?? "Unknown user"}
                    </Typography.Text>
                    <Typography.Text>{comment.text}</Typography.Text>
                  </Space>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>
    </section>
  );
};
