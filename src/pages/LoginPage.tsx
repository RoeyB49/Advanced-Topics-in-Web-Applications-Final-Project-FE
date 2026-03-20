import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Space,
  Typography,
  message,
} from "antd";
import {
  FacebookFilled,
  GoogleCircleFilled,
  LockOutlined,
  MailOutlined,
} from "@ant-design/icons";

export const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Login failed");
    }
  };

  const onSocialClick = (provider: "google" | "facebook") => {
    message.info(
      `${provider} login is not configured yet. Add OAuth client setup to enable it.`,
    );
  };

  return (
    <section className="center-page">
      <Card
        className="form-card"
        title={<Typography.Title level={3}>Welcome to Animon</Typography.Title>}
      >
        <Typography.Paragraph type="secondary">
          Log in to review anime and see what others recommend.
        </Typography.Paragraph>
        <Form layout="vertical" onSubmitCapture={onSubmit}>
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
            Login
          </Button>
          <Space
            style={{ marginTop: 12, width: "100%" }}
            orientation="vertical"
          >
            <Button
              icon={<GoogleCircleFilled />}
              block
              onClick={() => onSocialClick("google")}
            >
              Continue with Google
            </Button>
            <Button
              icon={<FacebookFilled />}
              block
              onClick={() => onSocialClick("facebook")}
            >
              Continue with Facebook
            </Button>
          </Space>
        </Form>
      </Card>
    </section>
  );
};
