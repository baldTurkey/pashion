"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

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

type ImageItem = {
  id: string;
  url: string;
  source: "upload" | "remote";
  file?: File;
};

type SizeGuideItem = {
  file: File | null;
  name: string;
  url: string | null;
  isImage: boolean;
  source: "upload" | "remote";
};

type SupplyQuantities = Record<string, number>;

const SUPPLY_SIZES = [
  { key: "small", label: "Small" },
  { key: "medium", label: "Medium" },
  { key: "large", label: "Large" },
  { key: "xlarge", label: "X-Large" },
  { key: "xxl", label: "XX-Large" },
  { key: "one size", label: "One size" },
];

export type InventoryDraftItem = {
  id: number;
  name: string | null;
  imageUrl: string[] | null;
  currentPrice: string | null;
  description: string | null;
  size: string | null;
  style: string | null;
  care_info: string | null;
  size_guide_url: string | null;
  type: string | null;
  stock: number;
  supply?: string[] | null;
};

type AddInventoryFormProps = {
  brandId: string;
};

type CreateListingFormProps = {
  brandId: string;
  inventoryItems: InventoryDraftItem[];
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div className="mpform-field-label">
      <label>
        {children}
        {required && <span className="mpform-required">*</span>}
      </label>
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <div className="mpform-error">{children}</div>;
}

type SupabaseLikeError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
  statusCode?: string | number;
  uploadPath?: string;
  debugType?: string;
  debugKeys?: string[];
  debugString?: string;
};

function asErrorDetails(error: unknown): SupabaseLikeError {
  if (error instanceof Error) {
    return {
      message: error.message,
      debugType: error.name,
    };
  }

  if (!error || typeof error !== "object") {
    return {
      message: String(error ?? "Unknown error"),
      debugType: typeof error,
    };
  }

  const unknownRecord = error as Record<string, unknown>;
  const ownKeys = Object.getOwnPropertyNames(error);
  const rawMessage =
    unknownRecord.message ??
    unknownRecord.error_description ??
    unknownRecord.error;

  const details: SupabaseLikeError = {
    message: typeof rawMessage === "string" ? rawMessage : undefined,
    details: typeof unknownRecord.details === "string" ? unknownRecord.details : undefined,
    hint: typeof unknownRecord.hint === "string" ? unknownRecord.hint : undefined,
    code: typeof unknownRecord.code === "string" ? unknownRecord.code : undefined,
    statusCode:
      typeof unknownRecord.statusCode === "string" || typeof unknownRecord.statusCode === "number"
        ? unknownRecord.statusCode
        : undefined,
    uploadPath: typeof unknownRecord.uploadPath === "string" ? unknownRecord.uploadPath : undefined,
    debugType: Object.prototype.toString.call(error),
    debugKeys: ownKeys,
  };

  if (!details.message) {
    try {
      details.debugString = JSON.stringify(error);
    } catch {
      details.debugString = "<unserializable error object>";
    }

    details.message = details.debugString || "Unknown error";
  }

  return details;
}

function getFriendlySubmitError(prefix: string, error: unknown) {
  const details = asErrorDetails(error);
  const combined = `${details.message ?? ""} ${details.details ?? ""}`.toLowerCase();

  if (combined.includes("row-level security") || combined.includes("violates row-level security")) {
    return `${prefix} RLS blocked the request. Check storage.objects policies for bucket 'listing-photos' and confirm your upload path starts with the authenticated user id.`;
  }

  return `${prefix} ${details.message ?? "Please try again."}`;
}

