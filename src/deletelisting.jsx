"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "./lib/supabase/client.ts";

export default function DeleteListingButton({ id }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const { error: deleteError } = await supabaseBrowser
        .from("products")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Failed to delete listing:", err?.message);
      setError("Something went wrong while removing this listing. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="mpdash-remove-btn"
      >
        Remove Listing
      </button>

      {showConfirm && (
        <div className="mpconfirm-overlay">
          <div className="mpconfirm-box">
            <div className="mpconfirm-title">Remove this listing?</div>
            <p className="mpconfirm-text">
              This can't be undone. The listing will be permanently removed.
            </p>
            {error && <div className="mpconfirm-error">{error}</div>}
            <div className="mpconfirm-actions">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="mpconfirm-btn mpconfirm-btn-no"
                disabled={deleting}
              >
                No, go back
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="mpconfirm-btn mpconfirm-btn-yes"
                disabled={deleting}
              >
                {deleting ? "Removing..." : "Yes, remove it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}