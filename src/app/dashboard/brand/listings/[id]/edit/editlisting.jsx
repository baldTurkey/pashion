"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import mpform from "@/components/mpform.jsx";
import { supabaseBrowser } from "../../../../../../lib/supabase/client.ts";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One size"];
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
    <div className="mpform-field-label">
      <span className="mpform-field-number">{number}</span>
      <label>
        {children}
        {required && <span className="mpform-required">*</span>}
      </label>
    </div>
  );
}

function ErrorText({ children }) {
  return <div className="mpform-error">{children}</div>;
}

async function uploadFile(file, folder) {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error: uploadError } = await supabaseBrowser.storage
    .from("listing-photos")
    .upload(path, file);

  if (uploadError) throw uploadError;

  const { data } = supabaseBrowser.storage
    .from("listing-photos")
    .getPublicUrl(path);
  return data.publicUrl;
}

// Given the SIZES/STYLES chip lists, figure out whether the listing's
// existing value is one of the presets or a custom one-off value.
function splitPreset(value, presets) {
  if (!value) return { preset: "", custom: "" };
  return presets.includes(value)
    ? { preset: value, custom: "" }
    : { preset: "", custom: value };
}

export default function EditListingForm({ listing }) {
  const router = useRouter();

  const initialSize = splitPreset(listing.size, SIZES);
  const initialStyle = splitPreset(listing.style, STYLES);

  const [imagePreviewUrl, setImagePreviewUrl] = useState(listing.imageUrl || null);
  const [newImageFile, setNewImageFile] = useState(null);

  const [itemName, setItemName] = useState(listing.name || "");
  const [price, setPrice] = useState(
    listing.currentPrice != null ? String(listing.currentPrice) : ""
  );
  const [description, setDescription] = useState(listing.description || "");
  const [size, setSize] = useState(initialSize.preset);
  const [customSize, setCustomSize] = useState(initialSize.custom);

  const [sizeGuideUrl, setSizeGuideUrl] = useState(listing.size_guide_url || null);
  const [newSizeGuideFile, setNewSizeGuideFile] = useState(null);
  const [sizeGuidePreview, setSizeGuidePreview] = useState(null);

  const [style, setStyle] = useState(
    initialStyle.preset || (initialStyle.custom ? "Other" : "")
  );
  const [customStyle, setCustomStyle] = useState(initialStyle.custom);

  const [careInfo, setCareInfo] = useState(listing.care_info || "");
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fileInputRef = useRef(null);
  const guideInputRef = useRef(null);

  const handleNewPhoto = (fileList) => {
    const file = fileList && fileList[0];
    if (!file || !file.type.startsWith("image/")) return;
    setNewImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleNewPhoto(e.dataTransfer.files);
  };

  const handleSizeGuide = (fileList) => {
    const file = fileList && fileList[0];
    if (!file) return;
    setNewSizeGuideFile(file);
    setSizeGuidePreview(
      file.type.startsWith("image/") ? URL.createObjectURL(file) : null
    );
  };

  const validate = () => {
    const e = {};
    if (!itemName.trim()) e.itemName = "Enter an item name.";
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0)
      e.price = "Enter a valid price.";
    if (!description.trim()) e.description = "Add a description.";
    if (!size && !customSize.trim()) e.size = "Choose or enter a size.";
    if (!style && !customStyle.trim()) e.style = "Choose or enter a style.";
    if (!careInfo.trim()) e.careInfo = "Add care and info details.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSaving(true);
    try {
      let imageUrl = listing.imageUrl || null;
      if (newImageFile) {
        imageUrl = await uploadFile(newImageFile, "photos");
      }

      let finalSizeGuideUrl = sizeGuideUrl;
      if (newSizeGuideFile) {
        finalSizeGuideUrl = await uploadFile(newSizeGuideFile, "size-guides");
      }

      const { data: { user }, error: userErr } = await supabaseBrowser.auth.getUser();
      console.log("AUTH CHECK — user:", user, "error:", userErr);

      const { data: updatedRows, error: updateError } = await supabaseBrowser
        .from("products")
        .update({
          imageUrl,
          name: itemName.trim(),
          currentPrice: price.toString(),
          description: description.trim(),
          size: size || customSize.trim(),
          style: style === "Other" ? customStyle.trim() : style,
          care_info: careInfo.trim(),
          size_guide_url: finalSizeGuideUrl,
        })
        .eq("id", listing.id)
        .select();

      if (updateError) throw updateError;

      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("No row was updated — check RLS policy or id match.");
      }

      router.push(`/dashboard/brand/listings/${listing.id}`);
      router.refresh();
    } catch (err) {
      console.error(
        "Failed to update listing:",
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
    <div className="mpform-root">
      <div className="mpform-header">
        <h1 className="mpform-title">Edit Listing</h1>
        <p className="mpform-subtitle">
          Update the details below, then save your changes.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* photo */}
        <div className="mpform-section">
          <FieldLabel number="01" required>
            Photo of the item
          </FieldLabel>
          <p className="mpform-helper">
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
            className={`mpform-dropzone ${dragActive ? "active" : ""}`}
          >
            <div className="mpform-dropzone-title">
              Drop a photo here or click to browse
            </div>
            <div className="mpform-dropzone-sub">JPG or PNG</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                handleNewPhoto(e.target.files);
                e.target.value = "";
              }}
              className="mpform-hidden-input"
            />
          </div>

          {imagePreviewUrl && (
            <div className="mpform-thumb-grid">
              <div className="mpform-thumb">
                <img src={imagePreviewUrl} alt="Item photo" />
                <span className="mpform-thumb-cover">Current</span>
              </div>
            </div>
          )}
        </div>

        <div className="mpform-section">
          <FieldLabel number="02" required>
            Item name
          </FieldLabel>
          <input
            className="mpform-input"
            placeholder="Wool blend overcoat"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          {errors.itemName && <ErrorText>{errors.itemName}</ErrorText>}

          <div className="mpform-spacer" />

          <FieldLabel number="03" required>
            Price
          </FieldLabel>
          <div className="mpform-price-wrap">
            <span className="mpform-price-sign">$</span>
            <input
              className="mpform-input mpform-price-input"
              placeholder="0.00"
              inputMode="decimal"
              value={price}
              onChange={(e) => {
                const v = e.target.value;
                if (/^\d*\.?\d{0,2}$/.test(v)) setPrice(v);
              }}
            />
          </div>
          {errors.price && <ErrorText>{errors.price}</ErrorText>}
        </div>

        <div className="mpform-section">
          <FieldLabel number="04" required>
            Description
          </FieldLabel>
          <textarea
            className="mpform-textarea tall"
            placeholder="Describe the fit, fabric, condition, and anything a buyer should know."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {errors.description && <ErrorText>{errors.description}</ErrorText>}
        </div>

        <div className="mpform-section">
          <FieldLabel number="05" required>
            Size
          </FieldLabel>
          <div className="mpform-size-chips">
            {SIZES.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => {
                  setSize(s);
                  setCustomSize("");
                }}
                className={`mpform-size-chip ${size === s ? "selected" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>

          <input
            className="mpform-input"
            placeholder="Or type an exact size / measurement"
            value={customSize}
            onChange={(e) => {
              setCustomSize(e.target.value);
              if (e.target.value) setSize("");
            }}
          />
          {errors.size && <ErrorText>{errors.size}</ErrorText>}

          <div className="mpform-spacer" />

          <FieldLabel number="06">Size guide</FieldLabel>
          <div
            onClick={() => guideInputRef.current?.click()}
            className="mpform-guide-upload"
          >
            <div className="mpform-guide-name">
              {newSizeGuideFile
                ? newSizeGuideFile.name
                : sizeGuideUrl
                ? "Current size guide on file"
                : "Upload a size chart image or PDF"}
            </div>
            <span className="mpform-guide-action">
              {sizeGuideUrl || newSizeGuideFile ? "Replace" : "Browse"}
            </span>
            <input
              ref={guideInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleSizeGuide(e.target.files)}
              className="mpform-hidden-input"
            />
          </div>
          {(sizeGuidePreview || (!newSizeGuideFile && sizeGuideUrl)) && (
            <img
              src={sizeGuidePreview || sizeGuideUrl}
              alt="Size guide preview"
              className="mpform-guide-preview"
            />
          )}
        </div>

        <div className="mpform-section">
          <FieldLabel number="07" required>
            Style
          </FieldLabel>
          <select
            className="mpform-select"
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
              className="mpform-input"
              style={{ marginTop: 10 }}
              placeholder="Describe the style"
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
            />
          )}
          {errors.style && <ErrorText>{errors.style}</ErrorText>}
        </div>

        <div className="mpform-section">
          <FieldLabel number="08" required>
            Care and info
          </FieldLabel>
          <textarea
            className="mpform-textarea short"
            placeholder="Machine wash cold, tumble dry low, do not bleach..."
            value={careInfo}
            onChange={(e) => setCareInfo(e.target.value)}
          />
          {errors.careInfo && <ErrorText>{errors.careInfo}</ErrorText>}
        </div>

        {submitError && (
          <div className="mpform-error" style={{ marginBottom: 16 }}>
            {submitError}
          </div>
        )}
        <button type="submit" className="mpform-submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}