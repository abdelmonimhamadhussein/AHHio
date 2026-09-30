import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { PACKAGES } from "../lib/Package";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const extractAmount = (text = "") => {
  const numbers = (text.match(/\d{3,}/g) || []).map((value) => Number(value.replace(/\D/g, "")));
  const validNumbers = numbers.filter((value) => value >= 1000);
  return validNumbers.length ? Math.max(...validNumbers) : 0;
};

export const uploadProof = async (file, planId = "pro") => {
  const plan = PACKAGES[planId] || PACKAGES.pro;
  if (!file) {
    throw new Error("No file selected");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image size must be less than 5MB");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("payment_proofs")
    .upload(path, file, { upsert: false });

  if (uploadError) {
    throw uploadError;
  }

  const { default: Tesseract } = await import("tesseract.js");
  const {
    data: { text },
    error: ocrError,
  } = await Tesseract.recognize(file, "ara + eng");

  if (ocrError) {
    throw ocrError;
  }

  const amount = extractAmount(text);
  const { data: tenantData, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (tenantError || !tenantData) throw tenantError || new Error("Vendor store not found");

  const { error: paymentError } = await supabase.from("payment_transactions").insert({
    tenant_id: tenantData.id,
    requested_plan_id: plan.id,
    txn_number: `PROOF-${crypto.randomUUID()}`,
    amount,
    screenshot_url: uploadData.path,
    status: "pending",
    auto_verified: false,
  });
  if (paymentError) throw paymentError;

  return {
    amount,
    approved: false,
    plan,
    publicUrl: publicData.publicUrl,
  };
};

export default function UploadProof() {
  const [searchParams] = useSearchParams();
  const plan = PACKAGES[searchParams.get("plan")] || PACKAGES.pro;
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setMessage("Processing...");
    setIsUploading(true);

    try {
      const result = await uploadProof(file, plan.id);

      if (result.approved) {
      setMessage(`Payment proof submitted for manual review. OCR amount: ${result.amount}.`);
    } catch (error) {
      setMessage(error.message || "Something went wrong");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <label
        htmlFor="proof-upload"
        style={{
          display: "inline-block",
          padding: "10px 14px",
          border: "1px solid #ccc",
          borderRadius: 8,
          cursor: isUploading ? "not-allowed" : "pointer",
        }}
      >
        {isUploading ? "Uploading..." : `Upload proof for ${plan.name} (${plan.price})`}
      </label>

      <input
        id="proof-upload"
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: "none" }}
        disabled={isUploading}
      />

      {fileName && <small>{fileName}</small>}
      {message && <div>{message}</div>}
    </div>
  );
}