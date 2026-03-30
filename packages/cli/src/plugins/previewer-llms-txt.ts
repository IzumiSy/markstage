import { basename, relative } from "node:path";
import type { Plugin } from "vite";
import type { PreviewerRepo } from "../config";

/**
 * Serves `/llms.txt` as a plain-text endpoint that describes all discovered
 * preview entries in the llms.txt format (https://llmstxt.org/).
 *
 * - Dev: intercepts the request via `configureServer` middleware.
 * - Build: emits `llms.txt` as a static asset via `generateBundle`.
 */
export function previewerLlmsTxtPlugin(
  title: string,
  hostRoot: string,
  glob: string,
  repo?: PreviewerRepo,
): Plugin {
  async function buildLlmsTxt(): Promise<string> {
    const fg = await import("fast-glob");
    const { readFile } = await import("node:fs/promises");

    const files = await fg.default(glob, { cwd: hostRoot, absolute: true });

    // Parse frontmatter from each file
    interface FmEntry {
      title: string;
      description: string;
      group: string;
      order: number;
      filePath: string;
      hidden?: boolean;
    }

    const fmEntries: FmEntry[] = [];
    for (const file of files) {
      const content = await readFile(file, "utf-8");
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (!match) continue;

      const yaml = match[1];
      const get = (key: string) => {
        const m = yaml.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
        return m ? m[1].trim() : undefined;
      };

      if (get("hidden") === "true") continue;

      // Parse sidebar nested fields
      const sidebarMatch = yaml.match(/^sidebar:\n((?:\s{2}\w+:.*\n?)*)/m);
      const sidebarYaml = sidebarMatch ? sidebarMatch[1] : "";
      const getSidebar = (key: string) => {
        const m = sidebarYaml.match(new RegExp(`^\\s{2}${key}:\\s*(.+)$`, "m"));
        return m ? m[1].trim() : undefined;
      };

      fmEntries.push({
        title: get("title") ?? basename(file).replace(/\.preview\.mdx$/, ""),
        description: get("description") ?? "",
        group: getSidebar("group") ?? "Ungrouped",
        order: Number(getSidebar("order") ?? 999),
        filePath: relative(hostRoot, file),
        hidden: get("hidden") === "true",
      });
    }

    // Group entries
    const groupMap = new Map<string, FmEntry[]>();
    for (const entry of fmEntries) {
      const group = groupMap.get(entry.group) ?? [];
      group.push(entry);
      groupMap.set(entry.group, group);
    }
    for (const group of groupMap.values()) {
      group.sort((a, b) => a.order - b.order);
    }

    const ref = repo?.ref ?? "main";

    function buildSourceUrl(entry: FmEntry): string {
      const repoUrl = repo?.url?.replace(/\/+$/, "");
      if (!repoUrl) return "";
      const rawBase = repoUrl.replace(
        /^https:\/\/github\.com\//,
        "https://raw.githubusercontent.com/",
      );
      return `${rawBase}/${ref}/${entry.filePath.replace(/^\/+/, "")}`;
    }

    const lines: string[] = [];
    lines.push(`# ${title}`);
    lines.push("");
    lines.push(`> ${fmEntries.length} components across ${groupMap.size} groups`);
    lines.push("");

    for (const [groupName, groupEntries] of groupMap) {
      lines.push(`## ${groupName}`);
      lines.push("");
      for (const entry of groupEntries) {
        const url = buildSourceUrl(entry);
        const link = url ? `[${entry.title}](${url})` : entry.title;
        const desc = entry.description ? `: ${entry.description}` : "";
        lines.push(`- ${link}${desc}`);
      }
      lines.push("");
    }

    const repoUrl = repo?.url?.replace(/\/+$/, "");
    if (repoUrl) {
      lines.push("## Reference");
      lines.push("");
      lines.push(`- [Repository](${repoUrl})`);
      lines.push("");
    }

    return lines.join("\n");
  }

  return {
    name: "previewer-llms-txt",

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/llms.txt") return next();

        buildLlmsTxt()
          .then((text) => {
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(text);
          })
          .catch(next);
      });
    },

    async generateBundle() {
      const text = await buildLlmsTxt();
      this.emitFile({
        type: "asset",
        fileName: "llms.txt",
        source: text,
      });
    },
  };
}
