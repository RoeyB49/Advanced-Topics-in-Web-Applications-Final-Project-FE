import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert, Button, Divider, Form, Input, Typography } from "antd";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import {
  FacebookFilled,
  LockOutlined,
  MailOutlined,
  MoonOutlined,
  SunOutlined,
} from "@ant-design/icons";
import { useThemeMode } from "../context/ThemeContext";

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
  const { mode, toggleTheme } = useThemeMode();
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
    <section className="center-page login-page-shell">
      <div className="login-layout">
        <aside className="login-showcase">
          <Typography.Paragraph className="showcase-kicker">
            Track what you loved. Discover what to watch next.
          </Typography.Paragraph>
          <Typography.Title level={1} className="showcase-title">
            Get anime picks tuned to your taste
          </Typography.Title>
          <div className="showcase-art">
            <img
              src="/favicon.svg"
              alt="Animon icon"
              className="showcase-art-favicon"
            />
          </div>
          <Typography.Paragraph className="showcase-footnote">
            From shonen hype to cozy slice-of-life, your next favorite is here.
          </Typography.Paragraph>
        </aside>

        <div className="login-panel">
          <div className="login-panel-inner">
            <div className="login-panel-top">
              <Button
                size="small"
                onClick={toggleTheme}
                icon={mode === "light" ? <MoonOutlined /> : <SunOutlined />}
                className="theme-toggle-btn login-theme-toggle"
              >
                {mode === "light" ? "Dark" : "Light"}
              </Button>
            </div>
            <Typography.Title level={2} className="auth-title">
              Welcome to Animon
            </Typography.Title>
            <Typography.Paragraph className="login-subtext">
              Log in to rate, review, and get personalized anime
              recommendations.
            </Typography.Paragraph>

            <div className="social-auth-stack">
              {GOOGLE_CLIENT_ID ? (
                <div className="google-login-shell">
                  <GoogleLogin
                    onSuccess={(credentialResponse: CredentialResponse) =>
                      onGoogleSuccess(credentialResponse.credential)
                    }
                    onError={() => setError("Google login failed")}
                    useOneTap={false}
                    shape="pill"
                    size="large"
                    text="continue_with"
                  />
                </div>
              ) : (
                <Button block disabled className="social-login-btn">
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
            </div>

            <Divider className="login-divider">or</Divider>

            <Form
              layout="vertical"
              onSubmitCapture={onSubmit}
              className="login-form"
            >
              <Form.Item>
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  size="large"
                />
              </Form.Item>
              <Form.Item>
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  size="large"
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

              <Button
                type="primary"
                htmlType="submit"
                block
                className="login-btn"
              >
                Login
              </Button>

              <Link to="/register" className="register-link-btn-wrap">
                <Button block className="register-link-btn">
                  Create a new account
                </Button>
              </Link>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
};
