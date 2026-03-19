import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import type { Post } from "../types";
import { PostCard } from "../components/PostCard";

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

  const canLoadMore = useMemo(() => hasMore && !loading, [hasMore, loading]);

  const fetchPage = async (targetPage: number) => {
    setLoading(true);
    try {
      const response = await api.get<FeedResponse>(`/posts?page=${targetPage}&limit=5`);
      const nextPosts = response.data.posts;
      setPosts((prev) => (targetPage === 1 ? nextPosts : [...prev, ...nextPosts]));
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
      fetchPage(1);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get<Post[]>(`/posts/search?q=${encodeURIComponent(query)}`);
      setPosts(response.data);
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
              likesCount: updatedPost.likes.length
            }
          : post
      )
    );
  };

  return (
    <section className="layout">
      <div className="card toolbar">
        <input
          placeholder="Ask AI to search posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={onSearch}>Search</button>
      </div>

      <div className="feed-grid">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} onLikeChanged={onLikeChanged} />
        ))}
      </div>

      {loading ? <p className="center">Loading...</p> : null}
      {!loading && !posts.length ? <p className="center">No posts found</p> : null}
    </section>
  );
};
