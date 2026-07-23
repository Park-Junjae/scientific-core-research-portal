"use client";

import { localized, useLocale } from "@/lib/locale";
import type { LocalizedText } from "@/lib/types";

export function LocalizedContent({ value, as: Tag = "span", className }: { value: LocalizedText; as?: "span" | "p" | "h1" | "h2" | "h3"; className?: string }) {
  const { locale, t } = useLocale();
  const content = localized(value, locale);
  if (content) return <Tag className={className}>{content}</Tag>;
  return <Tag className={`translation-missing${className ? ` ${className}` : ""}`}>{t("noTranslation")}</Tag>;
}
