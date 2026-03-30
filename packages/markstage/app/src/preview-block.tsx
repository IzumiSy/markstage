import { useEffect, useRef, useState } from "react";
import { CodeBlock } from "./code-block";

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

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function PreviewBlock({
  code,
  blockId,
  height,
}: {
  code: string;
  blockId: string;
  height?: string;
}) {
  const [open, setOpen] = useState(true);
  const [iframeHeight, setIframeHeight] = useState(height ? Number(height) : 150);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === "markstage-resize" && event.data.blockId === blockId) {
        setIframeHeight(event.data.height);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [blockId]);

  // Append a version hash so the iframe reloads on code changes (HMR)
  const version = hashCode(code);
  const iframeSrc = `${import.meta.env.BASE_URL}__markstage_preview/${blockId}.html?v=${version}`;

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
          backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          style={{
            width: "100%",
            height: iframeHeight,
            border: "none",
            display: "block",
          }}
          sandbox="allow-scripts allow-same-origin"
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
