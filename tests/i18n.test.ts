import { describe, expect, it } from "vitest";
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import { localizeMessage } from "../src/i18n/action-messages";
import { localePath, parseLocale } from "../src/i18n/routing";
import { formatDate } from "../src/lib/format-date";

function messageKeys(value: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = `${prefix}${key}`;
    return typeof entry === "string" ? [path] : messageKeys(entry as Record<string, unknown>, `${path}.`);
  });
}

describe("localization", () => {
  it("keeps English and French message catalogs in sync", () => {
    expect(messageKeys(fr).sort()).toEqual(messageKeys(en).sort());
  });

  it("uses unprefixed English and prefixed French URLs", () => {
    expect(localePath("en", "/releases")).toBe("/releases");
    expect(localePath("fr", "/releases")).toBe("/fr/releases");
    expect(localePath("fr", "/")).toBe("/fr");
    expect(parseLocale("fr")).toBe("fr");
    expect(parseLocale("unknown")).toBe("en");
  });

  it("localizes dates and server validation feedback", () => {
    const date = new Date("2026-09-30T00:00:00.000Z");
    expect(formatDate(date, "en")).toContain("Sep");
    expect(formatDate(date, "fr")).toContain("sept.");
    expect(localizeMessage("Choose a project.", "fr")).toBe("Choisissez un projet.");
  });
});
