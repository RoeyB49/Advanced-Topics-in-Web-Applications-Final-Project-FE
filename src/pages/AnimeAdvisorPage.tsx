import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Input,
  Progress,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  BulbOutlined,
  ExportOutlined,
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
  if (["dark", "serious", "tense"].includes(mood.toLowerCase()))
    return "volcano";
  if (["fun", "light", "uplifting"].includes(mood.toLowerCase()))
    return "green";
  return "blue";
};

const renderAdvisorText = (text: string) => {
  // Convert *title* fragments from the assistant into bold text.
  const parts = text.split(/(\*[^*]+\*)/g);

  return parts.map((part, index) => {
    const isWrappedWithAsterisks = /^\*[^*]+\*$/.test(part);
    if (!isWrappedWithAsterisks) {
      return <span key={`text-${index}`}>{part}</span>;
    }

    const content = part.slice(1, -1).trim();
    return <strong key={`text-${index}`}>{content}</strong>;
  });
};

export const AnimeAdvisorPage = () => {
  type ExternalAnimeInfo = {
    imageUrl?: string;
    jikanUrl?: string;
    malUrl?: string;
  };

  const INITIAL_RECO_COUNT = 3;
  const [message, setMessage] = useState("");
  const [watchedCsv, setWatchedCsv] = useState("Attack on Titan, Death Note");
  const [preferencesCsv, setPreferencesCsv] = useState(
    "thriller, psychological, mature",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultsOpen, setResultsOpen] = useState(false);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [animeInfoByTitle, setAnimeInfoByTitle] = useState<
    Record<string, ExternalAnimeInfo>
  >({});
  const [posterAttemptedByTitle, setPosterAttemptedByTitle] = useState<
    Record<string, boolean>
  >({});
  const [response, setResponse] = useState<RecommendationChatResponse | null>(
    null,
  );

  const watchedCount = useMemo(() => splitCsv(watchedCsv).length, [watchedCsv]);
  const preferenceCount = useMemo(
    () => splitCsv(preferencesCsv).length,
    [preferencesCsv],
  );

  const recommendationTitles = useMemo(
    () => (response ? response.recommendations.map((item) => item.title) : []),
    [response],
  );

  useEffect(() => {
    const missingTitles = recommendationTitles.filter(
      (title) => !animeInfoByTitle[title] && !posterAttemptedByTitle[title],
    );

    if (!missingTitles.length) {
      return;
    }

    let cancelled = false;

    const fetchPostersFromJikan = async () => {
      const nextInfoByTitle: Record<string, ExternalAnimeInfo> = {};
      const nextAttempted: Record<string, boolean> = {};

      for (const title of missingTitles) {
        nextAttempted[title] = true;

        try {
          const response = await fetch(
            `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1&sfw`,
          );

          if (!response.ok) {
            continue;
          }

          const payload = await response.json();
          const imageUrl =
            payload?.data?.[0]?.images?.webp?.image_url ??
            payload?.data?.[0]?.images?.jpg?.image_url;
          const jikanUrl = payload?.data?.[0]?.url;
          const malId = payload?.data?.[0]?.mal_id;
          const malUrl = malId
            ? `https://myanimelist.net/anime/${malId}`
            : undefined;

          nextInfoByTitle[title] = { imageUrl, jikanUrl, malUrl };
        } catch {
          // Keep silent and use fallback avatar when Jikan has no match.
        }

        // Jikan has rate limits; stagger requests slightly for stability.
        await new Promise((resolve) => setTimeout(resolve, 180));
      }

      if (cancelled) {
        return;
      }

      setPosterAttemptedByTitle((prev) => ({ ...prev, ...nextAttempted }));
      if (Object.keys(nextInfoByTitle).length) {
        setAnimeInfoByTitle((prev) => ({ ...prev, ...nextInfoByTitle }));
      }
    };

    void fetchPostersFromJikan();

    return () => {
      cancelled = true;
    };
  }, [animeInfoByTitle, posterAttemptedByTitle, recommendationTitles]);

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
        },
      );

      setResponse(res.data);
      setResultsOpen(false);
      setShowAllRecommendations(false);
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
    <section className="layout advisor-screen">
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

      <Row gutter={[16, 16]} className="advisor-layout-row">
        <Col xs={24} lg={11} className="advisor-left-col">
          <Card className="advisor-input-card" title="Your Taste Profile">
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div>
                <Typography.Text strong>
                  Watched anime (comma-separated)
                </Typography.Text>
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

        <Col xs={24} lg={13} className="advisor-right-col">
          <Space
            direction="vertical"
            size={16}
            style={{ width: "100%" }}
            className="advisor-column-stack"
          >
            <Card
              className="advisor-chat-card"
              title={
                <>
                  <MessageOutlined /> Chat
                </>
              }
            >
              {!history.length ? (
                <Typography.Text type="secondary">
                  Start with what you liked recently and the advisor will answer
                  in chat form.
                </Typography.Text>
              ) : (
                <div className="advisor-chat-log">
                  {history.slice(-6).map((entry, index) => (
                    <div
                      key={`${entry.role}-${index}`}
                      className={`advisor-bubble advisor-bubble-${entry.role}`}
                    >
                      <Typography.Text>
                        {renderAdvisorText(entry.text)}
                      </Typography.Text>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {response ? (
              <Card
                className="advisor-results-preview-card"
                title="Recommendation Results Ready"
              >
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  <Space wrap>
                    <Tag color="geekblue">source: {response.source}</Tag>
                    <Tag>watched: {response.basedOn.watchedCount}</Tag>
                    <Tag>preferences: {response.basedOn.preferenceCount}</Tag>
                    <Tag>signals: {response.basedOn.userSignalCount}</Tag>
                  </Space>

                  <Typography.Paragraph style={{ marginBottom: 4 }}>
                    {renderAdvisorText(response.reply)}
                  </Typography.Paragraph>

                  <Button
                    type="primary"
                    size="large"
                    className="advisor-proceed-btn"
                    onClick={() => setResultsOpen(true)}
                  >
                    Proceed to Full Results
                  </Button>
                </Space>
              </Card>
            ) : null}
          </Space>
        </Col>
      </Row>

      <Drawer
        title="Recommendation Results"
        placement="right"
        width={560}
        open={resultsOpen}
        onClose={() => setResultsOpen(false)}
        className="advisor-results-drawer"
      >
        {response ? (
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            <Space wrap>
              <Tag color="geekblue">source: {response.source}</Tag>
              <Tag>watched: {response.basedOn.watchedCount}</Tag>
              <Tag>preferences: {response.basedOn.preferenceCount}</Tag>
              <Tag>signals: {response.basedOn.userSignalCount}</Tag>
            </Space>

            <Typography.Paragraph style={{ marginBottom: 4 }}>
              {renderAdvisorText(response.reply)}
            </Typography.Paragraph>

            <Space wrap>
              {response.extractedPreferences.map((pref) => (
                <Tag key={pref} color="purple">
                  {pref}
                </Tag>
              ))}
            </Space>

            <div className="advisor-reco-grid">
              {(showAllRecommendations
                ? response.recommendations
                : response.recommendations.slice(0, INITIAL_RECO_COUNT)
              ).map((item) => (
                <Card
                  key={item.title}
                  size="small"
                  className="advisor-reco-item"
                >
                  <Space
                    direction="vertical"
                    size={8}
                    style={{ width: "100%" }}
                  >
                    <div className="advisor-reco-head">
                      {animeInfoByTitle[item.title]?.imageUrl ? (
                        <img
                          src={animeInfoByTitle[item.title].imageUrl}
                          alt={`${item.title} poster`}
                          className="advisor-reco-poster"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="advisor-reco-poster-fallback"
                          aria-hidden="true"
                        >
                          <RobotOutlined />
                        </div>
                      )}
                      <Typography.Title level={5} style={{ margin: 0 }}>
                        {item.title}
                      </Typography.Title>
                    </div>
                    <Space size={4} wrap>
                      {animeInfoByTitle[item.title]?.jikanUrl ? (
                        <Button
                          type="link"
                          size="small"
                          className="advisor-ext-link-btn"
                          href={animeInfoByTitle[item.title].jikanUrl}
                          target="_blank"
                        >
                          <ExportOutlined /> Jikan
                        </Button>
                      ) : null}
                      {animeInfoByTitle[item.title]?.malUrl ? (
                        <Button
                          type="link"
                          size="small"
                          className="advisor-ext-link-btn"
                          href={animeInfoByTitle[item.title].malUrl}
                          target="_blank"
                        >
                          <ExportOutlined /> MAL
                        </Button>
                      ) : null}
                    </Space>
                    <Space wrap>
                      {item.genres.map((genre) => (
                        <Tag key={`${item.title}-${genre}`}>{genre}</Tag>
                      ))}
                      <Tag color={moodColor(item.mood)}>{item.mood}</Tag>
                    </Space>
                    <Typography.Text type="secondary">
                      {item.reason}
                    </Typography.Text>
                    <Progress
                      percent={Math.max(
                        0,
                        Math.min(100, Math.round(item.confidence)),
                      )}
                      size="small"
                      status="active"
                    />
                  </Space>
                </Card>
              ))}
            </div>

            {response.recommendations.length > INITIAL_RECO_COUNT ? (
              <Button
                type="default"
                className="advisor-show-more-btn"
                onClick={() => setShowAllRecommendations((prev) => !prev)}
              >
                {showAllRecommendations
                  ? "Show fewer recommendations"
                  : `Show all (${response.recommendations.length}) recommendations`}
              </Button>
            ) : null}
          </Space>
        ) : null}
      </Drawer>
    </section>
  );
};
