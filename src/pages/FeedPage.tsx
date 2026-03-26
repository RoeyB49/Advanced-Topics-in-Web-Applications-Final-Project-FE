import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import type {
  IntelligentSearchAI,
  IntelligentSearchResponse,
  Post,
} from "../types";
import { PostCard } from "../components/PostCard";
import { Card, Empty, Input, Space, Spin, Tag, Typography } from "antd";
import { RobotOutlined, SearchOutlined } from "@ant-design/icons";

type FeedResponse = {
  posts: Post[];
  totalPages: number;
  currentPage: number;
};

export const FeedPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchAI, setSearchAI] = useState<IntelligentSearchAI | null>(null);

  const canLoadMore = useMemo(() => hasMore && !loading, [hasMore, loading]);

  const fetchPage = async (targetPage: number) => {
    setLoading(true);
    try {
      const response = await api.get<FeedResponse>(
        `/posts?page=${targetPage}&limit=5`,
      );
      const nextPosts = response.data.posts;
      setPosts((prev) =>
        targetPage === 1 ? nextPosts : [...prev, ...nextPosts],
      );
      setHasMore(response.data.currentPage < response.data.totalPages);
      setPage(targetPage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const reachedBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
      if (reachedBottom && canLoadMore) {
        fetchPage(page + 1);
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [canLoadMore, page]);

  const onSearch = async () => {
    if (!query.trim()) {
      setSearchAI(null);
      fetchPage(1);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get<IntelligentSearchResponse>(
        `/posts/search/intelligent?q=${encodeURIComponent(query)}`,
      );
      setPosts(response.data.posts);
      setSearchAI(response.data.ai);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const onLikeChanged = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === updatedPost._id
          ? {
              ...post,
              likes: updatedPost.likes,
              likesCount: updatedPost.likes?.length ?? 0,
            }
          : post,
      ),
    );
  };

  const onPostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
  };

  return (
    <section className="layout">
      <Card className="toolbar-card">
        <Space orientation="vertical" size={8} style={{ width: "100%" }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Explore Animon Reviews
          </Typography.Title>
          <Typography.Text type="secondary">
            Search by title, genre, or mood and let AI surface relevant anime
            takes.
          </Typography.Text>
          <Input.Search
            enterButton={
              <>
                <SearchOutlined /> Search
              </>
            }
            size="large"
            prefix={<RobotOutlined />}
            placeholder="Try: psychological thriller, found family, best mecha finales"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onSearch={onSearch}
          />
        </Space>
      </Card>

      {searchAI ? (
        <Card className="toolbar-card" style={{ marginTop: 12 }}>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              AI Query Analysis
            </Typography.Title>
            <Space wrap>
              <Tag color="blue">source: {searchAI.source}</Tag>
              <Tag color="geekblue">intent: {searchAI.intent}</Tag>
              <Tag color="purple">sentiment: {searchAI.sentimentHint}</Tag>
            </Space>
            {searchAI.detectedAnimeTitles.length ? (
              <div>
                <Typography.Text strong>Detected titles: </Typography.Text>
                <Space wrap>
                  {searchAI.detectedAnimeTitles.map((title) => (
                    <Tag key={title} color="gold">
                      {title}
                    </Tag>
                  ))}
                </Space>
              </div>
            ) : null}
            {searchAI.detectedGenres.length ? (
              <div>
                <Typography.Text strong>Detected genres: </Typography.Text>
                <Space wrap>
                  {searchAI.detectedGenres.map((genre) => (
                    <Tag key={genre} color="green">
                      {genre}
                    </Tag>
                  ))}
                </Space>
              </div>
            ) : null}
            {searchAI.keywords.length ? (
              <div>
                <Typography.Text strong>Search keywords: </Typography.Text>
                <Space wrap>
                  {searchAI.keywords.map((keyword) => (
                    <Tag key={keyword}>{keyword}</Tag>
                  ))}
                </Space>
              </div>
            ) : null}
          </Space>
        </Card>
      ) : null}

      <div className="feed-grid">
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onLikeChanged={onLikeChanged}
            onDeleted={onPostDeleted}
          />
        ))}
      </div>

      {loading ? (
        <div className="center">
          <Spin size="large" />
        </div>
      ) : null}
      {!loading && !posts.length ? (
        <Empty description="No anime reviews found" />
      ) : null}
    </section>
  );
};