async function uploadFile(file: File, folder: string) {
  const { data: userData, error: userError } = await supabaseBrowser.auth.getUser();

  if (userError) throw userError;

  const userId = userData.user?.id;

  if (!userId) {
    throw new Error("You must be signed in to upload files.");
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabaseBrowser.storage.from("listing-photos").upload(path, file);

  if (uploadError) {
    throw {
      ...uploadError,
      uploadPath: path,
    };
  }

  const { data } = supabaseBrowser.storage.from("listing-photos").getPublicUrl(path);
  return data.publicUrl;
}

function buildRemoteImageItems(urls: string[], prefix: string) {
  return urls.map((url, index) => ({
    id: `${prefix}-${index}-${url}`,
    url,
    source: "remote" as const,
  }));
}

function hasImagePreview(url: string | null) {
  return Boolean(url && /\.(png|jpg|jpeg|gif|webp|avif|svg)$/i.test(url));
}

function revokeImageUrls(images: ImageItem[]) {
  images.forEach((image) => {
    if (image.source === "upload") {
      URL.revokeObjectURL(image.url);
    }
  });
}

function revokeSizeGuideUrl(sizeGuide: SizeGuideItem | null) {
  if (sizeGuide?.source === "upload" && sizeGuide.url) {
    URL.revokeObjectURL(sizeGuide.url);
  }
}

function createEmptySupplyQuantities() {
  return SUPPLY_SIZES.reduce((accumulator, sizeValue) => {
    accumulator[sizeValue.key] = 0;
    return accumulator;
  }, {} as SupplyQuantities);
}

function sumSupplyQuantities(supplyQuantities: SupplyQuantities) {
  return Object.values(supplyQuantities).reduce((total, value) => total + Number(value || 0), 0);
}

function buildSupplyArray(supplyQuantities: SupplyQuantities) {
  const total = sumSupplyQuantities(supplyQuantities);

  return [
    String(total),
    ...SUPPLY_SIZES.map((sizeValue) => `${sizeValue.key}: ${Number(supplyQuantities[sizeValue.key] || 0)}`),
  ];
}

function parseSupplyArray(supply: string[] | null | undefined) {
  const nextQuantities = createEmptySupplyQuantities();

  (supply ?? []).slice(1).forEach((entry) => {
    const separatorIndex = entry.indexOf(":");

    if (separatorIndex === -1) return;

    const key = entry.slice(0, separatorIndex).trim().toLowerCase();
    const value = Number(entry.slice(separatorIndex + 1).trim());

    if (!Number.isFinite(value) || value < 0) return;

    if (Object.prototype.hasOwnProperty.call(nextQuantities, key)) {
      nextQuantities[key] = value;
    }
  });

  return nextQuantities;
}

function usePreviewCleanup(images: ImageItem[], sizeGuide: SizeGuideItem | null) {
  const imagesRef = useRef(images);
  const sizeGuideRef = useRef(sizeGuide);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    sizeGuideRef.current = sizeGuide;
  }, [sizeGuide]);

  useEffect(() => {
    return () => {
      revokeImageUrls(imagesRef.current);
      revokeSizeGuideUrl(sizeGuideRef.current);
    };
  }, []);
}

