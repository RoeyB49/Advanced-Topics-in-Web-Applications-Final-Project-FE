import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import type { Post } from "../types";
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";

const TAG_SUGGESTIONS = [
  "shonen",
  "seinen",
  "shojo",
  "isekai",
  "mecha",
  "romance",
  "comedy",
  "drama",
  "action",
  "mystery",
  "thriller",
  "slice-of-life",
  "psychological",
  "fantasy",
  "sports",
  "classic",
  "must-watch",
  "underrated",
];

export const PostEditorPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [loadingPost, setLoadingPost] = useState(Boolean(postId));
  const [canEdit, setCanEdit] = useState(!postId);

  useEffect(() => {
    if (!postId) return;
    setLoadingPost(true);

    api
      .get<Post>(`/posts/${postId}`)
      .then((response) => {
        const isOwner = response.data.author?._id === user?._id;
        if (!isOwner) {
          setCanEdit(false);
          message.error("You can only edit your own posts.");
          navigate("/");
          return;
        }

        setCanEdit(true);
        setText(response.data.text);
        setTags(response.data.tags ?? []);
      })
      .catch(() => {
        message.error("Unable to load this post.");
        navigate("/");
      })
      .finally(() => setLoadingPost(false));
  }, [postId, user?._id, navigate]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (postId && !canEdit) return;

    const formData = new FormData();
    formData.append("text", text);
    tags.forEach((tag) => formData.append("tags[]", tag));
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
        loading={loadingPost}
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
          <Form.Item label="Tags">
            <Select
              mode="tags"
              allowClear
              value={tags}
              placeholder="Add tags like isekai, romance, must-watch"
              options={TAG_SUGGESTIONS.map((tag) => ({
                value: tag,
                label: tag,
              }))}
              onChange={(values) =>
                setTags(
                  Array.from(
                    new Set(
                      values
                        .map((value) => value.trim())
                        .filter((value) => value.length > 0),
                    ),
                  ),
                )
              }
              tokenSeparators={[",", " "]}
              maxTagCount="responsive"
            />
          </Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              disabled={postId ? !canEdit : false}
            >
              {postId ? "Update" : "Publish"}
            </Button>
            <Button onClick={() => navigate(-1)}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </section>
  );
};
