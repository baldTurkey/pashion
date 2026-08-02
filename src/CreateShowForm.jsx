"use client";

import React, { useState, useRef } from "react";
import "./CreateShowForm.css";
import { supabaseBrowser } from "./lib/supabase/client.ts";


const MIN_IMAGES = 1;
const MAX_IMAGES = 8;

const CATEGORIES = ["Outerwear", "Shirts", "Bottoms", "Accessories", "Dresses", "Footwear", "Other"];
const STYLES = [
  "Casual",
  "Formal",
  "Streetwear",
  "Vintage",
  "Athleisure",
  "Bohemian",
  "Minimalist",
  "Other",
];

function FieldLabel({ number, children, required }) {
  return (
    <div className="csform-field-label">
      <span className="csform-field-number">{number}</span>
      <label>
        {children}
        {required && <span className="csform-required">*</span>}
      </label>
    </div>
  );
}

function ErrorText({ children }) {
  return <div className="csform-error">{children}</div>;
}

async function uploadFile(file, folder) {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;
  
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  const { error: uploadError } = await supabaseBrowser.storage
    .from("show-photos")
    .upload(path, file);

  if (uploadError) throw uploadError;

  const { data } = supabaseBrowser.storage.from("show-photos").getPublicUrl(path);
  return data.publicUrl;
}

