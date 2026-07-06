"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi, setToken } from "../lib/api";

export default function AuthForm({ mode }) {
    const router = useRouter();
    const isRegister = mode === "register";
    const [form, setForm] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const updateField = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const payload = isRegister
                ? form
                : {
                    email: form.email,
                    password: form.password,
                };
            const data = await authApi[mode](payload);

            setToken(data.token);
            router.push("/");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-page">
            <form className="auth-card" onSubmit={submit}>
                <div>
                    <p className="eyebrow">Socially</p>
                    <h1>{isRegister ? "Create account" : "Welcome back"}</h1>
                </div>

                {isRegister && (
                    <>
                        <label>
                            Name
                            <input
                                name="name"
                                onChange={updateField}
                                placeholder="Aarav Sharma"
                                value={form.name}
                            />
                        </label>

                        <label>
                            Username
                            <input
                                name="username"
                                onChange={updateField}
                                placeholder="aarav"
                                value={form.username}
                            />
                        </label>
                    </>
                )}

                <label>
                    Email
                    <input
                        name="email"
                        onChange={updateField}
                        placeholder="you@example.com"
                        required
                        type="email"
                        value={form.email}
                    />
                </label>

                <label>
                    Password
                    <input
                        name="password"
                        onChange={updateField}
                        placeholder="Minimum 6 characters"
                        required
                        type="password"
                        value={form.password}
                    />
                </label>

                {error && <p className="error-text">{error}</p>}

                <button className="primary-button" disabled={loading}>
                    {loading
                        ? "Please wait..."
                        : isRegister
                            ? "Register"
                            : "Login"}
                </button>

                <p className="muted">
                    {isRegister ? "Already have an account?" : "New here?"}{" "}
                    <Link href={isRegister ? "/login" : "/register"}>
                        {isRegister ? "Login" : "Create one"}
                    </Link>
                </p>
            </form>
        </section>
    );
}
