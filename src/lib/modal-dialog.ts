"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/* Keyboard behaviour for a modal dialog, per the WAI-ARIA authoring practices:
   focus moves in on open, Tab cycles inside, Escape closes, and focus returns
   to whatever opened it. Markup with role="dialog" and aria-modal="true"
   promises all four; without them a keyboard user tabs straight out of the
   dialog into the page behind it and cannot dismiss it at all.

   Attach the returned ref and onKeyDown to the dialog element, and give it
   tabIndex={-1} so it can hold focus when it contains nothing focusable. */
export function useModalDialog<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusTo.current = document.activeElement as HTMLElement | null;
    const node = ref.current;
    /* Prefer the field the reader has to fill; it is never the destructive
       control, and its label is read with it. */
    const target =
      node?.querySelector<HTMLElement>("input:not([disabled]):not([type=hidden]), textarea:not([disabled])")
      ?? node?.querySelector<HTMLElement>(FOCUSABLE)
      ?? node;
    target?.focus();

    return () => {
      const previous = returnFocusTo.current;
      /* The card that owned the trigger may have been removed by the very
         action the dialog confirmed, so only restore to a node still present. */
      if (previous && previous.isConnected) previous.focus();
    };
  }, [open]);

  const onKeyDown = useCallback((event: KeyboardEvent<T>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const node = ref.current;
    if (!node) return;
    const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter((element) => element.offsetParent !== null || element === document.activeElement);
    if (focusable.length === 0) {
      event.preventDefault();
      node.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, [onClose]);

  return { ref, onKeyDown };
}