export default function CreateShowForm() {
  const [images, setImages] = useState([]);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [style, setStyle] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [materials, setMaterials] = useState("");

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fileInputRef = useRef(null);

  const resetForm = () => {
    images.forEach((img) => {
      if (img.url) URL.revokeObjectURL(img.url);
    });
    setImages([]);
    setItemName("");
    setQuantity("");
    setCategory("");
    setCustomCategory("");
    setStyle("");
    setCustomStyle("");
    setStartDate("");
    setEndDate("");
    setEventDescription("");
    setMaterials("");
    setErrors({});
    setSubmitted(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addImages = (fileList) => {
    const incoming = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/")
    );
    if (incoming.length === 0) return;
    setImages((prev) => {
      const room = MAX_IMAGES - prev.length;
      const toAdd = incoming.slice(0, Math.max(room, 0)).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      }));
      return [...prev, ...toAdd];
    });
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const removed = prev.find((img) => img.id === id);
      if (removed?.url) {
        URL.revokeObjectURL(removed.url);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    addImages(e.dataTransfer.files);
  };

  const validate = () => {
    const e = {};
    if (images.length < MIN_IMAGES) e.images = "Add at least 1 photo.";
    if (!itemName.trim()) e.itemName = "Enter an item name.";
    if (
      !quantity.toString().trim() ||
      isNaN(Number(quantity)) ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) <= 0
    )
      e.quantity = "Enter a valid quantity.";
    if (!category && !customCategory.trim())
      e.category = "Choose or enter a category.";
    if (!style && !customStyle.trim()) e.style = "Choose or enter a style.";
    if (!startDate) e.startDate = "Choose a start date.";
    if (!endDate) e.endDate = "Choose an end date.";
    if (startDate && endDate && endDate < startDate)
      e.endDate = "End date can't be before the start date.";
    if (!eventDescription.trim())
      e.eventDescription = "Add an event description.";
    if (!materials.trim()) e.materials = "Add the materials used.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      setSubmitted(false);
      return;
    }

    setSaving(true);
    try {
      const photoUrls = await Promise.all(
        images.map((img) => uploadFile(img.file, "photos"))
      );

      const { error: insertError } = await supabaseBrowser
        .from("shows")
        .insert([
          {
            image: photoUrls[0] || null,
            quantity: Number(quantity),
            category: category === "Other" ? customCategory.trim() : category,
            style: style === "Other" ? customStyle.trim() : style,
            startDate: startDate,
            endDate: endDate,
            eventDiscription: eventDescription.trim(),
            materials: materials.trim(),
          },
        ]);

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err) {
      console.error(
        "Failed to publish show:",
        err?.message,
        err?.details,
        err?.hint,
        err?.code
      );
      setSubmitError(
        "Uh oh.. Something went wrong while publishing. Please try again."
      );
      setSubmitted(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="csform-root">
      <div className="csform-header">
        <h1 className="csform-title">Create show</h1>
        <p className="csform-subtitle">
          Add photos and details so people know exactly what's being shown.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* pictures */}
        <div className="csform-section">
          <FieldLabel number="01" required>
            Item images
          </FieldLabel>
          <p className="csform-helper">
            {images.length} of {MAX_IMAGES} added &middot; at least 1 required
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`csform-dropzone ${dragActive ? "active" : ""} ${
              images.length >= MAX_IMAGES ? "full" : ""
            }`}
          >
            <div className="csform-dropzone-title">
              Drop photos here or click to browse
            </div>
            <div className="csform-dropzone-sub">
              JPG or PNG, up to {MAX_IMAGES} photos
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={images.length >= MAX_IMAGES}
              onChange={(e) => {
                addImages(e.target.files);
                e.target.value = "";
              }}
              className="csform-hidden-input"
            />
          </div>

          {images.length > 0 && (
            <div className="csform-thumb-grid">
              {images.map((img, idx) => (
                <div className="csform-thumb" key={img.id}>
                  <img src={img.url} alt={`Item photo ${idx + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    aria-label={`Remove photo ${idx + 1}`}
                    className="csform-thumb-remove"
                  >
                    &times;
                  </button>
                  {idx === 0 && (
                    <span className="csform-thumb-cover">Cover</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {errors.images && <ErrorText>{errors.images}</ErrorText>}
        </div>

        {/* item name */}
        <div className="csform-section">
          <FieldLabel number="02" required>
            Item name
          </FieldLabel>
          <input
            className="csform-input"
            placeholder="Wool blend overcoat"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          {errors.itemName && <ErrorText>{errors.itemName}</ErrorText>}

          <div className="csform-spacer" />

          <FieldLabel number="03" required>
            Quantity
          </FieldLabel>
          <input
            className="csform-input"
            placeholder="1"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          {errors.quantity && <ErrorText>{errors.quantity}</ErrorText>}
        </div>

        {/* category */}
        <div className="csform-section">
          <FieldLabel number="04" required>
            Category
          </FieldLabel>
          <div className="csform-size-chips">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => {
                  setCategory(c);
                  if (c !== "Other") setCustomCategory("");
                }}
                className={`csform-size-chip ${
                  category === c ? "selected" : ""
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {category === "Other" && (
            <input
              className="csform-input"
              style={{ marginTop: 10 }}
              placeholder="Describe the category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          )}
          {errors.category && <ErrorText>{errors.category}</ErrorText>}
        </div>

        {/* style */}
        <div className="csform-section">
          <FieldLabel number="05" required>
            Style
          </FieldLabel>
          <select
            className="csform-select"
            value={style}
            onChange={(e) => {
              setStyle(e.target.value);
              if (e.target.value !== "Other") setCustomStyle("");
            }}
          >
            <option value="">Select a style</option>
            {STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {style === "Other" && (
            <input
              className="csform-input"
              style={{ marginTop: 10 }}
              placeholder="Describe the style"
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
            />
          )}
          {errors.style && <ErrorText>{errors.style}</ErrorText>}
        </div>

        {/* dates */}
        <div className="csform-section">
          <FieldLabel number="06" required>
            Start date
          </FieldLabel>
          <input
            className="csform-input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          {errors.startDate && <ErrorText>{errors.startDate}</ErrorText>}

          <div className="csform-spacer" />

          <FieldLabel number="07" required>
            End date
          </FieldLabel>
          <input
            className="csform-input"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {errors.endDate && <ErrorText>{errors.endDate}</ErrorText>}
        </div>

        {/* event description */}
        <div className="csform-section">
          <FieldLabel number="08" required>
            Event description
          </FieldLabel>
          <textarea
            className="csform-textarea tall"
            placeholder="Describe the show, what to expect, and any details attendees should know."
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
          />
          {errors.eventDescription && (
            <ErrorText>{errors.eventDescription}</ErrorText>
          )}
        </div>

        {/* materials */}
        <div className="csform-section">
          <FieldLabel number="09" required>
            Materials used
          </FieldLabel>
          <textarea
            className="csform-textarea short"
            placeholder="100% cotton, recycled polyester lining..."
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
          />
          {errors.materials && <ErrorText>{errors.materials}</ErrorText>}
        </div>

        {submitError && (
          <div className="csform-error" style={{ marginBottom: 16 }}>
            {submitError}
          </div>
        )}
        <button type="submit" className="csform-submit" disabled={saving}>
          {saving ? "Publishing..." : "Publish show"}
        </button>

        {submitted && (
          <div className="csform-success">
            Show ready — all fields look good.
          </div>
        )}
      </form>
    </div>
  );
}