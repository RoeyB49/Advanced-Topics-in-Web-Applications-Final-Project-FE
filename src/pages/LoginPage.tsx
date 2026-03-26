import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert, Button, Card, Form, Input, Space, Typography } from "antd";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import {
  FacebookFilled,
  GoogleOutlined,
  LockOutlined,
  MailOutlined,
} from "@ant-design/icons";

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (config: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: {
          authResponse?: {
            accessToken: string;
          };
        }) => void,
        options?: { scope: string },
      ) => void;
    };
  }
}

let facebookSdkPromise: Promise<void> | null = null;

const loadFacebookSdk = () => {
  if (window.FB) {
    return Promise.resolve();
  }

  if (facebookSdkPromise) {
    return facebookSdkPromise;
  }

  facebookSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("facebook-jssdk");
    if (existingScript) {
      resolve();
      return;
    }

    window.fbAsyncInit = () => {
      if (!window.FB || !FACEBOOK_APP_ID) {
        reject(new Error("Facebook SDK initialization failed"));
        return;
      }

      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v23.0",
      });
      resolve();
    };

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Facebook SDK"));
    document.body.appendChild(script);
  });

  return facebookSdkPromise;
};

export const LoginPage = () => {
  const { login, socialLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [socialLoading, setSocialLoading] = useState(false);
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

  const onGoogleSuccess = async (credential?: string) => {
    if (!credential) {
      setError("Google login did not return a token");
      return;
    }

    setSocialLoading(true);
    setError("");
    try {
      await socialLogin("google", { token: credential });
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Google login failed");
    } finally {
      setSocialLoading(false);
    }
  };

  const onFacebookLogin = async () => {
    if (!FACEBOOK_APP_ID) {
      setError("Facebook login is not configured in frontend env");
      return;
    }

    setSocialLoading(true);
    setError("");

    try {
      await loadFacebookSdk();

      const token = await new Promise<string>((resolve, reject) => {
        window.FB?.login(
          (response) => {
            const accessToken = response.authResponse?.accessToken;
            if (!accessToken) {
              reject(new Error("Facebook login was cancelled"));
              return;
            }
            resolve(accessToken);
          },
          { scope: "public_profile,email" },
        );
      });

      await socialLogin("facebook", { token });
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.message ?? err.message ?? "Facebook login failed",
      );
    } finally {
      setSocialLoading(false);
    }
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
            className="social-auth-stack"
          >
            {GOOGLE_CLIENT_ID ? (
              <div
                className="social-google-wrap"
                aria-label="Continue with Google"
              >
                <Button
                  icon={<GoogleOutlined />}
                  block
                  className="social-login-btn"
                >
                  Continue with Google
                </Button>
                <div className="social-google-overlay" aria-hidden="true">
                  <GoogleLogin
                    onSuccess={(credentialResponse: CredentialResponse) =>
                      onGoogleSuccess(credentialResponse.credential)
                    }
                    onError={() => setError("Google login failed")}
                    useOneTap={false}
                    width="100%"
                    text="continue_with"
                    theme="outline"
                  />
                </div>
              </div>
            ) : (
              <Button block disabled>
                Google login is not configured
              </Button>
            )}
            <Button
              icon={<FacebookFilled />}
              block
              className="social-login-btn"
              loading={socialLoading}
              onClick={onFacebookLogin}
            >
              Continue with Facebook
            </Button>
          </Space>
        </Form>
      </Card>
    </section>
  );
};
