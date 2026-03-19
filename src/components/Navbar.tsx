import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Layout, Space, Typography } from "antd";
import {
  HomeOutlined,
  LogoutOutlined,
  PlusOutlined,
  UserOutlined,
} from "@ant-design/icons";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Layout.Header className="navbar">
      <Link to="/" className="brand">
        <Typography.Title level={4} style={{ color: "#fff", margin: 0 }}>
          Animon
        </Typography.Title>
      </Link>
      <Space size="middle" className="nav-links">
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
            <Button size="small" onClick={onLogout} icon={<LogoutOutlined />}>
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
