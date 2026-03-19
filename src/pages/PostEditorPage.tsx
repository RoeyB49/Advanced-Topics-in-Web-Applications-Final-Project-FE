import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import type { Post } from "../types";
import { Button, Card, Form, Input, Space, Typography } from "antd";
import { UploadOutlined } from "@ant-design/icons";

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
      <Card
        className="form-card"
        title={postId ? "Edit Anime Review" : "Create Anime Review"}
      >
        <Typography.Paragraph type="secondary">
          Share your honest take, pacing notes, standout arcs, and who should
          watch.
        </Typography.Paragraph>
        <Form layout="vertical" onSubmitCapture={onSubmit}>
          <Form.Item label="Review" required>
            <Input.TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              required
            />
          </Form.Item>
          <Form.Item label="Image">
            <Input
              type="file"
              accept="image/*"
              prefix={<UploadOutlined />}
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              {postId ? "Update" : "Publish"}
            </Button>
            <Button onClick={() => navigate(-1)}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </section>
  );
};
