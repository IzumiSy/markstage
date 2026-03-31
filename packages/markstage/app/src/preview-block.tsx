import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { CodeBlock } from "./code-block";
import { registry } from "virtual:markstage-preview-registry";
import {
  setupShadowPreview,
  injectPreviewCss,
  cleanupPreviewCss,
} from "@izumisy/react-preview/dom";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: "transform 0.15s",
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
      }}
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

export function PreviewBlock({
  code,
  blockId,
  height,
  wrap,
  align,
}: {
  code: string;
  blockId: string;
  height?: string;
  wrap?: string;
  align?: string;
}) {
  const [open, setOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const { shadow, mountPoint, cleanupThemeSync } = setupShadowPreview(el, {
      align,
      wrap,
    });

    registry[blockId]?.().then((mod) => {
      if (mod.css) injectPreviewCss(shadow, mod.css, blockId);
      rootRef.current = createRoot(mountPoint);
      rootRef.current.render(<mod.default />);
    });

    return () => {
      cleanupThemeSync();
      rootRef.current?.unmount();
      rootRef.current = null;
      cleanupPreviewCss(blockId);
    };
  }, [blockId, wrap, align]);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
        margin: "16px 0",
      }}
    >
      <div
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        <div
          ref={containerRef}
          style={{
            minHeight: height ? Number(height) : undefined,
          }}
        />
      </div>
      <div
        style={{
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            width: "100%",
            padding: "8px 12px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            color: "var(--fg-muted)",
            fontFamily: "inherit",
          }}
        >
          <ChevronIcon open={open} />
          Code
        </button>
        {open && (
          <CodeBlock className="language-tsx" noBorderRadius>
            {code}
          </CodeBlock>
        )}
      </div>
    </div>
  );
}
