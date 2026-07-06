"use client";

import { useState } from "react";
import { postApi } from "../lib/api";

export default function PostCard({ post, onDeleted }) {
    const [liked, setLiked] = useState(post.likedByMe);
    const [likesCount, setLikesCount] = useState(post.likesCount || 0);
    const [busy, setBusy] = useState(false);

    const toggleLike = async () => {
        if (busy) return;

        setBusy(true);

        try {
            if (liked) {
                await postApi.unlike(post.id);
                setLikesCount((count) => Math.max(count - 1, 0));
            } else {
                await postApi.like(post.id);
                setLikesCount((count) => count + 1);
            }

            setLiked(!liked);
        } finally {
            setBusy(false);
        }
    };

    const deletePost = async () => {
        await postApi.delete(post.id);
        onDeleted?.(post.id);
    };

    return (
        <article className="post-card">
            <header className="post-author">
                <div className="avatar">
                    {post.author?.avatar ? (
                        <img alt="" src={post.author.avatar} />
                    ) : (
                        <span>
                            {(post.author?.name || post.author?.email || "U")
                                .charAt(0)
                                .toUpperCase()}
                        </span>
                    )}
                </div>

                <div>
                    <strong>{post.author?.name || "User"}</strong>
                    <p>@{post.author?.username || `user${post.author?.id}`}</p>
                </div>
            </header>

            <img alt={post.caption || "Post image"} className="post-image" src={post.imageUrl} />

            <div className="post-body">
                <div className="post-actions">
                    <button
                        className={liked ? "like-button liked" : "like-button"}
                        disabled={busy}
                        onClick={toggleLike}
                    >
                        {liked ? "Liked" : "Like"}
                    </button>

                    {onDeleted && (
                        <button className="ghost-button small" onClick={deletePost}>
                            Delete
                        </button>
                    )}
                </div>

                <strong>{likesCount} likes</strong>
                {post.caption && <p>{post.caption}</p>}
            </div>
        </article>
    );
}
