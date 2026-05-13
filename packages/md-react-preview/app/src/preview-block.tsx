import { useCallback, useEffect, useRef, useState } from "react";
import { CodeBlock } from "./code-block";
import { useTheme } from "./theme";

function CloseIcon() {
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
    >
      <path d="M4 4l8 8" />
      <path d="M12 4l-8 8" />
    </svg>
  );
}

function ExpandIcon() {
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
      <path d="M3 10v3h3" />
      <path d="M13 6V3h-3" />
      <path d="M3 13l4-4" />
      <path d="M13 3l-4 4" />
    </svg>
  );
}

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

function StandalonePreview({
  blockId,
  previewUrl,
  colorScheme,
}: {
  blockId: string;
  previewUrl: string;
  colorScheme: string;
}) {
  const THUMBNAIL_VIEWPORT_WIDTH = 1280;
  const THUMBNAIL_VIEWPORT_HEIGHT = 720;
  const THUMBNAIL_SCALE = 0.2;

  const popoverId = `mrp-popover-${blockId}`;
  const popoverRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const thumbnailIframeRef = useRef<HTMLIFrameElement>(null);

  // Sync theme to both iframes
  useEffect(() => {
    for (const ref of [iframeRef, thumbnailIframeRef]) {
      ref.current?.contentWindow?.postMessage(
        { type: "mrp-theme", theme: colorScheme },
        window.location.origin,
      );
    }
  }, [colorScheme]);

  const handleToggle = useCallback(
    (e: React.ToggleEvent<HTMLDivElement>) => {
      if (e.newState === "open") {
        requestAnimationFrame(() => {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "mrp-theme", theme: colorScheme },
            window.location.origin,
          );
        });
      }
    },
    [colorScheme],
  );

  return (
    <>
      <style>{`#${popoverId}::backdrop { background: rgba(0, 0, 0, 0.5); }`}</style>
      <button
        type="button"
        // @ts-expect-error -- popoverTarget is not yet in React's type definitions
        popoverTarget={popoverId}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          width: "100%",
          padding: "16px",
          textDecoration: "none",
          color: "var(--ms-fg-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--ms-code-bg)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <div
          style={{
            width: THUMBNAIL_VIEWPORT_WIDTH * THUMBNAIL_SCALE,
            height: THUMBNAIL_VIEWPORT_HEIGHT * THUMBNAIL_SCALE,
            overflow: "hidden",
            borderRadius: 6,
            border: "1px solid var(--ms-border)",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <iframe
            ref={thumbnailIframeRef}
            src={previewUrl}
            tabIndex={-1}
            aria-hidden="true"
            style={{
              display: "block",
              width: THUMBNAIL_VIEWPORT_WIDTH,
              height: THUMBNAIL_VIEWPORT_HEIGHT,
              border: "none",
              transform: `scale(${THUMBNAIL_SCALE})`,
              transformOrigin: "top left",
              pointerEvents: "none",
            }}
          />
        </div>
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            textAlign: "left",
          }}
        >
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
      </button>
      {/* @ts-expect-error -- popover attribute is not yet in React's type definitions */}
      <div
        ref={popoverRef}
        id={popoverId}
        popover="auto"
        onToggle={handleToggle}
        style={{
          position: "fixed",
          inset: 0,
          width: "90vw",
          height: "90vh",
          margin: "auto",
          padding: 0,
          border: "1px solid var(--ms-border)",
          borderRadius: 12,
          overflow: "hidden",
          background: "var(--ms-bg)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderBottom: "1px solid var(--ms-border)",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--ms-fg-muted)" }}>Preview</span>
          <button
            type="button"
            // @ts-expect-error -- popoverTarget is not yet in React's type definitions
            popoverTarget={popoverId}
            popoverTargetAction="hide"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px solid var(--ms-border)",
              background: "none",
              color: "var(--ms-fg-muted)",
              cursor: "pointer",
            }}
          >
            <CloseIcon />
          </button>
        </div>
        <iframe
          ref={iframeRef}
          src={previewUrl}
          style={{
            display: "block",
            width: "100%",
            height: "calc(100% - 45px)",
            border: "none",
          }}
        />
      </div>
    </>
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
  const expandIframeRef = useRef<HTMLIFrameElement>(null);
  const expandPopoverId = `mrp-expand-${blockId}`;

  // Build the initial URL (theme is applied via postMessage after load)
  const params = new URLSearchParams({ theme: colorScheme });
  if (wrap) params.set("wrap", wrap);
  if (align) params.set("align", align);
  const previewUrl = `/__preview/${blockId}?${params}`;

  // Sync theme changes to the iframe via postMessage instead of reloading
  const initialColorScheme = useRef(colorScheme);
  useEffect(() => {
    if (colorScheme === initialColorScheme.current) return;
    // Security: specify origin instead of "*" to restrict postMessage recipients
    for (const ref of [iframeRef, expandIframeRef]) {
      ref.current?.contentWindow?.postMessage(
        { type: "mrp-theme", theme: colorScheme },
        window.location.origin,
      );
    }
  }, [colorScheme]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      // Security: validate postMessage origin to prevent cross-origin message spoofing
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "mrp-resize" && e.data?.blockId === blockId) {
        // Ignore resize messages from the expand popover iframe
        if (e.source === expandIframeRef.current?.contentWindow) return;
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
        <StandalonePreview blockId={blockId} previewUrl={previewUrl} colorScheme={colorScheme} />
      ) : (
        <div style={{ position: "relative" }}>
          <button
            type="button"
            // @ts-expect-error -- popoverTarget is not yet in React's type definitions
            popoverTarget={expandPopoverId}
            title="Expand preview"
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
            }}
          >
            <ExpandIcon />
          </button>
          {/*
            Security note: no sandbox attribute is set on this iframe.
            Preview blocks are authored by trusted developers (markdown authors),
            and adding sandbox="allow-scripts" alone would break ES module loading
            (CORS) and postMessage origin checks. Adding both allow-scripts and
            allow-same-origin together provides no real security benefit for
            same-origin iframes.
          */}
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
      {/* Expand popover for non-standalone blocks */}
      {!standalone && (
        <>
          <style>{`#${expandPopoverId}::backdrop { background: rgba(0, 0, 0, 0.5); }`}</style>
          {/* @ts-expect-error -- popover attribute is not yet in React's type definitions */}
          <div
            id={expandPopoverId}
            popover="auto"
            style={{
              position: "fixed",
              inset: 0,
              width: "90vw",
              height: "90vh",
              margin: "auto",
              padding: 0,
              border: "1px solid var(--ms-border)",
              borderRadius: 12,
              overflow: "hidden",
              background: "var(--ms-bg)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderBottom: "1px solid var(--ms-border)",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--ms-fg-muted)" }}>Preview</span>
              <button
                type="button"
                // @ts-expect-error -- popoverTarget is not yet in React's type definitions
                popoverTarget={expandPopoverId}
                popoverTargetAction="hide"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "1px solid var(--ms-border)",
                  background: "none",
                  color: "var(--ms-fg-muted)",
                  cursor: "pointer",
                }}
              >
                <CloseIcon />
              </button>
            </div>
            <iframe
              ref={expandIframeRef}
              src={previewUrl}
              style={{
                display: "block",
                width: "100%",
                height: "calc(100% - 45px)",
                border: "none",
              }}
            />
          </div>
        </>
      )}
      <CodeSection code={code} open={open} onToggle={() => setOpen((v) => !v)} />
    </div>
  );
}
