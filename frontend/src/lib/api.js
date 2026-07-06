"use client";

const API_BASE = "/backend";
const TOKEN_KEY = "social_token";

export const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
};

const apiRequest = async (path, options = {}) => {
    const token = getToken();
    const isFormData = options.body instanceof FormData;

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
};

export const authApi = {
    register: (payload) =>
        apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    login: (payload) =>
        apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
};

export const userApi = {
    me: () => apiRequest("/users/me"),

    updateMe: (formData) =>
        apiRequest("/users/me", {
            method: "PATCH",
            body: formData,
        }),

    search: (search = "") =>
        apiRequest(`/users?search=${encodeURIComponent(search)}`),

    getById: (id) => apiRequest(`/users/${id}`),
};

export const postApi = {
    feed: () => apiRequest("/posts"),

    create: (formData) =>
        apiRequest("/posts", {
            method: "POST",
            body: formData,
        }),

    mine: () => apiRequest("/posts/me"),

    byUser: (userId) => apiRequest(`/posts/user/${userId}`),

    like: (postId) =>
        apiRequest(`/posts/${postId}/like`, {
            method: "POST",
        }),

    unlike: (postId) =>
        apiRequest(`/posts/${postId}/like`, {
            method: "DELETE",
        }),

    delete: (postId) =>
        apiRequest(`/posts/${postId}`, {
            method: "DELETE",
        }),
};

export const friendApi = {
    list: () => apiRequest("/friends"),

    requests: () => apiRequest("/friends/requests"),

    send: (userId) =>
        apiRequest(`/friends/requests/${userId}`, {
            method: "POST",
        }),

    respond: (requestId, action) =>
        apiRequest(`/friends/requests/${requestId}`, {
            method: "PATCH",
            body: JSON.stringify({ action }),
        }),

    remove: (userId) =>
        apiRequest(`/friends/${userId}`, {
            method: "DELETE",
        }),
};

export const chatApi = {
    list: () => apiRequest("/chats"),

    messages: (chatId) => apiRequest(`/chats/messages/${chatId}`),

    send: ({ receiverId, content }) =>
        apiRequest("/chats/send-message", {
            method: "POST",
            body: JSON.stringify({ receiverId, content }),
        }),
};
