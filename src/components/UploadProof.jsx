import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Tesseract from "tesseract.js";
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

  const path = `proofs/${user.id}/${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage.from("proofs").upload(path, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicData } = supabase.storage.from("proofs").getPublicUrl(path);

  const {
    data: { text },
    error: ocrError,
  } = await Tesseract.recognize(file, "ara + eng");

  if (ocrError) {
    throw ocrError;
  }

  const amount = extractAmount(text);
  const approved = amount >= plan.price;

  let insertError;
  if (approved) {
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    const { data: currentSubscription } = await supabase
      .from("subscriptions")
      .select("end_date")
      .eq("tenant_id", tenantData?.id || user.id)
      .maybeSingle();
    const endDate = new Date();
    if (currentSubscription?.end_date && new Date(currentSubscription.end_date) > endDate) {
      endDate.setTime(new Date(currentSubscription.end_date).getTime());
    }
    endDate.setDate(endDate.getDate() + 30);
    ({ error: insertError } = await supabase.from("subscriptions").upsert({
      tenant_id: tenantData?.id || user.id,
      vendor_id: user.id,
      amount,
      proof_url: publicData.publicUrl,
      status: "active",
      end_date: endDate.toISOString(),
    }, { onConflict: "vendor_id" }));
  } else {
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    ({ error: insertError } = await supabase.from("renew_requests").insert({
      tenant_id: tenantData?.id || user.id,
      vendor_id: user.id,
      transaction_no: `PROOF-${Date.now()}`,
      screenshot_url: publicData.publicUrl,
    }));
  }

  if (insertError) {
    throw insertError;
  }

  if (approved) {
    const { error: updateError } = await supabase
      .from("tenants")
      .update({ plan: plan.id })
      .eq("owner_id", user.id);

    if (updateError) {
      throw updateError;
    }
  }

  return {
    amount,
    approved,
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
        setMessage(`Approved: ${result.amount} - activated ${result.plan.name}.`);
      } else {
        setMessage(`Pending approval: ${result.amount}`);
      }
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