"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, getToken } from "../lib/api";

const links = [
    { href: "/", label: "Feed" },
    { href: "/profile", label: "Profile" },
    { href: "/friends", label: "Friends" },
    { href: "/chats", label: "Chats" },
];

export default function AppShell({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const hasToken = getToken();

    const logout = () => {
        clearToken();
        router.push("/login");
    };

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <Link className="brand" href="/">
                    Socially
                </Link>

                <nav className="nav-list">
                    {links.map((link) => (
                        <Link
                            className={pathname === link.href ? "active" : ""}
                            href={link.href}
                            key={link.href}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {hasToken ? (
                    <button className="ghost-button" onClick={logout}>
                        Logout
                    </button>
                ) : (
                    <Link className="primary-button" href="/login">
                        Login
                    </Link>
                )}
            </aside>

            <main className="main-content">{children}</main>
        </div>
    );
}
