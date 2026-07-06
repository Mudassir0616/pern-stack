"use client";

import { useEffect, useState } from "react";
import { friendApi } from "../lib/api";

export default function FriendRequests() {
    const [requests, setRequests] = useState({
        received: [],
        sent: [],
    });

    const loadRequests = async () => {
        const data = await friendApi.requests();
        setRequests(data);
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const respond = async (requestId, action) => {
        await friendApi.respond(requestId, action);
        loadRequests();
    };

    return (
        <section className="panel">
            <div className="section-heading">
                <h2>Requests</h2>
            </div>

            <div className="split-list">
                <div>
                    <h3>Received</h3>
                    {requests.received.length === 0 && (
                        <p className="muted">No pending requests.</p>
                    )}

                    {requests.received.map((request) => (
                        <div className="user-row" key={request.id}>
                            <div>
                                <strong>{request.sender.name || "User"}</strong>
                                <p>@{request.sender.username || `user${request.sender.id}`}</p>
                            </div>

                            <div className="button-pair">
                                <button
                                    className="primary-button small"
                                    onClick={() => respond(request.id, "accept")}
                                >
                                    Accept
                                </button>
                                <button
                                    className="ghost-button small"
                                    onClick={() => respond(request.id, "reject")}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div>
                    <h3>Sent</h3>
                    {requests.sent.length === 0 && (
                        <p className="muted">No sent requests.</p>
                    )}

                    {requests.sent.map((request) => (
                        <div className="user-row" key={request.id}>
                            <div>
                                <strong>{request.receiver.name || "User"}</strong>
                                <p>@{request.receiver.username || `user${request.receiver.id}`}</p>
                            </div>
                            <span className="status-pill">Pending</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
