import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Layout, Space, Typography } from "antd";
import {
  HomeOutlined,
  LogoutOutlined,
  MoonOutlined,
  PlusOutlined,
  SunOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useThemeMode } from "../context/ThemeContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Layout.Header className="navbar">
      <Link to="/" className="brand">
        <Space size={10} align="center">
          <img
            src="/branding/app-logo.svg"
            alt="Animon logo"
            className="brand-logo"
          />
          <Typography.Title level={4} style={{ color: "#fff", margin: 0 }}>
            Animon
          </Typography.Title>
        </Space>
      </Link>
      <Space size="middle" className="nav-links">
        <Button
          size="small"
          onClick={toggleTheme}
          icon={mode === "light" ? <MoonOutlined /> : <SunOutlined />}
          className="theme-toggle-btn"
        >
          {mode === "light" ? "Dark" : "Light"}
        </Button>
        {user ? (
          <>
            <Link to="/">
              <HomeOutlined /> Feed
            </Link>
            <Link to="/posts/new">
              <PlusOutlined /> Review Anime
            </Link>
            <Link to="/profile">
              <UserOutlined /> Profile
            </Link>
            <Button
              size="small"
              onClick={onLogout}
              icon={<LogoutOutlined />}
              className="logout-btn"
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </Space>
    </Layout.Header>
  );
};
