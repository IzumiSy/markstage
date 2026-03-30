import { describe, it, expect, vi } from "vitest";
import { resolve } from "node:path";
import { extractProps, extractTypeDescription } from "./extract-props";

const FIXTURE = resolve(__dirname, "__fixtures__", "sample-types.ts");

describe("extractProps", () => {
  it("extracts all properties from a type alias", () => {
    const props = extractProps(FIXTURE, "ButtonProps");
    const names = props.map((p) => p.name);
    expect(names).toContain("variant");
    expect(names).toContain("label");
    expect(names).toContain("disabled");
    expect(names).toContain("onClick");
    expect(names).toContain("size");
  });

  it("marks required vs optional correctly", () => {
    const props = extractProps(FIXTURE, "ButtonProps");
    const variant = props.find((p) => p.name === "variant")!;
    const disabled = props.find((p) => p.name === "disabled")!;
    expect(variant.required).toBe(true);
    expect(disabled.required).toBe(false);
  });

  it("extracts JSDoc descriptions", () => {
    const props = extractProps(FIXTURE, "ButtonProps");
    const variant = props.find((p) => p.name === "variant")!;
    expect(variant.description).toBe("The visual style variant");
  });

  it("extracts @default tag values", () => {
    const props = extractProps(FIXTURE, "ButtonProps");
    const size = props.find((p) => p.name === "size")!;
    expect(size.defaultValue).toBe('"md"');
  });

  it("sorts required props before optional ones", () => {
    const props = extractProps(FIXTURE, "ButtonProps");
    const firstOptionalIndex = props.findIndex((p) => !p.required);
    const lastRequiredIndex = props.findLastIndex((p) => p.required);
    if (firstOptionalIndex !== -1 && lastRequiredIndex !== -1) {
      expect(lastRequiredIndex).toBeLessThan(firstOptionalIndex);
    }
  });

  it("handles intersection types", () => {
    const props = extractProps(FIXTURE, "Extended");
    const names = props.map((p) => p.name);
    expect(names).toContain("id");
    expect(names).toContain("name");
    expect(names).toContain("email");
    expect(names).toContain("isAdmin");
  });

  it("handles Pick<> utility type", () => {
    const props = extractProps(FIXTURE, "Picked");
    const names = props.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(["variant", "label"]));
    expect(names).not.toContain("disabled");
    expect(names).not.toContain("onClick");
  });

  it("handles Omit<> utility type", () => {
    const props = extractProps(FIXTURE, "Omitted");
    const names = props.map((p) => p.name);
    expect(names).toContain("variant");
    expect(names).toContain("label");
    expect(names).toContain("disabled");
    expect(names).not.toContain("onClick");
    expect(names).not.toContain("size");
  });

  it("returns empty array for non-existent type", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const props = extractProps(FIXTURE, "NonExistent");
    expect(props).toEqual([]);
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/NonExistent.*sample-types\.ts/));
    spy.mockRestore();
  });
});

describe("extractTypeDescription", () => {
  it("extracts JSDoc description from a type alias", () => {
    const desc = extractTypeDescription(FIXTURE, "ButtonProps");
    expect(desc).toBe("Description of the button");
  });

  it("returns undefined for type without JSDoc", () => {
    const desc = extractTypeDescription(FIXTURE, "Picked");
    expect(desc).toBeUndefined();
  });

  it("returns undefined for non-existent type", () => {
    const desc = extractTypeDescription(FIXTURE, "NonExistent");
    expect(desc).toBeUndefined();
  });
});
