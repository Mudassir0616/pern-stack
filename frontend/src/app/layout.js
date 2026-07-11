"use client";
import { useEffect, useState } from "react";
import { SocketProvider } from "../components/SocketProvider";
import "../styles/global.scss";


export default function RootLayout({ children }) {
    const [token, settoken] = useState(null)


    useEffect(() => {
        if (window && window !== undefined) {
            const tk = localStorage.getItem("social_token");
            settoken(tk)
        }
    }, [])

    return (
        <html lang="en">
            <body>
                <SocketProvider token={token}>
                    {children}
                </SocketProvider></body>
        </html>
    );
}
