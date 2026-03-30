import { Link } from "react-router-dom";
import { api, resolveApiAssetUrl } from "../services/api";
import type { LikeUser, Post } from "../types";
import {
  Avatar,
  Button,
  Card,
  List,
  Modal,
  Popconfirm,
  Popover,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  HeartOutlined,
  MessageOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";

type Props = {
  post: Post;
  onLikeChanged: (post: Post) => void;
  onDeleted?: (postId: string) => void;
};

export const PostCard = ({ post, onLikeChanged, onDeleted }: Props) => {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [likesPopoverOpen, setLikesPopoverOpen] = useState(false);
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [loadingLikeUsers, setLoadingLikeUsers] = useState(false);
  const authorName = post.author?.username ?? "Unknown user";
  const likesCount = post.likesCount ?? post.likes?.length ?? 0;
  const isOwner = user?._id === post.author?._id;
  const imageSrc = resolveApiAssetUrl(post.imageUrl);
  const authorAvatarSrc = resolveApiAssetUrl(post.author?.profileImage);
  const visibleTags = (post.tags ?? []).slice(0, 3);
  const hiddenTagsCount = Math.max(
    0,
    (post.tags?.length ?? 0) - visibleTags.length,
  );

  const extractLikedUsers = (targetPost: Post): LikeUser[] => {
    const fromLikes = (targetPost.likes ?? []).flatMap((entry) => {
      if (typeof entry === "string") {
        return [{ _id: entry }];
      }
      if (!entry?._id) {
        return [];
      }
      return [entry];
    });

    const fromField = (targetPost.likedByUsers ?? []).filter(
      (entry): entry is LikeUser => Boolean(entry?._id),
    );

    return [...fromLikes, ...fromField].reduce<LikeUser[]>((acc, current) => {
      if (acc.some((existing) => existing._id === current._id)) {
        return acc;
      }
      return [...acc, current];
    }, []);
  };

  const initialLikedUsers = useMemo(() => extractLikedUsers(post), [post]);
  const [likedUsers, setLikedUsers] = useState<LikeUser[]>(initialLikedUsers);
  const previewLikedUsers = likedUsers.slice(0, 3);
  const hiddenLikesCount = Math.max(
    0,
    likedUsers.length - previewLikedUsers.length,
  );

  const enrichLikeUsers = async (rawUsers: LikeUser[]) => {
    const seedUsers = [post.author, user]
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .reduce<Record<string, LikeUser>>((acc, current) => {
        acc[current._id] = {
          _id: current._id,
          username: current.username,
          profileImage: current.profileImage,
        };
        return acc;
      }, {});

    const unresolvedIds = rawUsers
      .filter((entry) => !entry.username && !seedUsers[entry._id]?.username)
      .map((entry) => entry._id);

    const uniqueUnresolvedIds = Array.from(new Set(unresolvedIds));

    const fetchedUsers = await Promise.all(
      uniqueUnresolvedIds.map(async (targetId) => {
        try {
          const response = await api.get<
            | LikeUser
            | {
                user?: LikeUser;
                data?: LikeUser;
                username?: string;
                _id?: string;
                profileImage?: string;
              }
          >(`/users/${targetId}`);

          const payload = response.data as
            | LikeUser
            | {
                user?: LikeUser;
                data?: LikeUser;
                username?: string;
                _id?: string;
                profileImage?: string;
              };

          const normalized =
            "_id" in payload
              ? payload
              : (payload.user ?? payload.data ?? undefined);

          if (!normalized?._id) {
            return null;
          }

          return {
            _id: normalized._id,
            username: normalized.username,
            profileImage: normalized.profileImage,
          } satisfies LikeUser;
        } catch {
          return null;
        }
      }),
    );

    const mergedLookup = fetchedUsers.reduce<Record<string, LikeUser>>(
      (acc, current) => {
        if (!current?._id) {
          return acc;
        }

        acc[current._id] = {
          _id: current._id,
          username: current.username,
          profileImage: current.profileImage,
        };
        return acc;
      },
      { ...seedUsers },
    );

    return rawUsers.map((entry) => {
      const resolved = mergedLookup[entry._id];
      return {
        _id: entry._id,
        username: entry.username ?? resolved?.username ?? "Anime fan",
        profileImage: entry.profileImage ?? resolved?.profileImage,
      };
    });
  };

  const mergeLikeUsers = (baseUsers: LikeUser[], knownUsers: LikeUser[]) => {
    const knownLookup = knownUsers.reduce<Record<string, LikeUser>>(
      (acc, current) => {
        if (!current?._id) {
          return acc;
        }
        acc[current._id] = current;
        return acc;
      },
      {},
    );

    return baseUsers.map((entry) => {
      const known = knownLookup[entry._id];
      return {
        _id: entry._id,
        username: entry.username ?? known?.username,
        profileImage: entry.profileImage ?? known?.profileImage,
      };
    });
  };

  useEffect(() => {
    setLikedUsers((prev) => mergeLikeUsers(initialLikedUsers, prev));
  }, [initialLikedUsers]);

  const toggleLike = async () => {
    const response = await api.post<Post>(`/posts/${post._id}/like`);
    const nextExtractedUsers = extractLikedUsers(response.data);

    setLikedUsers((prev) => {
      const merged = mergeLikeUsers(nextExtractedUsers, prev);
      const currentUserId = user?._id;

      if (!currentUserId) {
        return merged;
      }

      const likedIds = new Set(
        (response.data.likes ?? []).map((entry) =>
          typeof entry === "string" ? entry : entry._id,
        ),
      );

      const hasCurrentUser = merged.some(
        (entry) => entry._id === currentUserId,
      );
      const isNowLikedByCurrentUser = likedIds.has(currentUserId);

      if (isNowLikedByCurrentUser && !hasCurrentUser) {
        return [
          {
            _id: currentUserId,
            username: user.username,
            profileImage: user.profileImage,
          },
          ...merged,
        ];
      }

      if (!isNowLikedByCurrentUser && hasCurrentUser) {
        return merged.filter((entry) => entry._id !== currentUserId);
      }

      return merged;
    });

    onLikeChanged(response.data);

    if (likesPopoverOpen || likesModalOpen) {
      void hydrateLikedUsers();
    }
  };

  const hydrateLikedUsers = async () => {
    if (loadingLikeUsers) {
      return;
    }

    setLoadingLikeUsers(true);
    try {
      let extracted: LikeUser[] = [];

      try {
        const likesResponse = await api.get<
          Array<string | LikeUser> | { likes?: Array<string | LikeUser> }
        >(`/posts/${post._id}/likes`);
        const likesPayload = Array.isArray(likesResponse.data)
          ? likesResponse.data
          : (likesResponse.data.likes ?? []);

        extracted = extractLikedUsers({
          ...post,
          likes: likesPayload,
        });
      } catch {
        const response = await api.get<Post>(`/posts/${post._id}`);
        extracted = extractLikedUsers(response.data);
      }

      const enrichedUsers = await enrichLikeUsers(extracted);
      setLikedUsers(enrichedUsers);
    } finally {
      setLoadingLikeUsers(false);
    }
  };

  const onLikesPopoverOpenChange = (nextOpen: boolean) => {
    if (!likesCount) {
      setLikesPopoverOpen(false);
      return;
    }

    setLikesPopoverOpen(nextOpen);
    if (
      nextOpen &&
      (likedUsers.length === 0 || likedUsers.some((entry) => !entry.username))
    ) {
      void hydrateLikedUsers();
    }
  };

  const unknownLikesCount = Math.max(0, likesCount - likedUsers.length);

  const deletePost = async () => {
    setDeleting(true);
    try {
      await api.delete(`/posts/${post._id}`);
      onDeleted?.(post._id);
      message.success("Post deleted");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card
      className="post-card"
      title={
        <Space align="center" size={10} className="post-card-author">
          <Avatar
            size={38}
            className="post-card-author-avatar"
            src={authorAvatarSrc}
            icon={!authorAvatarSrc ? <UserOutlined /> : undefined}
            style={
              !authorAvatarSrc ? { backgroundColor: "#4f46e5" } : undefined
            }
          >
            {!authorAvatarSrc ? authorName.charAt(0).toUpperCase() : null}
          </Avatar>
          <Space orientation="vertical" size={0}>
            <Typography.Text strong>{authorName}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(post.createdAt).toLocaleString()}
            </Typography.Text>
          </Space>
        </Space>
      }
      extra={<Tag color="purple">Anime Review</Tag>}
    >
      <Typography.Paragraph
        style={{ whiteSpace: "pre-wrap", marginBottom: 12 }}
      >
        {post.text}
      </Typography.Paragraph>

      {post.tags?.length ? (
        <Space wrap size={[6, 8]} style={{ marginBottom: 12 }}>
          {visibleTags.map((tag) => (
            <Tag key={tag} color="geekblue">
              #{tag}
            </Tag>
          ))}
          {hiddenTagsCount > 0 ? (
            <Tag color="default">+{hiddenTagsCount}</Tag>
          ) : null}
        </Space>
      ) : null}

      {post.imageUrl ? (
        <div className="post-image-shell">
          <img src={imageSrc} alt="post" className="post-image" />
        </div>
      ) : null}

      <Space
        className="post-card-actions"
        style={{ marginTop: 12, display: "flex", flexWrap: "wrap" }}
      >
        <Popover
          trigger={["hover", "click"]}
          placement="topLeft"
          open={likesPopoverOpen}
          onOpenChange={onLikesPopoverOpenChange}
          content={
            <div className="likes-popover-content">
              <Typography.Text strong>
                Liked by {likesCount} {likesCount === 1 ? "person" : "people"}
              </Typography.Text>
              <List
                size="small"
                loading={loadingLikeUsers}
                locale={{ emptyText: "No likes yet" }}
                dataSource={previewLikedUsers}
                renderItem={(likedUser) => {
                  const likedUserAvatarSrc = resolveApiAssetUrl(
                    likedUser.profileImage,
                  );
                  const likedUserName = likedUser.username ?? "Anime fan";

                  return (
                    <List.Item key={likedUser._id}>
                      <Space>
                        <Avatar
                          size="small"
                          src={likedUserAvatarSrc}
                          icon={
                            !likedUserAvatarSrc ? <UserOutlined /> : undefined
                          }
                        >
                          {!likedUserAvatarSrc
                            ? likedUserName.charAt(0).toUpperCase()
                            : null}
                        </Avatar>
                        <Typography.Text>{likedUserName}</Typography.Text>
                      </Space>
                    </List.Item>
                  );
                }}
              />
              {hiddenLikesCount > 0 ? (
                <Button
                  type="link"
                  className="likes-watch-more-btn"
                  onClick={() => {
                    setLikesPopoverOpen(false);
                    setLikesModalOpen(true);
                  }}
                >
                  Watch more ({hiddenLikesCount})
                </Button>
              ) : null}
              {unknownLikesCount ? (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  +{unknownLikesCount} other{" "}
                  {unknownLikesCount === 1 ? "person" : "people"}
                </Typography.Text>
              ) : null}
            </div>
          }
        >
          <Button icon={<HeartOutlined />} onClick={toggleLike}>
            Like ({likesCount})
          </Button>
        </Popover>
        <Link to={`/posts/${post._id}/comments`}>
          <Button icon={<MessageOutlined />}>
            Comments ({post.commentsCount ?? 0})
          </Button>
        </Link>
        {isOwner ? (
          <>
            <Link to={`/posts/${post._id}/edit`}>
              <Button icon={<EditOutlined />}>Edit</Button>
            </Link>
            <Popconfirm
              title="Delete post"
              description="This action cannot be undone."
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: deleting }}
              onConfirm={deletePost}
            >
              <Button danger icon={<DeleteOutlined />} loading={deleting}>
                Delete
              </Button>
            </Popconfirm>
          </>
        ) : (
          <Tooltip title="You can only edit your own posts">
            <Button icon={<EditOutlined />} disabled>
              Edit
            </Button>
          </Tooltip>
        )}
      </Space>

      <Modal
        title={`Liked by ${likesCount} ${likesCount === 1 ? "person" : "people"}`}
        open={likesModalOpen}
        footer={null}
        onCancel={() => setLikesModalOpen(false)}
        className="likes-modal"
      >
        <List
          size="small"
          loading={loadingLikeUsers}
          locale={{ emptyText: "No likes yet" }}
          dataSource={likedUsers}
          renderItem={(likedUser) => {
            const likedUserAvatarSrc = resolveApiAssetUrl(
              likedUser.profileImage,
            );
            const likedUserName = likedUser.username ?? "Anime fan";

            return (
              <List.Item key={`modal-${likedUser._id}`}>
                <Space>
                  <Avatar
                    size="small"
                    src={likedUserAvatarSrc}
                    icon={!likedUserAvatarSrc ? <UserOutlined /> : undefined}
                  >
                    {!likedUserAvatarSrc
                      ? likedUserName.charAt(0).toUpperCase()
                      : null}
                  </Avatar>
                  <Typography.Text>{likedUserName}</Typography.Text>
                </Space>
              </List.Item>
            );
          }}
        />
      </Modal>
    </Card>
  );
};
