"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import FriendRequests from "../../components/FriendRequests";
import UserSearch from "../../components/UserSearch";
import { friendApi, getToken } from "../../lib/api";

export default function FriendsPage() {
    const router = useRouter();
    const [friends, setFriends] = useState([]);

    const loadFriends = async () => {
        const data = await friendApi.list();
        setFriends(data.data || []);
    };

    useEffect(() => {
        if (!getToken()) {
            router.push("/login");
            return;
        }

        loadFriends();
    }, []);

    const removeFriend = async (userId) => {
        await friendApi.remove(userId);
        setFriends(friends.filter((friend) => friend.id !== userId));
    };

    return (
        <AppShell>
            <section className="page-header">
                <div>
                    <p className="eyebrow">Friends</p>
                    <h1>Manage your social circle</h1>
                </div>
                <span className="status-pill">{friends.length} friends</span>
            </section>

            <section className="friends-layout">
                <div className="panel">
                    <div className="section-heading">
                        <h2>Your friends</h2>
                    </div>

                    {friends.length === 0 && (
                        <p className="muted">No friends yet.</p>
                    )}

                    <div className="user-list">
                        {friends.map((friend) => (
                            <div className="user-row" key={friend.id}>
                                <div className="avatar">
                                    {friend.avatar ? (
                                        <img alt="" src={friend.avatar} />
                                    ) : (
                                        <span>
                                            {(friend.name || "U")
                                                .charAt(0)
                                                .toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <strong>{friend.name || "User"}</strong>
                                    <p>@{friend.username || `user${friend.id}`}</p>
                                </div>

                                <button
                                    className="ghost-button small"
                                    onClick={() => removeFriend(friend.id)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <FriendRequests />
                <UserSearch />
            </section>
        </AppShell>
    );
}
