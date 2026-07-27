import { describe, expect, it } from "vitest";
import { resolveLocaleFromAcceptLanguage } from "./locale";

describe("resolveLocaleFromAcceptLanguage", () => {
  it("uses French when the browser prefers French", () => {
    expect(resolveLocaleFromAcceptLanguage("fr-FR,fr;q=0.9,en;q=0.8")).toBe(
      "fr",
    );
  });

  it("uses English when the browser prefers English", () => {
    expect(resolveLocaleFromAcceptLanguage("en-US,en;q=0.9,fr;q=0.8")).toBe(
      "en",
    );
  });

  it("falls back to English for unsupported languages", () => {
    expect(resolveLocaleFromAcceptLanguage("de-DE,de;q=0.9")).toBe("en");
  });
});
