import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const LoginPage = () => {
  const { login, socialLogin } = useAuth();
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

  const mockSocial = async (provider: "google" | "facebook") => {
    try {
      await socialLogin(provider, {
        providerId: `${provider}-demo-id`,
        email: `${provider}.demo@example.com`,
        username: `${provider}-demo`
      });
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Social login failed");
    }
  };

  return (
    <section className="center-page">
      <form className="card form" onSubmit={onSubmit}>
        <h1>Login</h1>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Login</button>
        <div className="social-row">
          <button type="button" onClick={() => mockSocial("google")}>Google</button>
          <button type="button" onClick={() => mockSocial("facebook")}>Facebook</button>
        </div>
      </form>
    </section>
  );
};
