import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { MDXProvider } from "@mdx-js/react";
import { entries, type PreviewEntry } from "virtual:previewer-entries";
import { mdxComponents } from "./mdx-components";
import { ThemeProvider } from "./theme";

const title: string = __PREVIEWER_TITLE__;

function getPathname() {
  return decodeURIComponent(window.location.pathname).replace(/^\//, "");
}

function usePathname() {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener("popstate", cb);
    return () => window.removeEventListener("popstate", cb);
  }, []);
  return useSyncExternalStore(subscribe, getPathname);
}

function Sidebar({
  entries: items,
  selected,
  onSelect,
}: {
  entries: PreviewEntry[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <nav
      style={{
        width: 220,
        borderRight: "1px solid var(--ms-border)",
        padding: "12px 0",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      {items.map((entry) => (
        <button
          key={entry.name}
          onClick={() => onSelect(entry.name)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "6px 16px",
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            backgroundColor:
              selected === entry.name
                ? "var(--ms-sidebar-active)"
                : "transparent",
            fontWeight: selected === entry.name ? 600 : 400,
            color: "var(--ms-fg)",
            fontFamily: "inherit",
          }}
        >
          {entry.name}
        </button>
      ))}
    </nav>
  );
}

function PreviewContent({ entry }: { entry: PreviewEntry }) {
  const { Component } = entry;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [entry.name]);

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: "auto",
        scrollbarWidth: "none",
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "24px 40px 80px",
        }}
      >
        <Component />
      </div>
    </div>
  );
}

export function App() {
  const pathname = usePathname();
  const selected = pathname || entries[0]?.name || null;
  const current = entries.find((e: PreviewEntry) => e.name === selected);

  // Redirect bare "/" to the first entry's path
  useEffect(() => {
    if (!pathname && entries[0]) {
      history.replaceState(null, "", `/${encodeURIComponent(entries[0].name)}`);
    }
  }, [pathname]);

  const setSelected = useCallback((name: string) => {
    history.pushState(null, "", `/${encodeURIComponent(name)}`);
    // pushState doesn't fire popstate, so dispatch one manually to trigger re-render
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  return (
    <ThemeProvider>
      <MDXProvider components={mdxComponents}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            fontFamily: "system-ui, sans-serif",
            backgroundColor: "var(--ms-bg)",
            color: "var(--ms-fg)",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 20px",
              height: 48,
              borderBottom: "1px solid var(--ms-border)",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
          </header>
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <Sidebar
              entries={entries}
              selected={selected}
              onSelect={setSelected}
            />
            {current ? (
              <PreviewContent entry={current} />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--ms-fg-muted)",
                }}
              >
                {entries.length === 0
                  ? "No .md files found."
                  : "Select a component from the sidebar."}
              </div>
            )}
          </div>
        </div>
      </MDXProvider>
    </ThemeProvider>
  );
}
