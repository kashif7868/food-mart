"use client";

import { useEffect } from "react";

import { UR, UR_PATTERNS } from "@/lib/ur";
import { usePrefs } from "@/store/prefsStore";

/* =========================================================
   LIVE TRANSLATOR (English <-> Urdu)
   Renders nothing. When the language is Urdu it walks the page
   (and every later change) and swaps known English texts, input
   placeholders and aria-labels for their Urdu version. English
   is restored when the language is switched back. Unknown texts
   stay in English, so nothing breaks.
========================================================= */

const ATTRS = ["placeholder", "aria-label", "title", "alt"] as const;
const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA"]);

const translate = (text: string): string | null => {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) return null;
  const direct = UR[trimmed];
  if (direct) return direct;
  for (const [re, out] of UR_PATTERNS) {
    if (re.test(trimmed)) return trimmed.replace(re, out);
  }
  return null;
};

const withSpaces = (original: string, translated: string) => {
  const lead = original.match(/^\s*/)?.[0] || "";
  const tail = original.match(/\s*$/)?.[0] || "";
  return lead + translated + tail;
};

export function Translator() {
  const lang = usePrefs((s) => s.lang);

  useEffect(() => {
    const texts = new Map<Text, { orig: string; applied: string }>();
    const attrs = new Map<string, { orig: string; applied: string }>(); // "<n>|attr" is not needed: stored on the element dataset instead

    const doText = (node: Text) => {
      const parent = node.parentElement;
      if (!parent || SKIP.has(parent.tagName)) return;
      const known = texts.get(node);
      if (known && node.data === known.applied) return;
      const out = translate(node.data);
      if (out) {
        const applied = withSpaces(node.data, out);
        texts.set(node, { orig: node.data, applied });
        node.data = applied;
      } else if (known) {
        texts.delete(node);
      }
    };

    const doElement = (el: Element) => {
      for (const attr of ATTRS) {
        const value = el.getAttribute(attr);
        if (!value) continue;
        const key = `data-fm-orig-${attr}`;
        const applied = el.getAttribute(`data-fm-ur-${attr}`);
        if (applied === value) continue; // already ours
        const out = translate(value);
        if (out) {
          el.setAttribute(key, value);
          el.setAttribute(`data-fm-ur-${attr}`, out);
          el.setAttribute(attr, out);
        }
      }
    };

    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) return doText(root as Text);
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      const el = root as Element;
      if (SKIP.has(el.tagName)) return;
      doElement(el);
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let n = tw.nextNode();
      while (n) {
        if (n.nodeType === Node.TEXT_NODE) doText(n as Text);
        else if (!SKIP.has((n as Element).tagName)) doElement(n as Element);
        n = tw.nextNode();
      }
    };

    const restore = () => {
      texts.forEach((v, node) => {
        if (node.data === v.applied) node.data = v.orig;
      });
      texts.clear();
      attrs.clear();
      document.querySelectorAll("[data-fm-ur-placeholder],[data-fm-ur-aria-label],[data-fm-ur-title],[data-fm-ur-alt]").forEach((el) => {
        for (const attr of ATTRS) {
          const orig = el.getAttribute(`data-fm-orig-${attr}`);
          if (orig !== null && el.getAttribute(attr) === el.getAttribute(`data-fm-ur-${attr}`)) el.setAttribute(attr, orig);
          el.removeAttribute(`data-fm-orig-${attr}`);
          el.removeAttribute(`data-fm-ur-${attr}`);
        }
      });
    };

    if (lang !== "ur") return;

    walk(document.body);
    let queued = false;
    const pending = new Set<Node>();
    const flush = () => {
      queued = false;
      observer.disconnect();
      pending.forEach((n) => n.isConnected && walk(n));
      pending.clear();
      observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    };
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "childList") r.addedNodes.forEach((n) => pending.add(n));
        else pending.add(r.target.nodeType === Node.TEXT_NODE ? r.target : r.target);
      }
      if (!queued) {
        queued = true;
        requestAnimationFrame(flush);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });

    return () => {
      observer.disconnect();
      restore();
    };
  }, [lang]);

  return null;
}
