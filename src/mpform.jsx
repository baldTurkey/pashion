import React, { useState, useRef } from "react";
import "./mpform.css";

const MIN_IMAGES = 1;
const MAX_IMAGES = 8;

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

export default function marketplaceform() {
  const [images, setImages] = useState([]);
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [sizeGuide, setSizeGuide] = useState(null);
  const [style, setStyle] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [careInfo, setCareInfo] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const guideInputRef = useRef(null);

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
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    addImages(e.dataTransfer.files);
  };

  const handleSizeGuide = (fileList) => {
    const file = fileList && fileList[0];
    if (!file) return;
    setSizeGuide({
      file,
      name: file.name,
      isImage: file.type.startsWith("image/"),
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    });
  };

  const validate = () => {
    const e = {};
    if (images.length < MIN_IMAGES) e.images = "Add at least 1 photo.";
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

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (validate()) {
      setSubmitted(true);
    } else {
      setSubmitted(false);
    }
  };

  return (
    <div className="mpform-root">
      <div className="mpform-header">
        <h1 className="mpform-title">List a clothing item</h1>
        <p className="mpform-subtitle">
          Add photos and details so buyers know exactly what they're getting.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Photos */}
        <div className="mpform-section">
          <FieldLabel number="01" required>
            Photos of the item
          </FieldLabel>
          <p className="mpform-helper">
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
            className={`mpform-dropzone ${dragActive ? "active" : ""} ${
              images.length >= MAX_IMAGES ? "full" : ""
            }`}
          >
            <div className="mpform-dropzone-title">
              Drop photos here or click to browse
            </div>
            <div className="mpform-dropzone-sub">
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
              className="mpform-hidden-input"
            />
          </div>

          {images.length > 0 && (
            <div className="mpform-thumb-grid">
              {images.map((img, idx) => (
                <div className="mpform-thumb" key={img.id}>
                  <img src={img.url} alt={`Item photo ${idx + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    aria-label={`Remove photo ${idx + 1}`}
                    className="mpform-thumb-remove"
                  >
                    &times;
                  </button>
                  {idx === 0 && (
                    <span className="mpform-thumb-cover">Cover</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {errors.images && <ErrorText>{errors.images}</ErrorText>}
        </div>

        {/* Item name + price */}
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

        {/* Description */}
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

        {/* Size + size guide */}
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

          <FieldLabel number="06">Size guide (optional)</FieldLabel>
          <div
            onClick={() => guideInputRef.current?.click()}
            className="mpform-guide-upload"
          >
            <div className="mpform-guide-name">
              {sizeGuide ? sizeGuide.name : "Upload a size chart image or PDF"}
            </div>
            <span className="mpform-guide-action">
              {sizeGuide ? "Replace" : "Browse"}
            </span>
            <input
              ref={guideInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleSizeGuide(e.target.files)}
              className="mpform-hidden-input"
            />
          </div>
          {sizeGuide?.isImage && (
            <img
              src={sizeGuide.url}
              alt="Size guide preview"
              className="mpform-guide-preview"
            />
          )}
        </div>

        {/* Style */}
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

        {/* Care and info */}
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

        <button type="submit" className="mpform-submit">
          Publish listing
        </button>

        {submitted && (
          <div className="mpform-success">
            Listing ready — all fields look good.
          </div>
        )}
      </form>
    </div>
  );
}