import { afterEach, describe, expect, it, vi } from "vitest";
import { cn, ehMac } from "./utils";

describe("cn", () => {
  it("junta classes e resolve conflitos do Tailwind", () => {
    expect(cn("p-2", "p-4", false && "x", undefined, "text-sm")).toBe("p-4 text-sm");
  });
});

describe("ehMac", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("é falso sem navigator", () => {
    vi.stubGlobal("navigator", undefined);
    expect(ehMac()).toBe(false);
  });
  it("detecta Mac pelo platform ou userAgent", () => {
    vi.stubGlobal("navigator", { platform: "MacIntel", userAgent: "" });
    expect(ehMac()).toBe(true);
    vi.stubGlobal("navigator", { platform: "", userAgent: "Mozilla/5.0 (Macintosh)" });
    expect(ehMac()).toBe(true);
    vi.stubGlobal("navigator", { platform: "Linux x86_64", userAgent: "Mozilla/5.0 (X11; Linux)" });
    expect(ehMac()).toBe(false);
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (X11; Linux)" });
    expect(ehMac()).toBe(false);
  });
});
