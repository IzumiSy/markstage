import { useEffect, useRef, useState } from "react";
import { CodeBlock } from "./code-block";
import { useTheme } from "./theme";

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

function ExternalLinkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3H3v10h10V9" />
      <path d="M10 2h4v4" />
      <path d="M14 2L7 9" />
    </svg>
  );
}

function CodeSection({
  code,
  open,
  onToggle,
}: {
  code: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ borderTop: "1px solid var(--ms-border)" }}>
      <button
        type="button"
        onClick={onToggle}
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
          color: "var(--ms-fg-muted)",
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
  );
}

export function PreviewBlock({
  code,
  blockId,
  height,
  wrap,
  align,
  standalone,
}: {
  code: string;
  blockId: string;
  height?: string;
  wrap?: string;
  align?: string;
  standalone?: boolean;
}) {
  const DEFAULT_HEIGHT = 200;
  const [open, setOpen] = useState(true);
  const [iframeHeight, setIframeHeight] = useState(height ? Number(height) : DEFAULT_HEIGHT);
  const { colorScheme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build the initial URL (theme is applied via postMessage after load)
  const params = new URLSearchParams({ theme: colorScheme });
  if (wrap) params.set("wrap", wrap);
  if (align) params.set("align", align);
  const previewUrl = `/__preview/${blockId}?${params}`;

  // Sync theme changes to the iframe via postMessage instead of reloading
  const initialColorScheme = useRef(colorScheme);
  useEffect(() => {
    if (colorScheme === initialColorScheme.current) return;
    iframeRef.current?.contentWindow?.postMessage({ type: "mrp-theme", theme: colorScheme }, "*");
  }, [colorScheme]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "mrp-resize" && e.data?.blockId === blockId) {
        setIframeHeight(e.data.height);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [blockId]);

  return (
    <div
      style={{
        border: "1px solid var(--ms-border)",
        borderRadius: 8,
        overflow: "hidden",
        margin: "16px 0",
      }}
    >
      {standalone ? (
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "20px 16px",
            textDecoration: "none",
            color: "var(--ms-fg-muted)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--ms-code-bg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <ExternalLinkIcon />
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--ms-fg)",
              }}
            >
              Open full-page preview
            </span>
            <span style={{ fontSize: 12, color: "var(--ms-fg-muted)" }}>
              This component requires a full viewport to render correctly.
            </span>
          </span>
        </a>
      ) : (
        <div style={{ position: "relative" }}>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in separate page"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px solid var(--ms-border)",
              background: "var(--ms-bg)",
              color: "var(--ms-fg-muted)",
              cursor: "pointer",
              zIndex: 1,
              textDecoration: "none",
            }}
          >
            <ExternalLinkIcon />
          </a>
          <iframe
            ref={iframeRef}
            src={previewUrl}
            style={{
              display: "block",
              width: "100%",
              height: iframeHeight,
              border: "none",
              transition: "height 0.15s ease",
            }}
          />
        </div>
      )}
      <CodeSection code={code} open={open} onToggle={() => setOpen((v) => !v)} />
    </div>
  );
}
