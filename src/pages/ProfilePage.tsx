import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, resolveApiAssetUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { Post } from "../types";
import {
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  Popconfirm,
  Space,
  Typography,
  message,
} from "antd";
import { DeleteOutlined, UserOutlined } from "@ant-design/icons";

type ProfileResponse = {
  user: {
    _id: string;
    username: string;
    email: string;
    profileImage?: string;
  };
  posts: Post[];
};

export const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [username, setUsername] = useState("");
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const response = await api.get<ProfileResponse>("/users/profile");
      setUsername(response.data.user.username);
      setMyPosts(response.data.posts);
    };
    loadProfile();
  }, []);

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?._id) return;

    const formData = new FormData();
    formData.append("username", username);
    if (image) {
      formData.append("image", image);
    }

    await api.put(`/users/${user._id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    await refreshProfile();
    message.success("Profile updated");
  };

  const profileImageSrc = resolveApiAssetUrl(user?.profileImage);

  const deletePost = async (postId: string) => {
    await api.delete(`/posts/${postId}`);
    setMyPosts((prev) => prev.filter((post) => post._id !== postId));
    message.success("Post deleted");
  };

  return (
    <section className="layout">
      <Card className="form-card" title="My Profile">
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <Space>
            <Avatar
              size={64}
              src={profileImageSrc}
              icon={<UserOutlined />}
              style={{ backgroundColor: "#1d4ed8" }}
            />
            <Space orientation="vertical" size={0}>
              <Typography.Text strong>{user?.username}</Typography.Text>
              <Typography.Text type="secondary">{user?.email}</Typography.Text>
            </Space>
          </Space>

          <Form layout="vertical" onSubmitCapture={onSave}>
            <Form.Item label="Username" required>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Profile image">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Save profile
            </Button>
          </Form>
        </Space>
      </Card>

      <section>
        <Typography.Title level={4}>My Reviews</Typography.Title>
        {!myPosts.length ? (
          <Card>
            <Empty description="You have not posted anime reviews yet" />
          </Card>
        ) : (
          <Card>
            <List
              dataSource={myPosts}
              renderItem={(post) => (
                <List.Item key={post._id}>
                  <Space
                    direction="vertical"
                    size={2}
                    style={{ width: "100%" }}
                  >
                    <Space
                      style={{ width: "100%", justifyContent: "space-between" }}
                      align="start"
                    >
                      <Space direction="vertical" size={2}>
                        <Typography.Text>{post.text}</Typography.Text>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                        >
                          {new Date(post.createdAt).toLocaleString()}
                        </Typography.Text>
                      </Space>
                      <Popconfirm
                        title="Delete post"
                        description="This action cannot be undone."
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => deletePost(post._id)}
                      >
                        <Button danger icon={<DeleteOutlined />}>
                          Delete
                        </Button>
                      </Popconfirm>
                    </Space>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}
      </section>
    </section>
  );
};
