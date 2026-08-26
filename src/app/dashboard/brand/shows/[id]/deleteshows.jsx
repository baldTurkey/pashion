"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function DeleteShowButton({ id }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabaseBrowser
        .from("shows")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      router.push("/dashboard/brand/shows");
      router.refresh();
    } catch (err) {
      console.error("Failed to delete show:", err?.message);
      setError(
        "Something went wrong while removing this show. Please try again."
      );
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="sddash-remove-btn"
      >
        Remove Show
      </button>

      {showConfirm && (
        <div className="sdconfirm-overlay">
          <div className="sdconfirm-box">
            <div className="sdconfirm-title">Remove this show?</div>

            <p className="sdconfirm-text">
              This can't be undone. The show will be permanently removed.
            </p>

            {error && <div className="sdconfirm-error">{error}</div>}

            <div className="sdconfirm-actions">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="sdconfirm-btn sdconfirm-btn-no"
                disabled={deleting}
              >
                No, go back
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="sdconfirm-btn sdconfirm-btn-yes"
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