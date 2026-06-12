/**
 * Form component for adding a new category
 */

import React, { useState } from "react";
import { TextField, Button } from "../vibes";

interface CategoryFormProps {
  onSubmit: (name: string) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function CategoryForm({
  onSubmit,
  onCancel,
  submitLabel = "Add Category",
}: CategoryFormProps) {
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (value: string) => {
    setCategoryName(value);
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const validateForm = (): boolean => {
    if (!categoryName.trim()) {
      setError("Category name is required");
      return false;
    }

    if (categoryName.length > 255) {
      setError("Category name must be less than 255 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(categoryName);
      // Reset form on success
      setCategoryName("");
      setError("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create category";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.5rem",
  };

  const errorStyle: React.CSSProperties = {
    color: "#ef4444",
    fontSize: "0.875rem",
    marginTop: "0.25rem",
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <TextField
        label="Category Name"
        type="text"
        placeholder="Enter category name"
        value={categoryName}
        onChange={(e) => handleChange(e.target.value)}
        fullWidth
        required
      />

      {error && <div style={errorStyle}>{error}</div>}

      <div style={buttonGroupStyle}>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? "Creating..." : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
