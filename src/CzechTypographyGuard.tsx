import { useEffect } from "react";

type CzechTypographyGuardProps = {
  children: React.ReactNode;
};

const NBSP = "\u00A0";
/** Jednoznaková spojka/předložka (a, i, k, o, s, u, v, z) – pevná mezera před dalším slovem. */
const ONE_LETTER_WORD = /(^|[\s\u00A0])([AaIiKkOoSsUuVvZz])\s+(?=\S)/g;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION", "CODE", "PRE"]);

function normalizeText(text: string): string {
  return text.replace(ONE_LETTER_WORD, (_m, prefix: string, letter: string) => `${prefix}${letter}${NBSP}`);
}

function shouldSkip(node: Text): boolean {
  let current = node.parentElement;
  while (current) {
    if (SKIP_TAGS.has(current.tagName)) return true;
    if (current.classList.contains("no-typo-fix")) return true;
    current = current.parentElement;
  }
  return false;
}

function applyTypography(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const touched: Text[] = [];

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    if (!textNode.nodeValue || shouldSkip(textNode)) continue;
    touched.push(textNode);
  }

  for (const textNode of touched) {
    const original = textNode.nodeValue ?? "";
    const next = normalizeText(original);
    if (next !== original) textNode.nodeValue = next;
  }
}

export function CzechTypographyGuard({ children }: CzechTypographyGuardProps) {
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;

    applyTypography(root);

    const observer = new MutationObserver(() => {
      applyTypography(root);
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
}

