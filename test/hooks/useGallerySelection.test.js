import { describe, test, expect, jest, beforeEach } from "@jest/globals";

let useGallerySelection;

// --- react mocks ---
const reactMock = {
  useCallback: jest.fn((fn) => fn),
};

// --- router mock ---
const mockNavigate = jest.fn();

// --- in-memory sessionStorage ---
function makeStorage() {
  const m = new Map();
  return {
    getItem: jest.fn((k) => (m.has(k) ? m.get(k) : null)),
    setItem: jest.fn((k, v) => m.set(k, String(v))),
    removeItem: jest.fn((k) => m.delete(k)),
    clear: jest.fn(() => m.clear()),
    get length() {
      return m.size;
    },
    __map: m,
  };
}

async function loadFresh() {
  jest.resetModules();
  jest.clearAllMocks();

  globalThis.sessionStorage = makeStorage();

  await jest.unstable_mockModule("react", () => ({
    __esModule: true,
    useCallback: reactMock.useCallback,
  }));

  await jest.unstable_mockModule("react-router-dom", () => ({
    __esModule: true,
    useNavigate: () => mockNavigate,
  }));

  ({ useGallerySelection } = await import(
      "../../src/ui/pages/Gallery/hooks/useGallerySelection.js"
      ));
}

function runHook() {
  return useGallerySelection();
}

beforeEach(() => {
  mockNavigate.mockClear();
});

describe("useGallerySelection (no jsdom, pure hook)", () => {
  test("returns early when item has neither svgPath nor svg", async () => {
    await loadFresh();
    const onSelect = runHook();

    onSelect({ id: "x1" });

    expect(sessionStorage.getItem("selectedDrawingId")).toBeNull();
    expect(sessionStorage.getItem("selectedSource")).toBeNull();
    expect(sessionStorage.getItem("templateGraphJSON")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("returns early when item is null or undefined", async () => {
    await loadFresh();
    const onSelect = runHook();

    onSelect(null);
    onSelect(undefined);

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(0);
  });

  test("stores local selection and navigates to /start", async () => {
    await loadFresh();
    const onSelect = runHook();

    onSelect({
      id: "local-123",
      svgPath: "M0 0",
      isTemplate: false,
    });

    expect(sessionStorage.getItem("selectedDrawingId")).toBe("local-123");
    expect(sessionStorage.getItem("selectedSource")).toBe("local");
    expect(sessionStorage.getItem("templateGraphJSON")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/start");
  });

  test("accepts svg when svgPath is missing", async () => {
    await loadFresh();
    const onSelect = runHook();

    onSelect({
      id: "local-svg",
      svg: "<svg />",
      isTemplate: false,
    });

    expect(sessionStorage.getItem("selectedDrawingId")).toBe("local-svg");
    expect(sessionStorage.getItem("selectedSource")).toBe("local");
    expect(mockNavigate).toHaveBeenCalledWith("/start");
  });

  test("stores templateGraphJSON when template has graphJSON", async () => {
    await loadFresh();
    const onSelect = runHook();

    const graph = { nodes: [1], edges: [] };

    onSelect({
      id: "tpl-1",
      svgPath: "M1 1",
      isTemplate: true,
      graphJSON: graph,
    });

    expect(sessionStorage.getItem("selectedDrawingId")).toBe("tpl-1");
    expect(sessionStorage.getItem("selectedSource")).toBe("template");
    expect(sessionStorage.getItem("templateGraphJSON")).toBe(
        JSON.stringify(graph)
    );
    expect(mockNavigate).toHaveBeenCalledWith("/start");
  });

  test("does not store templateGraphJSON when graphJSON is missing", async () => {
    await loadFresh();
    const onSelect = runHook();

    onSelect({
      id: "tpl-2",
      svgPath: "M2 2",
      isTemplate: true,
    });

    expect(sessionStorage.getItem("selectedDrawingId")).toBe("tpl-2");
    expect(sessionStorage.getItem("selectedSource")).toBe("template");
    expect(sessionStorage.getItem("templateGraphJSON")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/start");
  });
});