function AddInventoryFields({
  brandId,
  onSuccess,
}: {
  brandId: string;
  onSuccess?: () => void;
}) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [sizeGuide, setSizeGuide] = useState<SizeGuideItem | null>(null);
  const [style, setStyle] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [careInfo, setCareInfo] = useState("");
  const [type, setType] = useState("");
  const [supplyQuantities, setSupplyQuantities] = useState<SupplyQuantities>(() => createEmptySupplyQuantities());
  const [readyToSellDate, setReadyToSellDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const guideInputRef = useRef<HTMLInputElement | null>(null);

  usePreviewCleanup(images, sizeGuide);

  const resetForm = () => {
    revokeImageUrls(images);
    revokeSizeGuideUrl(sizeGuide);
    setImages([]);
    setItemName("");
    setPrice("");
    setDescription("");
    setSizeGuide(null);
    setStyle("");
    setCustomStyle("");
    setCareInfo("");
    setType("");
    setSupplyQuantities(createEmptySupplyQuantities());
    setReadyToSellDate("");
    setErrors({});
    setSubmitError(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (guideInputRef.current) guideInputRef.current.value = "";
  };

  const addImages = (fileList: FileList | null) => {
    const incoming = Array.from(fileList ?? []).filter((file) => file.type.startsWith("image/"));

    if (incoming.length === 0) return;

    setImages((prev) => {
      const room = MAX_IMAGES - prev.length;
      const toAdd = incoming.slice(0, Math.max(room, 0)).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        source: "upload" as const,
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      }));

      return [...prev, ...toAdd];
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const removed = prev.find((image) => image.id === id);

      if (removed?.source === "upload") {
        URL.revokeObjectURL(removed.url);
      }

      return prev.filter((image) => image.id !== id);
    });
  };

  const handleSizeGuide = (fileList: FileList | null) => {
    const file = fileList?.[0] ?? null;

    if (!file) return;

    setSizeGuide((previous) => {
      revokeSizeGuideUrl(previous);

      return {
        file,
        name: file.name,
        url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        isImage: file.type.startsWith("image/"),
        source: "upload",
      };
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (images.length < MIN_IMAGES) nextErrors.images = "Add at least 1 photo.";
    if (!itemName.trim()) nextErrors.itemName = "Enter an item name.";
    if (!price.trim() || Number.isNaN(Number(price)) || Number(price) <= 0) nextErrors.price = "Enter a valid price.";
    if (!description.trim()) nextErrors.description = "Add a description.";
    if (!sizeGuide) nextErrors.sizeGuide = "Upload a size guide.";
    if (!style && !customStyle.trim()) nextErrors.style = "Choose or enter a style.";
    if (!careInfo.trim()) nextErrors.careInfo = "Add care and info details.";

    const stockTotal = sumSupplyQuantities(supplyQuantities);

    if (stockTotal <= 0) nextErrors.stock = "Add at least 1 item across the size quantities.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      setSubmitted(false);
      return;
    }

    setSaving(true);

    try {
      const photoUrls = await Promise.all(
        images.map((image) => (image.source === "upload" && image.file ? uploadFile(image.file, "photos") : image.url)),
      );

      let sizeGuideUrl = null;

      if (sizeGuide?.file) {
        sizeGuideUrl = await uploadFile(sizeGuide.file, "size-guides");
      } else if (sizeGuide?.url) {
        sizeGuideUrl = sizeGuide.url;
      }

      const { error: insertError } = await supabaseBrowser.from("inventory").insert([
        {
          name: itemName.trim(),
          imageUrl: photoUrls,
          currentPrice: price.trim(),
          description: description.trim(),
          style: style === "Other" ? customStyle.trim() : style || null,
          care_info: careInfo.trim(),
          size_guide_url: sizeGuideUrl,
          type: type.trim() || null,
          stock: sumSupplyQuantities(supplyQuantities),
          supply: buildSupplyArray(supplyQuantities),
          brand_id: brandId,
          ready_to_sell_date: readyToSellDate || null,
        },
      ]);

      if (insertError) throw insertError;

      resetForm();
      setSubmitted(true);
      onSuccess?.();
    } catch (error) {
      const details = asErrorDetails(error);
      console.warn("Failed to add inventory", {
        message: details.message,
        details: details.details,
        hint: details.hint,
        code: details.code,
        statusCode: details.statusCode,
        uploadPath: details.uploadPath,
        debugType: details.debugType,
        debugKeys: details.debugKeys,
        debugString: details.debugString,
        raw: error,
      });
      setSubmitError(getFriendlySubmitError("Could not save inventory.", error));
      setSubmitted(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="mpform-section">
        <FieldLabel required>
          Photos of the item
        </FieldLabel>
        <p className="mpform-helper">
          {images.length} of {MAX_IMAGES} added &middot; at least 1 required
        </p>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            addImages(event.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`mpform-dropzone ${dragActive ? "active" : ""} ${images.length >= MAX_IMAGES ? "full" : ""}`}
        >
          <div className="mpform-dropzone-title">Drop photos here or click to browse</div>
          <div className="mpform-dropzone-sub">JPG or PNG, up to {MAX_IMAGES} photos</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={images.length >= MAX_IMAGES}
            onChange={(event) => {
              addImages(event.target.files);
              event.target.value = "";
            }}
            className="mpform-hidden-input"
          />
        </div>

        {images.length > 0 && (
          <div className="mpform-thumb-grid">
            {images.map((image, index) => (
              <div className="mpform-thumb" key={image.id}>
                <img src={image.url} alt={`Item photo ${index + 1}`} />
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  aria-label={`Remove photo ${index + 1}`}
                  className="mpform-thumb-remove"
                >
                  &times;
                </button>
                {index === 0 && <span className="mpform-thumb-cover">Cover</span>}
              </div>
            ))}
          </div>
        )}
        {errors.images && <ErrorText>{errors.images}</ErrorText>}
      </div>

      <div className="mpform-section">
        <FieldLabel required>
          Item name
        </FieldLabel>
        <input className="mpform-input" placeholder="Wool blend overcoat" value={itemName} onChange={(event) => setItemName(event.target.value)} />
        {errors.itemName && <ErrorText>{errors.itemName}</ErrorText>}

        <div className="mpform-spacer" />

        <FieldLabel required>
          Price
        </FieldLabel>
        <div className="mpform-price-wrap">
          <span className="mpform-price-sign">$</span>
          <input
            className="mpform-input mpform-price-input"
            placeholder="0.00"
            inputMode="decimal"
            value={price}
            onChange={(event) => {
              const value = event.target.value;
              if (/^\d*\.?\d{0,2}$/.test(value)) setPrice(value);
            }}
          />
        </div>
        {errors.price && <ErrorText>{errors.price}</ErrorText>}
      </div>

      <div className="mpform-section">
        <FieldLabel required>
          Description
        </FieldLabel>
        <textarea
          className="mpform-textarea tall"
          placeholder="Describe the fit, fabric, condition, and anything a buyer should know."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        {errors.description && <ErrorText>{errors.description}</ErrorText>}
      </div>

      <div className="mpform-section">
        <FieldLabel>Size guide</FieldLabel>
        <div onClick={() => guideInputRef.current?.click()} className="mpform-guide-upload">
          <div className="mpform-guide-name">{sizeGuide ? sizeGuide.name : "Upload a size chart image or PDF"}</div>
          <span className="mpform-guide-action">{sizeGuide ? "Replace" : "Browse"}</span>
          <input
            ref={guideInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => handleSizeGuide(event.target.files)}
            className="mpform-hidden-input"
          />
        </div>
        {sizeGuide?.isImage && sizeGuide.url && <img src={sizeGuide.url} alt="Size guide preview" className="mpform-guide-preview" />}
        {errors.sizeGuide && <ErrorText>{errors.sizeGuide}</ErrorText>}

        <div className="mpform-spacer" />

        <FieldLabel>Type</FieldLabel>
        <input
          className="mpform-input"
          placeholder="Hoodie, dress, jacket, and so on"
          value={type}
          onChange={(event) => setType(event.target.value)}
        />

        <div className="mpform-spacer" />

        <FieldLabel required>
          Style
        </FieldLabel>
        <select
          className="mpform-select"
          value={style}
          onChange={(event) => {
            setStyle(event.target.value);
            if (event.target.value !== "Other") setCustomStyle("");
          }}
        >
          <option value="">Select a style</option>
          {STYLES.map((styleValue) => (
            <option key={styleValue} value={styleValue}>
              {styleValue}
            </option>
          ))}
        </select>
        {style === "Other" && (
          <input
            className="mpform-input"
            style={{ marginTop: 10 }}
            placeholder="Describe the style"
            value={customStyle}
            onChange={(event) => setCustomStyle(event.target.value)}
          />
        )}
        {errors.style && <ErrorText>{errors.style}</ErrorText>}
      </div>

      <div className="mpform-section">
        <FieldLabel required>
          Supply quantities
        </FieldLabel>
        <div className="mpform-size-quantity-grid">
          {SUPPLY_SIZES.map((sizeValue) => (
            <label key={sizeValue.key} className="mpform-size-quantity-row">
              <span>{sizeValue.label}</span>
              <input
                className="mpform-input"
                type="number"
                min="0"
                step="1"
                value={supplyQuantities[sizeValue.key] ?? 0}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setSupplyQuantities((current) => ({
                    ...current,
                    [sizeValue.key]: Number.isFinite(nextValue) && nextValue >= 0 ? nextValue : 0,
                  }));
                }}
                placeholder="0"
              />
            </label>
          ))}
        </div>
        <div className="mpform-helper">Total stock: {sumSupplyQuantities(supplyQuantities)}</div>
        {errors.stock && <ErrorText>{errors.stock}</ErrorText>}
      </div>

      <div className="mpform-section">
        <FieldLabel>Care and info</FieldLabel>
        <textarea
          className="mpform-textarea short"
          placeholder="Machine wash cold, tumble dry low, do not bleach..."
          value={careInfo}
          onChange={(event) => setCareInfo(event.target.value)}
        />
        {errors.careInfo && <ErrorText>{errors.careInfo}</ErrorText>}
      </div>

      <div className="mpform-section">
        <FieldLabel>Ready to sell date</FieldLabel>
        <input
          className="mpform-input"
          type="date"
          value={readyToSellDate}
          onChange={(event) => setReadyToSellDate(event.target.value)}
        />
      </div>

      {submitError && (
        <div className="mpform-error" style={{ marginBottom: 16 }}>
          {submitError}
        </div>
      )}

      <button type="submit" className="mpform-submit" disabled={saving}>
        {saving ? "Saving..." : "Add to inventory"}
      </button>

      {submitted && <div className="mpform-success">Inventory item saved successfully.</div>}
    </form>
  );
}

