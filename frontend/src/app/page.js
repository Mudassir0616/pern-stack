"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import PostCard from "../components/PostCard";
import PostComposer from "../components/PostComposer";
import { getToken, postApi, userApi } from "../lib/api";

export default function FeedPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const loadFeed = async () => {
        try {
            const [me, feed] = await Promise.all([
                userApi.me(),
                postApi.feed(),
            ]);

            setUser(me.user);
            setPosts(feed.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!getToken()) {
            router.push("/login");
            return;
        }

        loadFeed();
    }, []);

    return (
        <AppShell>
            <section className="page-header">
                <div>
                    <p className="eyebrow">Feed</p>
                    <h1>Photos from you and your friends</h1>
                </div>
                {user && <span className="status-pill">{user.email}</span>}
            </section>

            <PostComposer onCreated={(post) => setPosts([post, ...posts])} />

            {loading && <p className="muted">Loading feed...</p>}
            {error && <p className="error-text">{error}</p>}

            <section className="post-grid">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </section>
        </AppShell>
    );
}
