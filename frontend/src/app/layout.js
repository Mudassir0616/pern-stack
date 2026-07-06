import "../styles/global.scss";

export const metadata = {
    title: "Socially",
    description: "Small social media frontend for the Express API",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
