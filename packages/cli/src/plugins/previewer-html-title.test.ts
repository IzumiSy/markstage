import { describe, it, expect } from "vitest";
import { previewerHtmlTitlePlugin } from "./previewer-html-title";

describe("previewerHtmlTitlePlugin", () => {
  it("replaces all {{title}} occurrences in HTML", () => {
    const plugin = previewerHtmlTitlePlugin("My Components");
    const html = "<html><head><title>{{title}}</title></head><body>{{title}}</body></html>";
    const result = (plugin.transformIndexHtml as (html: string) => string)(html);
    expect(result).toBe(
      "<html><head><title>My Components</title></head><body>My Components</body></html>",
    );
  });

  it("returns HTML unchanged when no {{title}} present", () => {
    const plugin = previewerHtmlTitlePlugin("Test");
    const html = "<html><head><title>Static</title></head></html>";
    const result = (plugin.transformIndexHtml as (html: string) => string)(html);
    expect(result).toBe(html);
  });
});
