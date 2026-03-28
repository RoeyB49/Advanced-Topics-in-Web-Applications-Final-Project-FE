import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Drawer, Grid, Layout, Space, Typography } from "antd";
import {
  CommentOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuOutlined,
  MoonOutlined,
  PlusOutlined,
  SunOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useThemeMode } from "../context/ThemeContext";
import { useState } from "react";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const isLoginPage = location.pathname === "/login";
  const isMobile = !screens.md;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const onLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <Layout.Header className="navbar">
      {isLoginPage ? (
        <div />
      ) : (
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
      )}

      {isMobile ? (
        <Space size="small" className="navbar-mobile-controls">
          <Button
            size="small"
            onClick={toggleTheme}
            icon={mode === "light" ? <MoonOutlined /> : <SunOutlined />}
            className="theme-toggle-btn"
          >
            {mode === "light" ? "Dark" : "Light"}
          </Button>
          <Button
            size="small"
            icon={<MenuOutlined />}
            className="theme-toggle-btn mobile-nav-trigger"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            Menu
          </Button>
          <Drawer
            title="Navigation"
            placement="right"
            open={mobileMenuOpen}
            onClose={closeMobileMenu}
            className="mobile-nav-drawer"
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {user ? (
                <>
                  <Link
                    to="/"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    <HomeOutlined /> Feed
                  </Link>
                  <Link
                    to="/posts/new"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    <PlusOutlined /> Review Anime
                  </Link>
                  <Link
                    to="/profile"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    <UserOutlined /> Profile
                  </Link>
                  <Link
                    to="/advisor"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    <CommentOutlined /> AI Advisor
                  </Link>
                  <Button
                    onClick={onLogout}
                    icon={<LogoutOutlined />}
                    className="logout-btn mobile-logout-btn"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    Register
                  </Link>
                </>
              )}
            </Space>
          </Drawer>
        </Space>
      ) : (
        <Space size="middle" className="nav-links">
          <Button
            size="small"
            onClick={toggleTheme}
            icon={mode === "light" ? <MoonOutlined /> : <SunOutlined />}
            className="theme-toggle-btn"
          >
            {mode === "light" ? "Dark" : "Light"}
          </Button>
          {isLoginPage ? null : user ? (
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
              <Link to="/advisor">
                <CommentOutlined /> AI Advisor
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
      )}
    </Layout.Header>
  );
};
