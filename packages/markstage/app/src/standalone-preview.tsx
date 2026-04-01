import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registry } from "virtual:markstage-preview-registry";
import "virtual:previewer-css";

const WRAP_STYLES: Record<string, string> = {
  row: "flex-wrap:wrap;gap:8px",
  column: "flex-direction:column;gap:8px",
};

const ALIGN_STYLES: Record<string, string> = {
  center: "justify-content:center;align-items:center",
  start: "justify-content:center;align-items:flex-start",
  end: "justify-content:center;align-items:flex-end",
};

const blockId = location.pathname
  .split("/")
  .pop()!
  .replace(/\.html$/, "");

// Apply theme from URL parameter (?theme=dark|light)
const themeParam = new URLSearchParams(location.search).get("theme");
if (themeParam === "dark" || themeParam === "light") {
  document.documentElement.setAttribute("data-theme", themeParam);
  document.documentElement.classList.add(themeParam);
}

registry[blockId]?.().then((mod) => {
  if (mod.css) {
    const style = document.createElement("style");
    style.textContent = mod.css;
    document.head.appendChild(style);
  }

  const root = document.getElementById("root")!;
  root.style.display = "flex";
  root.style.justifyContent = "center";
  root.style.alignItems = "center";
  root.style.minHeight = "100vh";
  root.style.padding = "24px";
  root.style.background = "#ffffff";

  // Apply wrap/align from URL params
  const searchParams = new URLSearchParams(location.search);
  const wrapParam = searchParams.get("wrap");
  const alignParam = searchParams.get("align");
  if (wrapParam && WRAP_STYLES[wrapParam]) {
    root.style.cssText += ";" + WRAP_STYLES[wrapParam];
  }
  if (alignParam && ALIGN_STYLES[alignParam]) {
    root.style.cssText += ";" + ALIGN_STYLES[alignParam];
  }

  createRoot(root).render(
    <StrictMode>
      <mod.default />
    </StrictMode>,
  );

  // Report content height to parent for iframe auto-resize
  const observer = new ResizeObserver(() => {
    window.parent.postMessage(
      { type: "markstage-resize", blockId, height: root.scrollHeight },
      "*",
    );
  });
  observer.observe(root);
});
