"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import "@/components/CreateShowForm.css";
import { supabaseBrowser } from "@/lib/supabase/client";

const CATEGORIES = [
  "Outerwear",
  "Shirts",
  "Bottoms",
  "Accessories",
  "Dresses",
  "Footwear",
  "Other",
];

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

  const { error: uploadError } = await supabaseBrowser.storage
    .from("show-photos")
    .upload(path, file);

  if (uploadError) throw uploadError;

  const { data } = supabaseBrowser.storage
    .from("show-photos")
    .getPublicUrl(path);

  return data.publicUrl;
}

export default function EditShowForm({ show }) {
  const router = useRouter();

  /*
   * Determine whether the existing category/style
   * is one of the preset options or a custom value.
   */
  const initialCategory = CATEGORIES.includes(show.category)
    ? show.category
    : show.category
      ? "Other"
      : "";

  const initialCustomCategory = CATEGORIES.includes(show.category)
    ? ""
    : show.category || "";

  const initialStyle = STYLES.includes(show.style)
    ? show.style
    : show.style
      ? "Other"
      : "";

  const initialCustomStyle = STYLES.includes(show.style)
    ? ""
    : show.style || "";

  const [imagePreviewUrl, setImagePreviewUrl] = useState(
    show.image || null
  );

  const [newImageFile, setNewImageFile] = useState(null);

  const [itemName, setItemName] = useState(show.name || "");

  const [quantity, setQuantity] = useState(
    show.quantity != null ? String(show.quantity) : ""
  );

  const [category, setCategory] = useState(initialCategory);
  const [customCategory, setCustomCategory] = useState(
    initialCustomCategory
  );

  const [style, setStyle] = useState(initialStyle);
  const [customStyle, setCustomStyle] = useState(initialCustomStyle);

  const [startDate, setStartDate] = useState(show.startDate || "");
  const [endDate, setEndDate] = useState(show.endDate || "");

  const [eventDescription, setEventDescription] = useState(
    show.eventDiscription || ""
  );

  const [materials, setMaterials] = useState(show.materials || "");

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fileInputRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);

  /*
   * Replace the existing photo.
   */
  const handleNewPhoto = (fileList) => {
    const file = fileList && fileList[0];

    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    setNewImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    handleNewPhoto(e.dataTransfer.files);
  };

  /*
   * Validate form before saving.
   */
  const validate = () => {
    const e = {};

    if (!itemName.trim()) {
      e.itemName = "Enter an item name.";
    }

    if (
      !quantity.toString().trim() ||
      isNaN(Number(quantity)) ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      e.quantity = "Enter a valid quantity.";
    }

    if (!category && !customCategory.trim()) {
      e.category = "Choose or enter a category.";
    }

    if (!style && !customStyle.trim()) {
      e.style = "Choose or enter a style.";
    }

    if (!startDate) {
      e.startDate = "Choose a start date.";
    }

    if (!endDate) {
      e.endDate = "Choose an end date.";
    }

    if (startDate && endDate && endDate < startDate) {
      e.endDate = "End date can't be before the start date.";
    }

    if (!eventDescription.trim()) {
      e.eventDescription = "Add an event description.";
    }

    if (!materials.trim()) {
      e.materials = "Add the materials used.";
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  /*
   * Save the edited show.
   */
  const handleSubmit = async (ev) => {
    ev.preventDefault();

    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {

      let imageUrl = show.image || null;

      if (newImageFile) {
        imageUrl = await uploadFile(newImageFile, "photos");
      }

      const finalCategory =
        category === "Other"
          ? customCategory.trim()
          : category;

      const finalStyle =
        style === "Other"
          ? customStyle.trim()
          : style;

      const { data: updatedRows, error: updateError } = await supabaseBrowser
        .from("shows")
        .update({
          name: itemName.trim(),
          image: imageUrl,
          quantity: Number(quantity),
          category: finalCategory,
          style: finalStyle,
          startDate: startDate,
          endDate: endDate,
          eventDiscription: eventDescription.trim(),
          materials: materials.trim(),
        })
        .eq("id", show.id)
        .select();

      if (updateError) {
        throw updateError;
      }

      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("No row was updated — check RLS policy or id match.");
      }

      router.push(`/dashboard/brand/shows/${show.id}`);
      router.refresh();
    } catch (err) {
      console.error(
        "Failed to update show:",
        err?.message,
        err?.details,
        err?.hint,
        err?.code
      );

      setSubmitError(
        "Uh oh.. Something went wrong while saving. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="csform-root">
      <div className="csform-header">
        <h1 className="csform-title">Edit Show</h1>

        <p className="csform-subtitle">
          Update the details below, then save your changes.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* pic */}
        <div className="csform-section">
          <FieldLabel number="01" required>
            Item images
          </FieldLabel>

          <p className="csform-helper">
            Click or drop a new photo to replace the current one
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`csform-dropzone ${
              dragActive ? "active" : ""
            }`}
          >
            <div className="csform-dropzone-title">
              Drop a photo here or click to browse
            </div>

            <div className="csform-dropzone-sub">
              JPG or PNG
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                handleNewPhoto(e.target.files);
                e.target.value = "";
              }}
              className="csform-hidden-input"
            />
          </div>

          {imagePreviewUrl && (
            <div className="csform-thumb-grid">
              <div className="csform-thumb">
                <img
                  src={imagePreviewUrl}
                  alt="Show item"
                />

                <span className="csform-thumb-cover">
                  Current
                </span>
              </div>
            </div>
          )}
        </div>

        {/* name */}
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

          {errors.itemName && (
            <ErrorText>{errors.itemName}</ErrorText>
          )}
        </div>

        {/* quant */}
        <div className="csform-section">
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

          {errors.quantity && (
            <ErrorText>{errors.quantity}</ErrorText>
          )}
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

                  if (c !== "Other") {
                    setCustomCategory("");
                  }
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
              onChange={(e) =>
                setCustomCategory(e.target.value)
              }
            />
          )}

          {errors.category && (
            <ErrorText>{errors.category}</ErrorText>
          )}
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

              if (e.target.value !== "Other") {
                setCustomStyle("");
              }
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
              onChange={(e) =>
                setCustomStyle(e.target.value)
              }
            />
          )}

          {errors.style && (
            <ErrorText>{errors.style}</ErrorText>
          )}
        </div>

        {/* start dtae */}
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

          {errors.startDate && (
            <ErrorText>{errors.startDate}</ErrorText>
          )}

          <div className="csform-spacer" />

          {/* ens date */}
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

          {errors.endDate && (
            <ErrorText>{errors.endDate}</ErrorText>
          )}
        </div>

        {/* discrption */}
        <div className="csform-section">
          <FieldLabel number="08" required>
            Event description
          </FieldLabel>

          <textarea
            className="csform-textarea tall"
            placeholder="Describe the show, what to expect, and any details attendees should know."
            value={eventDescription}
            onChange={(e) =>
              setEventDescription(e.target.value)
            }
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

          {errors.materials && (
            <ErrorText>{errors.materials}</ErrorText>
          )}
        </div>

        {/* errorrr */}
        {submitError && (
          <div
            className="csform-error"
            style={{ marginBottom: 16 }}
          >
            {submitError}
          </div>
        )}

        {/* save */}
        <button
          type="submit"
          className="csform-submit"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}