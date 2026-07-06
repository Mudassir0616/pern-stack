"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import PostCard from "../../components/PostCard";
import { getToken, postApi, userApi } from "../../lib/api";

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [form, setForm] = useState({
        name: "",
        username: "",
        bio: "",
    });
    const [avatar, setAvatar] = useState(null);
    const [message, setMessage] = useState("");

    const loadProfile = async () => {
        const [me, mine] = await Promise.all([
            userApi.me(),
            postApi.mine(),
        ]);

        setUser(me.user);
        setPosts(mine.data || []);
        setForm({
            name: me.user?.name || "",
            username: me.user?.username || "",
            bio: me.user?.bio || "",
        });
    };

    useEffect(() => {
        if (!getToken()) {
            router.push("/login");
            return;
        }

        loadProfile();
    }, []);

    const updateField = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    };

    const saveProfile = async (event) => {
        event.preventDefault();
        setMessage("");

        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("username", form.username);
        formData.append("bio", form.bio);

        if (avatar) {
            formData.append("avatar", avatar);
        }

        const data = await userApi.updateMe(formData);
        setUser(data.user);
        setMessage("Profile saved.");
    };

    const removePost = (postId) => {
        setPosts(posts.filter((post) => post.id !== postId));
    };

    return (
        <AppShell>
            <section className="page-header">
                <div>
                    <p className="eyebrow">Profile</p>
                    <h1>{user?.name || "Your profile"}</h1>
                </div>
                <span className="status-pill">
                    {user?._count?.posts || 0} posts
                </span>
            </section>

            <section className="profile-layout">
                <form className="panel" onSubmit={saveProfile}>
                    <div className="section-heading">
                        <h2>Edit profile</h2>
                    </div>

                    <label>
                        Name
                        <input
                            name="name"
                            onChange={updateField}
                            value={form.name}
                        />
                    </label>

                    <label>
                        Username
                        <input
                            name="username"
                            onChange={updateField}
                            value={form.username}
                        />
                    </label>

                    <label>
                        Bio
                        <textarea
                            name="bio"
                            onChange={updateField}
                            value={form.bio}
                        />
                    </label>

                    <label className="file-button">
                        Avatar
                        <input
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={(event) => setAvatar(event.target.files?.[0])}
                            type="file"
                        />
                    </label>

                    <button className="primary-button">Save profile</button>
                    {message && <p className="muted">{message}</p>}
                </form>

                <div className="post-grid compact">
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            onDeleted={removePost}
                            post={post}
                        />
                    ))}
                </div>
            </section>
        </AppShell>
    );
}
