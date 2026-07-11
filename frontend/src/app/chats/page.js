"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AppShell from "../../components/AppShell";
import { chatApi, getToken, userApi } from "../../lib/api";
import { useSocket } from "../../components/SocketProvider";

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
    const socket = useSocket();

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


    // Mirror the latest state so our single socket listener can read current
    // values instead of the ones captured when it was attached.
    const activeChatIdRef = useRef(null);
    const chatsRef = useRef([]);

    useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);
    useEffect(() => { chatsRef.current = chats; }, [chats]);

    const getOtherUser = (chat) =>
        chat?.senderId === user?.id ? chat.receiver : chat.sender;

    const loadMessages = async (chatId) => {
        const data = await chatApi.messages(chatId);
        setMessages(data.data || []);
    };

    const refreshSidebar = async () => {
        try {
            const data = await chatApi.list();
            setChats(data.data || []);
        } catch (err) {
            setError(err.message);
        }
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

    useEffect(() => {
        if (!socket) return; // provider might still be connecting

        // Server emits this to BOTH participants after saving. Shape matches the
        // backend emit: { chatId, message }.
        const handleNewMessage = ({ chatId, message }) => {
            // (a) If it belongs to the chat open on screen, append it live.
            //     Dedupe by id: the sender already added it optimistically on send,
            //     AND the server echoes it back to the sender too — without this
            //     guard they'd see their own message twice.
            if (chatId === activeChatIdRef.current) {
                setMessages((current) =>
                    current.some((m) => m.id === message.id)
                        ? current
                        : [...current, message]
                );
            }

            // (b) Update the sidebar preview + move that chat to the top.
            const known = chatsRef.current.some((c) => c.id === chatId);
            if (!known) {
                // A conversation we don't have yet (someone messaged us for the
                // first time) → pull the fresh list so it shows up.
                refreshSidebar();
                return;
            }
            setChats((current) => {
                const target = current.find((c) => c.id === chatId);
                const rest = current.filter((c) => c.id !== chatId);
                return [{ ...target, messages: [message] }, ...rest];
            });
        };

        // After a dropped connection reconnects, we may have missed messages while
        // offline — refetch the list and the open chat to catch up.
        const handleReconnect = () => {
            refreshSidebar();
            if (activeChatIdRef.current) loadMessages(activeChatIdRef.current);
        };

        socket.on("new-message", handleNewMessage);
        socket.on("connect", handleReconnect);

        // Remove listeners on cleanup, or each re-run stacks another copy and you
        // get duplicated messages.
        return () => {
            socket.off("new-message", handleNewMessage);
            socket.off("connect", handleReconnect);
        };
    }, [socket]); // only re-subscribe if the socket instance itself changes

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
            // Ensure the active chat id is set — important when this was a NEW
            // conversation (activeChatId was null until the server created it).
            setActiveChatId(data.chatId);

            // Optimistic append so your own message shows instantly. Deduped by id,
            // so the server's echo (step 4a) is ignored rather than doubling it.
            setMessages((current) =>
                current.some((m) => m.id === data.message.id)
                    ? current
                    : [...current, data.message]
            );

            // Refresh the list preview + ordering (not the open chat's messages).
            await refreshSidebar();

        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    console.log('socket', socket)

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
