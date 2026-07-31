"use client";

import { useLocale } from "@/lib/locale";

/* The skip link is the first thing a keyboard or screen reader user meets, so
   it follows the interface language like everything else. It needs a client
   component because AppShell itself renders on the server. */
export function SkipLink() {
  const { locale } = useLocale();
  return (
    <a className="skip-link" href="#main-content">
      {locale === "ko" ? "본문으로 건너뛰기" : "Skip to content"}
    </a>
  );
}
