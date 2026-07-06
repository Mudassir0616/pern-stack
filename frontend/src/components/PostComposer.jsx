"use client";

import { useState } from "react";
import { postApi } from "../lib/api";

export default function PostComposer({ onCreated }) {
    const [caption, setCaption] = useState("");
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const selectImage = (event) => {
        const file = event.target.files?.[0];
        setImage(file || null);
        setPreview(file ? URL.createObjectURL(file) : "");
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");

        if (!image) {
            setError("Choose an image first.");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("image", image);
            formData.append("caption", caption);

            const data = await postApi.create(formData);
            setCaption("");
            setImage(null);
            setPreview("");
            onCreated?.(data.post);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="composer" onSubmit={submit}>
            <div className="composer-top">
                <textarea
                    onChange={(event) => setCaption(event.target.value)}
                    placeholder="Write a caption..."
                    value={caption}
                />
                {preview && (
                    <img
                        alt="Selected post preview"
                        className="preview-image"
                        src={preview}
                    />
                )}
            </div>

            <div className="composer-actions">
                <label className="file-button">
                    Image
                    <input
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={selectImage}
                        type="file"
                    />
                </label>

                <button className="primary-button" disabled={loading}>
                    {loading ? "Posting..." : "Post"}
                </button>
            </div>

            {error && <p className="error-text">{error}</p>}
        </form>
    );
}
