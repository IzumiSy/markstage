import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { MDXProvider } from "@mdx-js/react";
import { entries, type PreviewEntry } from "virtual:previewer-entries";
import { mdxComponents } from "./mdx-components";
import { ThemeProvider, useTheme } from "./theme";

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
            backgroundColor: selected === entry.name ? "var(--ms-sidebar-active)" : "transparent",
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

function Header() {
  const { colorScheme, toggle } = useTheme();
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        height: 48,
        borderBottom: "1px solid var(--ms-border)",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
      <button
        onClick={toggle}
        aria-label={`Switch to ${colorScheme === "light" ? "dark" : "light"} theme`}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          color: "var(--ms-fg)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {colorScheme === "light" ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </button>
    </header>
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
          <Header />
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <Sidebar entries={entries} selected={selected} onSelect={setSelected} />
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
