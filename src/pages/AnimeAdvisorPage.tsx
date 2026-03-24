import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Progress,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  BulbOutlined,
  FireOutlined,
  MessageOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { api } from "../services/api";
import type { ChatHistoryItem, RecommendationChatResponse } from "../types";

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const moodColor = (mood: string) => {
  if (["dark", "serious", "tense"].includes(mood.toLowerCase())) return "volcano";
  if (["fun", "light", "uplifting"].includes(mood.toLowerCase())) return "green";
  return "blue";
};

export const AnimeAdvisorPage = () => {
  const [message, setMessage] = useState("");
  const [watchedCsv, setWatchedCsv] = useState("Attack on Titan, Death Note");
  const [preferencesCsv, setPreferencesCsv] = useState("thriller, psychological, mature");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [response, setResponse] = useState<RecommendationChatResponse | null>(null);

  const watchedCount = useMemo(() => splitCsv(watchedCsv).length, [watchedCsv]);
  const preferenceCount = useMemo(() => splitCsv(preferencesCsv).length, [preferencesCsv]);

  const onSubmit = async () => {
    if (!message.trim()) {
      setError("Please describe what kind of anime you want.");
      return;
    }

    setError("");
    setLoading(true);

    const nextHistory = [...history, { role: "user", text: message.trim() }];

    try {
      const res = await api.post<RecommendationChatResponse>(
        "/ai/recommendations/chat",
        {
          message: message.trim(),
          watchedAnimes: splitCsv(watchedCsv),
          preferences: splitCsv(preferencesCsv),
          history: nextHistory.slice(-8),
        }
      );

      setResponse(res.data);
      setHistory((prev) => [
        ...prev,
        { role: "user", text: message.trim() },
        { role: "assistant", text: res.data.reply },
      ]);
      setMessage("");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to get recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="layout">
      <Card className="advisor-hero-card">
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            <RobotOutlined /> Animon Advisor
          </Typography.Title>
          <Typography.Text>
            Chat with your anime assistant and get personalized recommendations
            based on what you watched, your taste, and your review behavior.
          </Typography.Text>
          <Space wrap>
            <Tag color="blue">
              <ThunderboltOutlined /> Gemini-powered
            </Tag>
            <Tag color="purple">
              <BulbOutlined /> Personalized by your activity
            </Tag>
            <Tag color="gold">
              <FireOutlined /> Confidence-scored picks
            </Tag>
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={11}>
          <Card className="advisor-input-card" title="Your Taste Profile">
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div>
                <Typography.Text strong>Watched anime (comma-separated)</Typography.Text>
                <Input
                  size="large"
                  placeholder="e.g. Attack on Titan, Fullmetal Alchemist"
                  value={watchedCsv}
                  onChange={(event) => setWatchedCsv(event.target.value)}
                />
                <Typography.Text type="secondary">
                  {watchedCount} item(s)
                </Typography.Text>
              </div>

              <div>
                <Typography.Text strong>Preferences / vibe</Typography.Text>
                <Input
                  size="large"
                  placeholder="e.g. dark, story-rich, mature"
                  value={preferencesCsv}
                  onChange={(event) => setPreferencesCsv(event.target.value)}
                />
                <Typography.Text type="secondary">
                  {preferenceCount} preference(s)
                </Typography.Text>
              </div>

              <div>
                <Typography.Text strong>Ask the advisor</Typography.Text>
                <Input.TextArea
                  autoSize={{ minRows: 4, maxRows: 8 }}
                  placeholder="Try: I want something emotional like Vinland Saga but with mystery"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>

              {error ? <Alert type="error" showIcon message={error} /> : null}

              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                loading={loading}
                onClick={onSubmit}
              >
                Get Recommendations
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={13}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card className="advisor-chat-card" title={<><MessageOutlined /> Chat</>}>
              {!history.length ? (
                <Typography.Text type="secondary">
                  Start with what you liked recently and the advisor will answer in chat form.
                </Typography.Text>
              ) : (
                <div className="advisor-chat-log">
                  {history.slice(-6).map((entry, index) => (
                    <div
                      key={`${entry.role}-${index}`}
                      className={`advisor-bubble advisor-bubble-${entry.role}`}
                    >
                      <Typography.Text>{entry.text}</Typography.Text>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {response ? (
              <Card className="advisor-results-card" title="Recommendation Results">
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  <Space wrap>
                    <Tag color="geekblue">source: {response.source}</Tag>
                    <Tag>watched: {response.basedOn.watchedCount}</Tag>
                    <Tag>preferences: {response.basedOn.preferenceCount}</Tag>
                    <Tag>signals: {response.basedOn.userSignalCount}</Tag>
                  </Space>

                  <Typography.Paragraph style={{ marginBottom: 4 }}>
                    {response.reply}
                  </Typography.Paragraph>

                  <Space wrap>
                    {response.extractedPreferences.map((pref) => (
                      <Tag key={pref} color="purple">
                        {pref}
                      </Tag>
                    ))}
                  </Space>

                  <div className="advisor-reco-grid">
                    {response.recommendations.map((item) => (
                      <Card key={item.title} size="small" className="advisor-reco-item">
                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                          <Typography.Title level={5} style={{ margin: 0 }}>
                            {item.title}
                          </Typography.Title>
                          <Space wrap>
                            {item.genres.map((genre) => (
                              <Tag key={`${item.title}-${genre}`}>{genre}</Tag>
                            ))}
                            <Tag color={moodColor(item.mood)}>{item.mood}</Tag>
                          </Space>
                          <Typography.Text type="secondary">{item.reason}</Typography.Text>
                          <Progress
                            percent={Math.max(0, Math.min(100, Math.round(item.confidence)))}
                            size="small"
                            status="active"
                          />
                        </Space>
                      </Card>
                    ))}
                  </div>
                </Space>
              </Card>
            ) : null}
          </Space>
        </Col>
      </Row>
    </section>
  );
};
