import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";

export const RegisterPage = () => {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await register(username, email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Registration failed");
    }
  };

  return (
    <section className="center-page">
      <Card
        className="form-card"
        title={
          <Typography.Title level={3}>Create Animon account</Typography.Title>
        }
      >
        <Typography.Paragraph type="secondary">
          Start sharing anime reviews with your friends.
        </Typography.Paragraph>
        <Form layout="vertical" onSubmitCapture={onSubmit}>
          <Form.Item label="Username" required>
            <Input
              prefix={<UserOutlined />}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Form.Item>
          <Form.Item label="Email" required>
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Item>
          <Form.Item label="Password" required>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Item>
          {error ? (
            <Alert
              type="error"
              showIcon
              message={error}
              style={{ marginBottom: 12 }}
            />
          ) : null}
          <Button type="primary" htmlType="submit" block>
            Create account
          </Button>
        </Form>
      </Card>
    </section>
  );
};
