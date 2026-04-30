import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("child_process")>();
  return {
    ...actual,
    exec: vi.fn((_cmd: string, callback: any) => {
      callback(null);
      return {} as any;
    }),
  };
});

import { extractLocalUrl, extractPort, VITE_LOCAL_URL_REGEX, openBrowser } from "../../launcher";
import * as childProcess from "child_process";

describe("extractLocalUrl", () => {
  it("extracts URL from standard Vite output", () => {
    const output = "  ➜  Local:   http://localhost:5173/";
    expect(extractLocalUrl(output)).toBe("http://localhost:5173/");
  });

  it("extracts URL with alternative port", () => {
    const output = "  ➜  Local:   http://localhost:5174/";
    expect(extractLocalUrl(output)).toBe("http://localhost:5174/");
  });

  it("extracts URL without trailing slash", () => {
    const output = "  ➜  Local:   http://localhost:3000";
    expect(extractLocalUrl(output)).toBe("http://localhost:3000");
  });

  it("extracts URL from multiline output", () => {
    const output = `
  VITE v6.0.0  ready in 320 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
`;
    expect(extractLocalUrl(output)).toBe("http://localhost:5173/");
  });

  it("returns null when no URL is present", () => {
    expect(extractLocalUrl("Starting server...")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractLocalUrl("")).toBeNull();
  });

  it("extracts URL with high port number", () => {
    const output = "  ➜  Local:   http://localhost:49152/";
    expect(extractLocalUrl(output)).toBe("http://localhost:49152/");
  });
});

describe("extractPort", () => {
  it("extracts port from standard URL", () => {
    expect(extractPort("http://localhost:5173/")).toBe(5173);
  });

  it("extracts alternative port", () => {
    expect(extractPort("http://localhost:5174/")).toBe(5174);
  });

  it("extracts port without trailing slash", () => {
    expect(extractPort("http://localhost:3000")).toBe(3000);
  });

  it("returns null for invalid URL", () => {
    expect(extractPort("not-a-url")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractPort("")).toBeNull();
  });
});

describe("VITE_LOCAL_URL_REGEX", () => {
  it("matches standard Vite local output format", () => {
    expect(VITE_LOCAL_URL_REGEX.test("Local:   http://localhost:5173/")).toBe(true);
  });

  it("does not match Network line", () => {
    expect(VITE_LOCAL_URL_REGEX.test("Network: http://192.168.1.1:5173/")).toBe(false);
  });
});

const mockExec = vi.mocked(childProcess.exec);

describe("openBrowser", () => {
  beforeEach(() => {
    mockExec.mockReset();
    mockExec.mockImplementation((_cmd: any, callback: any) => {
      callback(null);
      return {} as any;
    });
  });

  it("calls exec with the correct start command", async () => {
    await openBrowser("http://localhost:5173/");

    expect(mockExec).toHaveBeenCalledWith(
      'start "" "http://localhost:5173/"',
      expect.any(Function)
    );
  });

  it("logs URL to console when exec fails", async () => {
    mockExec.mockImplementation((_cmd: any, callback: any) => {
      callback(new Error("command not found"));
      return {} as any;
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await openBrowser("http://localhost:3000/");

    expect(errorSpy).toHaveBeenCalledWith("Failed to open browser automatically.");
    expect(errorSpy).toHaveBeenCalledWith(
      "Please open the following URL manually: http://localhost:3000/"
    );

    errorSpy.mockRestore();
  });

  it("resolves even when exec fails", async () => {
    mockExec.mockImplementation((_cmd: any, callback: any) => {
      callback(new Error("fail"));
      return {} as any;
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(openBrowser("http://localhost:5173/")).resolves.toBeUndefined();

    errorSpy.mockRestore();
  });
});
