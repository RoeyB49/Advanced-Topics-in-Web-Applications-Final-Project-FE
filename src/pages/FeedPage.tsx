import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import type {
  IntelligentSearchAI,
  IntelligentSearchResponse,
  Post,
} from "../types";
import { PostCard } from "../components/PostCard";
import {
  Card,
  Empty,
  Input,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { RobotOutlined, SearchOutlined } from "@ant-design/icons";

type FeedResponse = {
  posts: Post[];
  totalPages: number;
  currentPage: number;
};

const SEARCH_PLACEHOLDERS = [
  "Try 'shows like Solo Leveling' or #fantasy #action",
  "Search 'sad romance with a twist' or #drama #shojo",
  "Describe a vibe or use tags: #isekai #comedy",
];

const SIMPLE_SEARCH_TAGS = [
  "shonen",
  "seinen",
  "shojo",
  "isekai",
  "mecha",
  "romance",
  "comedy",
  "drama",
  "action",
  "mystery",
  "thriller",
  "slice-of-life",
  "psychological",
  "fantasy",
  "sports",
  "classic",
  "must-watch",
  "underrated",
];

const SIMPLE_SEARCH_TAG_ALIASES: Record<string, string> = {
  "slice of life": "slice-of-life",
  sliceoflife: "slice-of-life",
  "must watch": "must-watch",
  mustwatch: "must-watch",
};

const parseSimpleSearchQuery = (rawQuery: string) => {
  const knownTagSet = new Set(SIMPLE_SEARCH_TAGS);
  const lowerQuery = rawQuery.toLowerCase();

  const hashtagTags = Array.from(rawQuery.matchAll(/#([\w-]+)/g))
    .map((match) => match[1].toLowerCase())
    .filter((tag) => knownTagSet.has(tag));

  const aliasTags = Object.entries(SIMPLE_SEARCH_TAG_ALIASES)
    .filter(([alias]) => lowerQuery.includes(alias))
    .map(([, normalized]) => normalized);

  let strippedQuery = lowerQuery.replace(/#[\w-]+/g, " ");
  Object.keys(SIMPLE_SEARCH_TAG_ALIASES).forEach((alias) => {
    strippedQuery = strippedQuery.replaceAll(alias, " ");
  });

  const plainTokenTags = strippedQuery
    .split(/[^a-z0-9-]+/)
    .filter(Boolean)
    .filter((token) => knownTagSet.has(token));

  const tags = Array.from(
    new Set([...hashtagTags, ...aliasTags, ...plainTokenTags]),
  );

  const textQuery = strippedQuery
    .split(/\s+/)
    .filter((word) => word.length > 0 && !knownTagSet.has(word))
    .join(" ")
    .trim();

  return {
    tags,
    textQuery,
  };
};

const filterPostsForSimpleSearch = (
  sourcePosts: Post[],
  textQuery: string,
  tags: string[],
) => {
  const textNeedle = textQuery.toLowerCase();

  return sourcePosts.filter((post) => {
    const textMatch =
      !textNeedle ||
      [post.text, post.author?.username]
        .join(" ")
        .toLowerCase()
        .includes(textNeedle);

    const postTags = (post.tags ?? []).map((tag) => tag.toLowerCase());
    const tagsMatch = tags.every((tag) => postTags.includes(tag));

    return textMatch && tagsMatch;
  });
};

export const FeedPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<"ai" | "simple">("ai");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchAI, setSearchAI] = useState<IntelligentSearchAI | null>(null);

  const canLoadMore = useMemo(
    () => hasMore && !loading && !searchLoading && !isSearchResult,
    [hasMore, loading, searchLoading, isSearchResult],
  );

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
    const intervalId = window.setInterval(() => {
      setPlaceholderIndex(
        (prevIndex) => (prevIndex + 1) % SEARCH_PLACEHOLDERS.length,
      );
    }, 4500);

    return () => window.clearInterval(intervalId);
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

  const runSimpleSearch = async (normalizedQuery: string) => {
    const { tags, textQuery } = parseSimpleSearchQuery(normalizedQuery);
    const queryParams = new URLSearchParams();

    queryParams.set("q", textQuery);
    tags.forEach((tag) => queryParams.append("tags[]", tag));

    const queryString = queryParams.toString();

    const endpoints = [
      `/posts/search/simple?${queryString}`,
      `/posts/search?${queryString}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await api.get<FeedResponse | Post[]>(endpoint);
        const payload = response.data;
        if (Array.isArray(payload)) {
          return filterPostsForSimpleSearch(payload, textQuery, tags);
        }
        if (Array.isArray(payload.posts)) {
          return filterPostsForSimpleSearch(payload.posts, textQuery, tags);
        }
      } catch {
        // Try the next endpoint if the current one is unavailable.
      }
    }

    const fallbackResponse = await api.get<FeedResponse>(
      `/posts?page=1&limit=100`,
    );
    return filterPostsForSimpleSearch(
      fallbackResponse.data.posts,
      textQuery,
      tags,
    );
  };

  const resetToAllPosts = async () => {
    setSearchAI(null);
    setIsSearchResult(false);
    setHasMore(true);
    await fetchPage(1);
  };

  const onSearch = async (incomingValue?: string) => {
    const normalizedQuery = (incomingValue ?? query).trim();
    if (!normalizedQuery) {
      await resetToAllPosts();
      return;
    }

    setSearchLoading(true);
    try {
      if (searchMode === "ai") {
        const response = await api.get<IntelligentSearchResponse>(
          `/posts/search/intelligent?q=${encodeURIComponent(normalizedQuery)}`,
        );
        setPosts(response.data.posts);
        setSearchAI(response.data.ai);
      } else {
        const simpleResults = await runSimpleSearch(normalizedQuery);
        setPosts(simpleResults);
        setSearchAI(null);
      }

      setIsSearchResult(true);
      setHasMore(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const onQueryChange = (nextValue: string) => {
    const hadValue = query.trim().length > 0;
    setQuery(nextValue);
    if (hadValue && nextValue.trim().length === 0) {
      void resetToAllPosts();
    }
  };

  const onLikeChanged = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === updatedPost._id
          ? {
              ...post,
              likes: updatedPost.likes,
              likedByUsers: updatedPost.likedByUsers,
              likesCount:
                updatedPost.likesCount ?? updatedPost.likes?.length ?? 0,
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
            Search by title, genre, or mood. Choose Smart search for AI intent
            analysis or Simple search for faster results.
          </Typography.Text>
          <div className="feed-search-controls">
            <Segmented
              value={searchMode}
              options={[
                { label: "Smart (AI)", value: "ai" },
                { label: "Simple", value: "simple" },
              ]}
              onChange={(value) => setSearchMode(value as "ai" | "simple")}
            />
            {searchLoading ? (
              <Space size={8}>
                <Spin size="small" />
                <Typography.Text type="secondary">Searching...</Typography.Text>
              </Space>
            ) : null}
          </div>
          <Input.Search
            enterButton={
              <>
                <SearchOutlined /> Search
              </>
            }
            allowClear
            size="large"
            prefix={
              searchMode === "ai" ? <RobotOutlined /> : <SearchOutlined />
            }
            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
            value={query}
            loading={searchLoading}
            onChange={(e) => onQueryChange(e.target.value)}
            onSearch={(value) => void onSearch(value)}
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
