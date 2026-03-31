/**
 * Browser-safe exports for shadow DOM preview rendering.
 *
 * This sub-path (`@izumisy/react-preview/dom`) avoids pulling in Node.js
 * dependencies (e.g. `node:crypto`) so it can be safely imported from
 * browser code such as React components or Vue SFCs.
 */
export {
  WRAP_STYLES,
  ALIGN_STYLES,
  adaptCssForShadowDom,
} from "./preview-module";

import {
  WRAP_STYLES,
  ALIGN_STYLES,
  adaptCssForShadowDom,
} from "./preview-module";

/**
 * Copy theme-related attributes and classes from `<html>` to the shadow
 * host element so that CSS selectors like `:host(.dark)` work inside the
 * shadow DOM. Returns a cleanup function that disconnects the observer.
 */
export function syncThemeToHost(host: HTMLElement): () => void {
  const root = document.documentElement;

  function sync() {
    const theme = root.getAttribute("data-theme");
    if (theme) host.setAttribute("data-theme", theme);
    else host.removeAttribute("data-theme");

    host.classList.remove("light", "dark");
    if (root.classList.contains("dark")) host.classList.add("dark");
    else if (root.classList.contains("light")) host.classList.add("light");
  }

  sync();

  const observer = new MutationObserver(sync);
  observer.observe(root, {
    attributes: true,
    attributeFilter: ["class", "data-theme"],
  });
  return () => observer.disconnect();
}

/**
 * Attach a shadow DOM to the container and create a styled mount point.
 * Also starts syncing theme attributes from `<html>` to the host element.
 */
export function setupShadowPreview(
  container: HTMLElement,
  options: { align?: string; wrap?: string },
): {
  shadow: ShadowRoot;
  mountPoint: HTMLElement;
  cleanupThemeSync: () => void;
} {
  let shadow = container.shadowRoot;
  if (!shadow) {
    shadow = container.attachShadow({ mode: "open" });
  } else {
    shadow.innerHTML = "";
  }

  const mountPoint = document.createElement("div");
  const alignStyle =
    ALIGN_STYLES[options.align ?? "center"] ?? ALIGN_STYLES.center;
  const wrapStyle =
    options.wrap && WRAP_STYLES[options.wrap]
      ? `;${WRAP_STYLES[options.wrap]}`
      : "";
  mountPoint.style.cssText = `padding:16px;display:flex;${alignStyle}${wrapStyle}`;
  shadow.appendChild(mountPoint);

  const cleanupThemeSync = syncThemeToHost(container);

  return { shadow, mountPoint, cleanupThemeSync };
}

/**
 * Inject CSS into a shadow DOM for component rendering, and also inject
 * a global copy into `<head>` for portal/popover content that renders
 * outside the shadow DOM.
 */
export function injectPreviewCss(
  shadow: ShadowRoot,
  css: string,
  blockId: string,
): void {
  const style = document.createElement("style");
  style.textContent =
    adaptCssForShadowDom(css) + "\n:host{background-color:transparent}";
  shadow.prepend(style);

  const globalStyleId = `markstage-global-css-${blockId}`;
  if (!document.getElementById(globalStyleId)) {
    const globalStyle = document.createElement("style");
    globalStyle.id = globalStyleId;
    // Strip body{} rules to avoid interfering with the host page.
    globalStyle.textContent = css.replace(/\bbody\s*\{[^}]*\}/g, "");
    document.head.appendChild(globalStyle);
  }
}

/**
 * Remove the global CSS injected by `injectPreviewCss`.
 */
export function cleanupPreviewCss(blockId: string): void {
  document.getElementById(`markstage-global-css-${blockId}`)?.remove();
}