function CreateListingFields({
  brandId,
  inventoryItems,
  onSuccess,
}: {
  brandId: string;
  inventoryItems: InventoryDraftItem[];
  onSuccess?: () => void;
}) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [sizeGuide, setSizeGuide] = useState<SizeGuideItem | null>(null);
  const [type, setType] = useState("");
  const [style, setStyle] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [careInfo, setCareInfo] = useState("");
  const [supplyQuantities, setSupplyQuantities] = useState<SupplyQuantities>(() => createEmptySupplyQuantities());
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const guideInputRef = useRef<HTMLInputElement | null>(null);

  usePreviewCleanup(images, sizeGuide);

  const selectedInventory = inventoryItems.find((item) => String(item.id) === selectedInventoryId) ?? null;

  const resetForm = () => {
    revokeImageUrls(images);
    revokeSizeGuideUrl(sizeGuide);
    setImages([]);
    setItemName("");
    setPrice("");
    setDescription("");
    setSizeGuide(null);
    setType("");
    setStyle("");
    setCustomStyle("");
    setCareInfo("");
    setSupplyQuantities(createEmptySupplyQuantities());
    setSelectedInventoryId("");
    setErrors({});
    setSubmitError(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (guideInputRef.current) guideInputRef.current.value = "";
  };

  const addImages = (fileList: FileList | null) => {
    const incoming = Array.from(fileList ?? []).filter((file) => file.type.startsWith("image/"));

    if (incoming.length === 0) return;

    setImages((prev) => {
      const room = MAX_IMAGES - prev.length;
      const toAdd = incoming.slice(0, Math.max(room, 0)).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        source: "upload" as const,
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      }));

      return [...prev, ...toAdd];
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const removed = prev.find((image) => image.id === id);

      if (removed?.source === "upload") {
        URL.revokeObjectURL(removed.url);
      }

      return prev.filter((image) => image.id !== id);
    });
  };

  const handleSizeGuide = (fileList: FileList | null) => {
    const file = fileList?.[0] ?? null;

    if (!file) return;

    setSizeGuide((previous) => {
      revokeSizeGuideUrl(previous);

      return {
        file,
        name: file.name,
        url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        isImage: file.type.startsWith("image/"),
        source: "upload",
      };
    });
  };

  const applyInventoryDraft = () => {
    if (!selectedInventory) return;

    const remoteImages = selectedInventory.imageUrl?.filter(Boolean) ?? [];

    if (remoteImages.length > 0) {
      revokeImageUrls(images);
      setImages(buildRemoteImageItems(remoteImages, `inventory-${selectedInventory.id}`));
    }

    if (selectedInventory.size_guide_url) {
      const guideUrl = selectedInventory.size_guide_url;
      setSizeGuide((previous) => {
        revokeSizeGuideUrl(previous);

        return {
          file: null,
          name: guideUrl.split("/").pop() || "Inventory size guide",
          url: hasImagePreview(guideUrl) ? guideUrl : null,
          isImage: hasImagePreview(guideUrl),
          source: "remote",
        };
      });
    }

    setItemName(selectedInventory.name ?? "");
    setPrice(selectedInventory.currentPrice ?? "");
    setDescription(selectedInventory.description ?? "");
    setType(selectedInventory.type ?? "");
    setStyle(selectedInventory.style ?? "");
    setCustomStyle("");
    setCareInfo(selectedInventory.care_info ?? "");
    setSupplyQuantities(parseSupplyArray(selectedInventory.supply));
    setErrors({});
    setSubmitted(false);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (images.length < MIN_IMAGES) nextErrors.images = "Add at least 1 photo.";
    if (!itemName.trim()) nextErrors.itemName = "Enter an item name.";
    if (!price.trim() || Number.isNaN(Number(price)) || Number(price) <= 0) nextErrors.price = "Enter a valid price.";
    if (!description.trim()) nextErrors.description = "Add a description.";
    if (!sizeGuide) nextErrors.sizeGuide = "Upload a size guide.";
    if (!style && !customStyle.trim()) nextErrors.style = "Choose or enter a style.";
    if (!careInfo.trim()) nextErrors.careInfo = "Add care and info details.";

    const stockTotal = sumSupplyQuantities(supplyQuantities);

    if (stockTotal <= 0) nextErrors.stock = "Add at least 1 item across the supply quantities.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      setSubmitted(false);
      return;
    }

    setSaving(true);

    try {
      const photoUrls = await Promise.all(
        images.map((image) => (image.source === "upload" && image.file ? uploadFile(image.file, "photos") : image.url)),
      );

      let sizeGuideUrl = null;

      if (sizeGuide?.file) {
        sizeGuideUrl = await uploadFile(sizeGuide.file, "size-guides");
      } else if (sizeGuide?.url) {
        sizeGuideUrl = sizeGuide.url;
      }

      const { error: insertError } = await supabaseBrowser.from("products").insert([
        {
          imageUrl: photoUrls[0] || null,
          name: itemName.trim(),
          currentPrice: price.trim(),
          description: description.trim(),
          style: style === "Other" ? customStyle.trim() : style || null,
          care_info: careInfo.trim(),
          size_guide_url: sizeGuideUrl,
          type: type.trim() || null,
          supply: buildSupplyArray(supplyQuantities),
          brand_id: brandId,
        },
      ]);

      if (insertError) throw insertError;

      resetForm();
      setSubmitted(true);
      onSuccess?.();
    } catch (error) {
      const details = asErrorDetails(error);
      console.warn("Failed to create listing", {
        message: details.message,
        details: details.details,
        hint: details.hint,
        code: details.code,
        statusCode: details.statusCode,
        uploadPath: details.uploadPath,
        debugType: details.debugType,
        debugKeys: details.debugKeys,
        debugString: details.debugString,
        raw: error,
      });
      setSubmitError(getFriendlySubmitError("Could not create listing.", error));
      setSubmitted(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-2xl border border-brand-ink/10 bg-brand-cream/60 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/60">Inventory shortcut</p>
            <h2 className="font-serif text-xl text-brand-ink">Autofill from your inventory</h2>
            <p className="text-sm text-brand-ink/70">
              Pick an inventory item and copy its details into this listing draft.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-brand-ink/60">
                Inventory item
              </label>
              <select
                className="mpform-select"
                value={selectedInventoryId}
                onChange={(event) => setSelectedInventoryId(event.target.value)}
              >
                <option value="">Choose inventory item</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name?.trim() || `Inventory item ${item.id}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={applyInventoryDraft}
              className="inline-flex h-12 items-center justify-center rounded-full bg-brand-olive px-5 text-sm font-semibold text-white transition hover:bg-brand-olive-dark"
              disabled={!selectedInventory}
            >
              Autofill draft
            </button>
          </div>
        </div>

        {selectedInventory && (
          <p className="mt-4 text-xs text-brand-ink/60">
            Drafting from {selectedInventory.name?.trim() || `inventory item ${selectedInventory.id}`}. 
          </p>
        )}
      </div>

      <div className="mpform-section">
        <FieldLabel required>
          Photos of the item
        </FieldLabel>
        <p className="mpform-helper">
          {images.length} of {MAX_IMAGES} added &middot; at least 1 required
        </p>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            addImages(event.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`mpform-dropzone ${dragActive ? "active" : ""} ${images.length >= MAX_IMAGES ? "full" : ""}`}
        >
          <div className="mpform-dropzone-title">Drop photos here or click to browse</div>
          <div className="mpform-dropzone-sub">JPG or PNG, up to {MAX_IMAGES} photos</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={images.length >= MAX_IMAGES}
            onChange={(event) => {
              addImages(event.target.files);
              event.target.value = "";
            }}
            className="mpform-hidden-input"
          />
        </div>

        {images.length > 0 && (
          <div className="mpform-thumb-grid">
            {images.map((image, index) => (
              <div className="mpform-thumb" key={image.id}>
                <img src={image.url} alt={`Item photo ${index + 1}`} />
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  aria-label={`Remove photo ${index + 1}`}
                  className="mpform-thumb-remove"
                >
                  &times;
                </button>
                {index === 0 && <span className="mpform-thumb-cover">Cover</span>}
              </div>
            ))}
          </div>
        )}
        {errors.images && <ErrorText>{errors.images}</ErrorText>}
      </div>

      <div className="mpform-section">
        <FieldLabel required>
          Item name
        </FieldLabel>
        <input className="mpform-input" placeholder="Wool blend overcoat" value={itemName} onChange={(event) => setItemName(event.target.value)} />
        {errors.itemName && <ErrorText>{errors.itemName}</ErrorText>}

        <div className="mpform-spacer" />

        <FieldLabel required>
          Price
        </FieldLabel>
        <div className="mpform-price-wrap">
          <span className="mpform-price-sign">$</span>
          <input
            className="mpform-input mpform-price-input"
            placeholder="0.00"
            inputMode="decimal"
            value={price}
            onChange={(event) => {
              const value = event.target.value;
              if (/^\d*\.?\d{0,2}$/.test(value)) setPrice(value);
            }}
          />
        </div>
        {errors.price && <ErrorText>{errors.price}</ErrorText>}
      </div>

      <div className="mpform-section">
        <FieldLabel required>
          Description
        </FieldLabel>
        <textarea
          className="mpform-textarea tall"
          placeholder="Describe the fit, fabric, condition, and anything a buyer should know."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        {errors.description && <ErrorText>{errors.description}</ErrorText>}
      </div>

      <div className="mpform-section">
        <FieldLabel>Size guide</FieldLabel>
        <div onClick={() => guideInputRef.current?.click()} className="mpform-guide-upload">
          <div className="mpform-guide-name">{sizeGuide ? sizeGuide.name : "Upload a size chart image or PDF"}</div>
          <span className="mpform-guide-action">{sizeGuide ? "Replace" : "Browse"}</span>
          <input
            ref={guideInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => handleSizeGuide(event.target.files)}
            className="mpform-hidden-input"
          />
        </div>
        {sizeGuide?.isImage && sizeGuide.url && <img src={sizeGuide.url} alt="Size guide preview" className="mpform-guide-preview" />}
        {errors.sizeGuide && <ErrorText>{errors.sizeGuide}</ErrorText>}

        <div className="mpform-spacer" />

        <FieldLabel>Type</FieldLabel>
        <input
          className="mpform-input"
          placeholder="Hoodie, dress, jacket, and so on"
          value={type}
          onChange={(event) => setType(event.target.value)}
        />

        <div className="mpform-spacer" />

        <FieldLabel required>
          Style
        </FieldLabel>
        <select
          className="mpform-select"
          value={style}
          onChange={(event) => {
            setStyle(event.target.value);
            if (event.target.value !== "Other") setCustomStyle("");
          }}
        >
          <option value="">Select a style</option>
          {STYLES.map((styleValue) => (
            <option key={styleValue} value={styleValue}>
              {styleValue}
            </option>
          ))}
        </select>
        {style === "Other" && (
          <input
            className="mpform-input"
            style={{ marginTop: 10 }}
            placeholder="Describe the style"
            value={customStyle}
            onChange={(event) => setCustomStyle(event.target.value)}
          />
        )}
        {errors.style && <ErrorText>{errors.style}</ErrorText>}
      </div>

      <div className="mpform-section">
        <FieldLabel>Supply quantities</FieldLabel>
        <div className="mpform-size-quantity-grid">
          {SUPPLY_SIZES.map((sizeValue) => (
            <label key={sizeValue.key} className="mpform-size-quantity-row">
              <span>{sizeValue.label}</span>
              <input
                className="mpform-input"
                type="number"
                min="0"
                step="1"
                value={supplyQuantities[sizeValue.key] ?? 0}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setSupplyQuantities((current) => ({
                    ...current,
                    [sizeValue.key]: Number.isFinite(nextValue) && nextValue >= 0 ? nextValue : 0,
                  }));
                }}
                placeholder="0"
              />
            </label>
          ))}
        </div>
        <div className="mpform-helper">Total stock: {sumSupplyQuantities(supplyQuantities)}</div>
        {errors.stock && <ErrorText>{errors.stock}</ErrorText>}
      </div>

      <div className="mpform-section">
        <FieldLabel>Care and info</FieldLabel>
        <textarea
          className="mpform-textarea short"
          placeholder="Machine wash cold, tumble dry low, do not bleach..."
          value={careInfo}
          onChange={(event) => setCareInfo(event.target.value)}
        />
        {errors.careInfo && <ErrorText>{errors.careInfo}</ErrorText>}
      </div>

      {submitError && (
        <div className="mpform-error" style={{ marginBottom: 16 }}>
          {submitError}
        </div>
      )}

      <button type="submit" className="mpform-submit" disabled={saving}>
        {saving ? "Publishing..." : "Publish listing"}
      </button>

      {submitted && <div className="mpform-success">Listing ready — all fields look good.</div>}
    </form>
  );
}

export function AddInventoryForm({ brandId }: AddInventoryFormProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl border border-brand-ink/10 bg-white/80 p-5 shadow-sm sm:p-8">
        <div className="mb-8 space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/60">Add Inventory</p>
          <h1 className="font-serif text-3xl text-brand-ink">Add to Inventory</h1>
          <p className="max-w-2xl text-sm text-brand-ink/70">
            Use the product form below to store photos, size, stock, and the optional ready-to-sell date in your inventory.
          </p>
        </div>

        <AddInventoryFields brandId={brandId} />
      </div>
    </div>
  );
}

export function CreateListingForm({ brandId, inventoryItems }: CreateListingFormProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl border border-brand-ink/10 bg-white/80 p-5 shadow-sm sm:p-8">
        <div className="mb-8 space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/60">Create Listing</p>
          <h1 className="font-serif text-3xl text-brand-ink">Create a New Listing</h1>
          <p className="max-w-2xl text-sm text-brand-ink/70">
            Start from scratch or autofill from an inventory item, then publish the marketplace listing.
          </p>
        </div>

        <CreateListingFields brandId={brandId} inventoryItems={inventoryItems} />
      </div>
    </div>
  );
}