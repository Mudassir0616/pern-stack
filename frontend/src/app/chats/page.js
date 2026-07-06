"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { chatApi, getToken, userApi } from "../../lib/api";

const displayName = (user) =>
    user?.name || user?.username || user?.email || `User ${user?.id || ""}`;

const avatarLetter = (user) =>
    displayName(user).charAt(0).toUpperCase();

const formatMessageTime = (value) => {
    if (!value) return "";

    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
};

export default function ChatsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [activeReceiver, setActiveReceiver] = useState(null);
    const [content, setContent] = useState("");
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const getOtherUser = (chat) =>
        chat?.senderId === user?.id ? chat.receiver : chat.sender;

    const loadMessages = async (chatId) => {
        const data = await chatApi.messages(chatId);
        setMessages(data.data || []);
    };

    const selectChat = async (chat) => {
        const otherUser = getOtherUser(chat);

        setError("");
        setActiveChatId(chat.id);
        setActiveReceiver(otherUser);
        await loadMessages(chat.id);
    };

    const loadChats = async (preferredChatId) => {
        const data = await chatApi.list();
        const nextChats = data.data || [];

        setChats(nextChats);

        const nextActive =
            nextChats.find((chat) => chat.id === preferredChatId) ||
            nextChats.find((chat) => chat.id === activeChatId) ||
            nextChats[0];

        if (nextActive) {
            await selectChat(nextActive);
        } else {
            setMessages([]);
            setActiveChatId(null);
            setActiveReceiver(null);
        }
    };

    const loadPage = async () => {
        try {
            const me = await userApi.me();
            setUser(me.user);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!getToken()) {
            router.push("/login");
            return;
        }

        loadPage();
    }, []);

    useEffect(() => {
        if (!user) return;

        loadChats().catch((err) => setError(err.message)).finally(() => {
            setLoading(false);
        });
    }, [user]);

    const searchUsers = async (event) => {
        event.preventDefault();
        setError("");

        try {
            const data = await userApi.search(search);
            setUsers((data.data || []).filter((item) => item.id !== user?.id));
        } catch (err) {
            setError(err.message);
        }
    };

    const startChat = (selectedUser) => {
        const existingChat = chats.find((chat) => {
            const otherUser = getOtherUser(chat);

            return otherUser?.id === selectedUser.id;
        });

        setError("");
        setActiveReceiver(selectedUser);
        setContent("");

        if (existingChat) {
            selectChat(existingChat);
            return;
        }

        setActiveChatId(null);
        setMessages([]);
    };

    const sendMessage = async (event) => {
        event.preventDefault();

        if (!activeReceiver || !content.trim()) return;

        setSending(true);
        setError("");

        try {
            const data = await chatApi.send({
                receiverId: activeReceiver.id,
                content,
            });

            setContent("");
            setMessages((current) => [...current, data.message]);
            await loadChats(data.chatId);
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <AppShell>
            <section className="page-header">
                <div>
                    <p className="eyebrow">Chats</p>
                    <h1>Messages</h1>
                </div>
                <span className="status-pill">{chats.length} conversations</span>
            </section>

            {error && <p className="error-text">{error}</p>}

            <section className="chat-layout">
                <aside className="panel chat-sidebar">
                    <div className="section-heading">
                        <h2>Conversations</h2>
                    </div>

                    {loading && <p className="muted">Loading chats...</p>}
                    {!loading && chats.length === 0 && (
                        <p className="muted">No conversations yet.</p>
                    )}

                    <div className="chat-list">
                        {chats.map((chat) => {
                            const otherUser = getOtherUser(chat);
                            const latest = chat.messages?.[0];

                            return (
                                <button
                                    className={
                                        activeChatId === chat.id
                                            ? "chat-item active"
                                            : "chat-item"
                                    }
                                    key={chat.id}
                                    onClick={() => selectChat(chat)}
                                    type="button"
                                >
                                    <span className="avatar">
                                        {otherUser?.avatar ? (
                                            <img alt="" src={otherUser.avatar} />
                                        ) : (
                                            <span>{avatarLetter(otherUser)}</span>
                                        )}
                                    </span>

                                    <span>
                                        <strong>{displayName(otherUser)}</strong>
                                        <small>
                                            {latest?.message || "New conversation"}
                                        </small>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <form className="chat-search" onSubmit={searchUsers}>
                        <input
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search people"
                            value={search}
                        />
                        <button className="primary-button small">Search</button>
                    </form>

                    <div className="chat-list">
                        {users.map((item) => (
                            <button
                                className="chat-item"
                                key={item.id}
                                onClick={() => startChat(item)}
                                type="button"
                            >
                                <span className="avatar">
                                    {item.avatar ? (
                                        <img alt="" src={item.avatar} />
                                    ) : (
                                        <span>{avatarLetter(item)}</span>
                                    )}
                                </span>

                                <span>
                                    <strong>{displayName(item)}</strong>
                                    <small>@{item.username || `user${item.id}`}</small>
                                </span>
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="panel chat-panel">
                    {activeReceiver ? (
                        <>
                            <div className="chat-header">
                                <div className="avatar">
                                    {activeReceiver.avatar ? (
                                        <img alt="" src={activeReceiver.avatar} />
                                    ) : (
                                        <span>{avatarLetter(activeReceiver)}</span>
                                    )}
                                </div>

                                <div>
                                    <h2>{displayName(activeReceiver)}</h2>
                                    <p>@{activeReceiver.username || `user${activeReceiver.id}`}</p>
                                </div>
                            </div>

                            <div className="message-list">
                                {messages.length === 0 && (
                                    <p className="muted">Send the first message.</p>
                                )}

                                {messages.map((message) => {
                                    const isMine = message.senderId === user?.id;

                                    return (
                                        <article
                                            className={
                                                isMine
                                                    ? "message-bubble mine"
                                                    : "message-bubble"
                                            }
                                            key={message.id}
                                        >
                                            <p>{message.message}</p>
                                            <time>{formatMessageTime(message.createdAt)}</time>
                                        </article>
                                    );
                                })}
                            </div>

                            <form className="message-form" onSubmit={sendMessage}>
                                <input
                                    onChange={(event) => setContent(event.target.value)}
                                    placeholder="Write a message"
                                    value={content}
                                />
                                <button
                                    className="primary-button"
                                    disabled={sending || !content.trim()}
                                >
                                    {sending ? "Sending" : "Send"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="empty-chat">
                            <h2>Select a conversation</h2>
                            <p className="muted">
                                Choose an existing chat or search for someone to start one.
                            </p>
                        </div>
                    )}
                </section>
            </section>
        </AppShell>
    );
}
