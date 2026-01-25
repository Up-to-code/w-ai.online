"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUserContext } from "@/hooks/useUserContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocking?: boolean; // If true, modal cannot be closed (for required org creation)
}

export function CreateOrganizationModal({
  open,
  onOpenChange,
  blocking = false,
}: CreateOrganizationModalProps) {
  const { userId } = useUserContext();
  const createOrganization = useMutation(api.organizations.createOrganization);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });
  const [slugError, setSlugError] = useState<string>("");

  const validateSlug = (slug: string): boolean => {
    // English characters, numbers, hyphens, underscores only
    const slugRegex = /^[a-zA-Z0-9_-]+$/;
    if (!slug.trim()) {
      setSlugError("المعرف مطلوب");
      return false;
    }
    if (!slugRegex.test(slug)) {
      setSlugError("يجب أن يحتوي المعرف على أحرف إنجليزية وأرقام فقط");
      return false;
    }
    setSlugError("");
    return true;
  };

  const handleSlugChange = (value: string) => {
    // Auto-convert to lowercase and remove spaces
    const cleaned = value.toLowerCase().replace(/\s+/g, "-");
    handleChange("slug", cleaned);
    if (cleaned) {
      validateSlug(cleaned);
    } else {
      setSlugError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!formData.name.trim()) {
      toast.error("اسم المنظمة مطلوب");
      return;
    }

    if (!validateSlug(formData.slug)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrganization({
        userId,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
      });
      toast.success("تم إنشاء المنظمة بنجاح");
      setFormData({ name: "", slug: "" });
      setSlugError("");
      if (!blocking) {
        onOpenChange(false);
      } else {
        // Reload page to refresh organization context
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error?.message || "فشل إنشاء المنظمة");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={blocking ? undefined : onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        showCloseButton={!blocking}
        onPointerDownOutside={(e) => blocking && e.preventDefault()}
        onEscapeKeyDown={(e) => blocking && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            إنشاء منظمة جديدة
          </DialogTitle>
          <DialogDescription>
            {blocking
              ? "يجب إنشاء منظمة للوصول إلى لوحة التحكم. يمكن للمستخدم إنشاء منظمة واحدة فقط."
              : "أنشئ منظمة جديدة لإدارة حملاتك واتصالاتك. يمكن للمستخدم إنشاء منظمة واحدة فقط."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">
              اسم المنظمة <span className="text-destructive">*</span>
            </Label>
            <Input
              id="org-name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="أدخل اسم المنظمة"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-slug">
              المعرف (Slug) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="org-slug"
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="my-organization"
              required
              disabled={isSubmitting}
              className={slugError ? "border-destructive" : ""}
              pattern="[a-zA-Z0-9_-]+"
            />
            {slugError && (
              <p className="text-sm text-destructive">{slugError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              أحرف إنجليزية وأرقام فقط (مثال: my-organization)
            </p>
          </div>

          <DialogFooter>
            {!blocking && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء المنظمة"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
