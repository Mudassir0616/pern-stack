"use client";

import { useState } from "react";
import { friendApi, userApi } from "../lib/api";

export default function UserSearch() {
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");

    const submit = async (event) => {
        event.preventDefault();
        setMessage("");

        const result = await userApi.search(search);
        setUsers(result.data || []);
    };

    const sendRequest = async (userId) => {
        try {
            await friendApi.send(userId);
            setMessage("Friend request sent.");
        } catch (err) {
            setMessage(err.message);
        }
    };

    return (
        <section className="panel">
            <div className="section-heading">
                <h2>Find people</h2>
            </div>

            <form className="search-row" onSubmit={submit}>
                <input
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name or username"
                    value={search}
                />
                <button className="primary-button">Search</button>
            </form>

            {message && <p className="muted">{message}</p>}

            <div className="user-list">
                {users.map((user) => (
                    <div className="user-row" key={user.id}>
                        <div className="avatar">
                            {user.avatar ? (
                                <img alt="" src={user.avatar} />
                            ) : (
                                <span>
                                    {(user.name || user.email || "U")
                                        .charAt(0)
                                        .toUpperCase()}
                                </span>
                            )}
                        </div>

                        <div>
                            <strong>{user.name || "Unnamed user"}</strong>
                            <p>@{user.username || `user${user.id}`}</p>
                        </div>

                        <button
                            className="ghost-button small"
                            onClick={() => sendRequest(user.id)}
                        >
                            Add
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
