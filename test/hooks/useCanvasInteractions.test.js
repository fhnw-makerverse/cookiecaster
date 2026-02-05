import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";

let useCanvasInteractions;

// ---- shared mutable stubs ----
let graphSvc, ctr, svgh;
let importCC3FileMock, exportCC3FileMock;
let analyzeGraphMock, saveGraphMock;

// React useEffect mock: run effect immediately + capture cleanup
let lastCleanup;
const reactMock = {
  useEffect: jest.fn((fn) => {
    lastCleanup = fn();
  }),
};

// Simple in-memory storages (Node-friendly)
function makeStorage() {
  const m = new Map();
  return {
    getItem: jest.fn((k) => (m.has(k) ? m.get(k) : null)),
    setItem: jest.fn((k, v) => m.set(k, String(v))),
    removeItem: jest.fn((k) => m.delete(k)),
    clear: jest.fn(() => m.clear()),
    __map: m,
  };
}

// d3 mock with handler registry + simple state for attrs/classes/properties
function makeD3Mock() {
  const registry = new Map(); // key: `${selector}|${event}` => fn
  const attrs = new Map(); // key: `${selector}|${attr}` => value
  const classes = new Map(); // key: `${selector}|class:${name}` => bool
  const props = new Map(); // key: `${selector}|prop:${name}` => value

  const svgNode = { __isSvgNode: true };

  const makeSelection = (selector, nodeObj = null) => {
    const sel = {
      attr: jest.fn((k, v) => {
        attrs.set(`${selector}|${k}`, v);
        return sel;
      }),
      classed: jest.fn((k, v) => {
        classes.set(`${selector}|class:${k}`, Boolean(v));
        return sel;
      }),
      property: jest.fn((k, v) => {
        props.set(`${selector}|prop:${k}`, v);
        return sel;
      }),
      on: jest.fn((event, fn) => {
        // d3 allows namespaces like ".pointerdown" — treat as distinct key
        registry.set(`${selector}|${event}`, fn);
        return sel;
      }),
      node: jest.fn(() => nodeObj),
      remove: jest.fn(() => {
        registry.set(`${selector}|__removed`, true);
      }),
    };
    return sel;
  };

  const d3 = {
    __registry: registry,
    __attrs: attrs,
    __classes: classes,
    __props: props,
    __svgNode: svgNode,

    selectAll: jest.fn((selector) => makeSelection(`ALL:${selector}`)),
    select: jest.fn((selectorOrNode) => {
      if (selectorOrNode && typeof selectorOrNode === "object") {
        return makeSelection("SVG", svgNode);
      }
      return makeSelection(String(selectorOrNode));
    }),

    pointer: jest.fn((_evt, _node) => [10.4, 20.6]), // rounds to {10,21}
  };

  return d3;
}

async function loadFresh({
                           selectedSource,
                           selectedId,
                           templateGraphJSON,
                           localDrawings,
                           graphToJSON,
                         } = {}) {
  jest.resetModules();
  jest.clearAllMocks();
  lastCleanup = undefined;

  globalThis.localStorage = makeStorage();
  globalThis.sessionStorage = makeStorage();

  if (selectedId) globalThis.sessionStorage.setItem("selectedDrawingId", selectedId);
  if (selectedSource) globalThis.sessionStorage.setItem("selectedSource", selectedSource);
  if (templateGraphJSON !== undefined) {
    globalThis.sessionStorage.setItem("templateGraphJSON", JSON.stringify(templateGraphJSON));
  }
  if (localDrawings !== undefined) {
    globalThis.localStorage.setItem("drawings", JSON.stringify(localDrawings));
  }

  const keyHandlers = new Map();
  globalThis.window = {
    addEventListener: jest.fn((type, fn) => keyHandlers.set(type, fn)),
    removeEventListener: jest.fn((type, fn) => {
      if (keyHandlers.get(type) === fn) keyHandlers.delete(type);
    }),
    __keyHandlers: keyHandlers,
  };

  // MutationObserver used by hook
  const obs = [];
  globalThis.MutationObserver = class {
    constructor(cb) {
      this.cb = cb;
      obs.push(this);
      this.observe = jest.fn();
      this.disconnect = jest.fn();
    }
  };
  globalThis.__mutationObservers = obs;

  const d3 = makeD3Mock();

  // Needed because hook does document.querySelector("#reset")?.click()
  globalThis.document = {
    body: { __isBody: true },
    querySelector: jest.fn((sel) => {
      if (sel !== "#reset") return null;
      return {
        click: () => {
          const fn = d3.__registry.get("#reset|click");
          if (fn) fn();
        },
      };
    }),
  };

  globalThis.alert = jest.fn();

  // services injected via useServices()
  graphSvc = {
    fromJSON: jest.fn(),
    toJSON: jest.fn(() => (graphToJSON !== undefined ? graphToJSON : { g: 1 })),
  };

  svgh = {
    updateMessage: jest.fn(),
    clearWarnings: jest.fn(),
    redraw: jest.fn(),
  };

  ctr = {
    modi: {
      MODE_DRAW: { enable: jest.fn(), disable: jest.fn() },
      MODE_SELECT: { enable: jest.fn(), disable: jest.fn() },
      MODE_MOVE: { enable: jest.fn(), disable: jest.fn() },
      MODE_ROTATE: { enable: jest.fn(), disable: jest.fn() },
    },
    _mode: undefined,
    reset: jest.fn(),
    mouseDown: jest.fn(),
    mouseMove: jest.fn(),
    mouseUp: jest.fn(),
    escape: jest.fn(),
    erase: jest.fn(),
    copy: jest.fn(),
    mirror: jest.fn(),
  };
  Object.defineProperty(ctr, "mode", {
    get() {
      return this._mode;
    },
    set(newMode) {
      if (newMode === this._mode) return;
      if (this._mode && typeof this._mode.disable === "function") this._mode.disable();
      this._mode = newMode;
      if (this._mode && typeof this._mode.enable === "function") this._mode.enable();
    },
    configurable: true,
    enumerable: true,
  });

  importCC3FileMock = jest.fn();
  exportCC3FileMock = jest.fn();
  analyzeGraphMock = jest.fn();
  saveGraphMock = jest.fn();

  await jest.unstable_mockModule("react", () => ({
    __esModule: true,
    useEffect: reactMock.useEffect,
  }));
  await jest.unstable_mockModule("d3", () => ({ __esModule: true, ...d3 }));

  await jest.unstable_mockModule(
      "../../src/business-logic/services/ServicesProvider.jsx",
      () => ({
        __esModule: true,
        useServices: () => ({ controller: ctr, graph: graphSvc, svgHandler: svgh }),
      })
  );

  await jest.unstable_mockModule("../../src/utils/FileImport.js", () => ({
    __esModule: true,
    importCC3File: importCC3FileMock,
  }));

  await jest.unstable_mockModule("../../src/utils/FileExport.js", () => ({
    __esModule: true,
    exportCC3File: exportCC3FileMock,
  }));

  ({ default: useCanvasInteractions } = await import(
      "../../src/ui/pages/Start/hooks/useCanvasInteractions.js"
      ));

  return { d3 };
}

function runHook({ d3, analyzeStatus = false } = {}) {
  const svgRef = { current: { __isSvgRefEl: true } };

  const api = useCanvasInteractions({
    svgRef,
    analyze: { status: analyzeStatus },
    analyzeGraph: analyzeGraphMock,
    saveGraph: saveGraphMock,
  });

  expect(reactMock.useEffect).toHaveBeenCalled();
  return { api, svgRef, d3 };
}

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  if (typeof lastCleanup === "function") lastCleanup();
});

describe("useCanvasInteractions (no jsdom)", () => {
  test("exportToFile (api): calls graphSvc.toJSON and exportCC3File(data,'drawing')", async () => {
    const { d3 } = await loadFresh({ graphToJSON: { nodes: [1], edges: [] } });
    const { api } = runHook({ d3 });

    // clear calls made by useEffect/updateSaveButtonEnabled during mount
    graphSvc.toJSON.mockClear();
    exportCC3FileMock.mockClear();

    api.exportToFile();

    expect(graphSvc.toJSON).toHaveBeenCalledTimes(1);
    expect(exportCC3FileMock).toHaveBeenCalledWith({ nodes: [1], edges: [] }, "drawing");
  });

  test("importFromFile (api): early return when importCC3File returns null", async () => {
    const { d3 } = await loadFresh();
    const { api } = runHook({ d3 });

    importCC3FileMock.mockResolvedValue(null);

    await api.importFromFile();

    expect(ctr.reset).not.toHaveBeenCalled();
    expect(graphSvc.fromJSON).not.toHaveBeenCalled();
    expect(globalThis.alert).not.toHaveBeenCalled();
  });

  test("importFromFile (api): success resets controller, loads graphJSON as string, sets mode to MODE_SELECT, alerts", async () => {
    const { d3 } = await loadFresh();
    const { api } = runHook({ d3 });

    importCC3FileMock.mockResolvedValue({ graphJSON: { foo: 1 } });

    const enableSpy = jest.fn();
    ctr.modi.MODE_SELECT = { enable: enableSpy, disable: jest.fn() };

    await api.importFromFile();

    expect(ctr.reset).toHaveBeenCalledTimes(1);

    expect(graphSvc.fromJSON).toHaveBeenCalledTimes(1);
    const arg = graphSvc.fromJSON.mock.calls[0][0];
    expect(typeof arg).toBe("string");
    expect(arg).toContain('"foo":1');

    expect(svgh.updateMessage).toHaveBeenCalledTimes(1);
    expect(ctr.mode).toBe(ctr.modi.MODE_SELECT);
    expect(enableSpy).toHaveBeenCalledTimes(1);
    expect(globalThis.alert).toHaveBeenCalled();
  });

  test("useEffect: sets navbar id, installs pointer + keyboard handlers, initializes mode to MODE_DRAW when no figure loaded and ctr.mode falsy", async () => {
    const { d3 } = await loadFresh({
      graphToJSON: { nodes: [], edges: [] }, // no content
    });
    ctr.mode = undefined;

    runHook({ d3 });

    expect(d3.selectAll).toHaveBeenCalledWith("nav.navbar.navbar-default");
    expect(d3.__attrs.get("ALL:nav.navbar.navbar-default|id")).toBe("startNavBar");

    expect(d3.__registry.get("SVG|pointerdown")).toEqual(expect.any(Function));
    expect(d3.__registry.get("SVG|pointermove")).toEqual(expect.any(Function));
    expect(d3.__registry.get("SVG|pointerup")).toEqual(expect.any(Function));
    expect(d3.__registry.get("SVG|pointercancel")).toEqual(expect.any(Function));
    expect(d3.__registry.get("SVG|mouseleave")).toEqual(expect.any(Function));

    expect(window.addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));

    expect(ctr.mode).toBe(ctr.modi.MODE_DRAW);
  });

  test("pointerdown: clears warnings when analyze.status true, removes #layer, calls ctr.mouseDown(pointerPos)", async () => {
    const { d3 } = await loadFresh();
    runHook({ d3, analyzeStatus: true });

    const onDown = d3.__registry.get("SVG|pointerdown");
    onDown({ type: "pointerdown" });

    expect(svgh.clearWarnings).toHaveBeenCalledTimes(1);
    expect(d3.__registry.get("#layer|__removed")).toBe(true);
    expect(ctr.mouseDown).toHaveBeenCalledWith({ x: 10, y: 21 });
  });

  test("pointermove: calls ctr.mouseMove(pointerPos)", async () => {
    const { d3 } = await loadFresh();
    runHook({ d3 });

    const onMove = d3.__registry.get("SVG|pointermove");
    onMove({ type: "pointermove" });

    expect(ctr.mouseMove).toHaveBeenCalledWith({ x: 10, y: 21 });
  });

  test("pointerup: calls ctr.mouseUp, writes temp autosave to localStorage (saved drawings retained), and re-checks Save button state", async () => {
    const { d3 } = await loadFresh({
      graphToJSON: { nodes: [1], edges: [] }, // content for autosave + enables save
      localDrawings: [
        { id: "a", saved: true, graphJSON: { nodes: [1], edges: [] } },
        { id: "b", saved: false, graphJSON: { nodes: [2], edges: [] } },
      ],
    });
    runHook({ d3 });

    const onUp = d3.__registry.get("SVG|pointerup");
    onUp();

    expect(ctr.mouseUp).toHaveBeenCalledTimes(1);

    const saved = JSON.parse(localStorage.setItem.mock.calls.at(-1)[1]);
    expect(saved.find((d) => d.id === "b")).toBeUndefined();

    const temp = saved.find((d) => d.id === "temp-autosave");
    expect(temp).toBeDefined();
    expect(temp.saved).toBe(false);
    expect(temp.graphJSON).toEqual({ nodes: [1], edges: [] });
    expect(typeof temp.timestamp).toBe("string");
  });

  test("keyboard handler: Escape/Delete/c with ctrl/meta call controller actions", async () => {
    const { d3 } = await loadFresh();
    runHook({ d3 });

    const onKeyDown = window.addEventListener.mock.calls.find(([t]) => t === "keydown")[1];

    onKeyDown({ key: "Escape" });
    expect(ctr.escape).toHaveBeenCalledTimes(1);

    onKeyDown({ key: "Delete" });
    expect(ctr.erase).toHaveBeenCalledTimes(1);

    onKeyDown({ key: "c", ctrlKey: true });
    expect(ctr.copy).toHaveBeenCalledTimes(1);

    onKeyDown({ key: "c", metaKey: true });
    expect(ctr.copy).toHaveBeenCalledTimes(2);

    onKeyDown({ key: "x" }); // no-op
  });

  test("sidebar: reset clears controller and removes unsaved; mode buttons set ctr.mode; mirror/copy/erase call methods; analyze calls analyzeGraph", async () => {
    const { d3 } = await loadFresh({
      localDrawings: [
        { id: "keep", saved: true },
        { id: "drop", saved: false },
      ],
    });

    runHook({ d3 });

    d3.__registry.get("#reset|click")();
    expect(ctr.reset).toHaveBeenCalledTimes(1);

    const drawingsSaved = JSON.parse(localStorage.setItem.mock.calls.at(-1)[1]);
    expect(drawingsSaved).toEqual([{ id: "keep", saved: true }]);

    d3.__registry.get("#draw|click")();
    expect(ctr.mode).toBe(ctr.modi.MODE_DRAW);

    d3.__registry.get("#select|click")();
    expect(ctr.mode).toBe(ctr.modi.MODE_SELECT);

    d3.__registry.get("#move|click")();
    expect(ctr.mode).toBe(ctr.modi.MODE_MOVE);

    d3.__registry.get("#rotate|click")();
    expect(ctr.mode).toBe(ctr.modi.MODE_ROTATE);

    d3.__registry.get("#mirror|click")();
    expect(ctr.mirror).toHaveBeenCalledTimes(1);

    d3.__registry.get("#copy|click")();
    expect(ctr.copy).toHaveBeenCalledTimes(1);

    d3.__registry.get("#erase|click")();
    expect(ctr.erase).toHaveBeenCalledTimes(1);

    d3.__registry.get("#analyze|click")();
    expect(analyzeGraphMock).toHaveBeenCalledTimes(1);
  });

  test("Save (.js-save): does NOT call saveGraph when graph has no content; DOES call when content exists", async () => {
    // no content -> blocked
    {
      const { d3 } = await loadFresh({ graphToJSON: { nodes: [], edges: [] } });
      runHook({ d3 });

      const onSave = d3.__registry.get("ALL:.js-save|click");
      onSave();
      expect(saveGraphMock).not.toHaveBeenCalled();
    }

    // content -> allowed
    {
      const { d3 } = await loadFresh({ graphToJSON: { nodes: [1], edges: [] } });
      runHook({ d3 });

      const onSave = d3.__registry.get("ALL:.js-save|click");
      onSave();
      expect(saveGraphMock).toHaveBeenCalledTimes(1);
    }
  });

  test("sessionStorage load: template source parses templateGraphJSON, calls graphSvc.fromJSON, clears session keys", async () => {
    const { d3 } = await loadFresh({
      selectedId: "t1",
      selectedSource: "template",
      templateGraphJSON: { nodes: [1], edges: [] },
    });

    runHook({ d3 });

    expect(graphSvc.fromJSON).toHaveBeenCalledWith({ nodes: [1], edges: [] });

    expect(sessionStorage.removeItem).toHaveBeenCalledWith("selectedDrawingId");
    expect(sessionStorage.removeItem).toHaveBeenCalledWith("selectedSource");
    expect(sessionStorage.removeItem).toHaveBeenCalledWith("templateGraphJSON");
  });

  test("sessionStorage load: local source finds drawing by id in localStorage and loads graphJSON", async () => {
    const { d3 } = await loadFresh({
      selectedId: "L1",
      selectedSource: "local",
      localDrawings: [
        { id: "L1", saved: true, graphJSON: { nodes: [9], edges: [] } },
        { id: "L2", saved: true, graphJSON: { nodes: [8], edges: [] } },
      ],
    });

    runHook({ d3 });

    expect(graphSvc.fromJSON).toHaveBeenCalledWith({ nodes: [9], edges: [] });
  });

  test("figureLoaded: if unsaved drawing with content exists, sets MODE_SELECT and removes #layer", async () => {
    const { d3 } = await loadFresh({
      localDrawings: [{ id: "tmp", saved: false, graphJSON: { nodes: [1], edges: [] } }],
    });

    runHook({ d3 });

    expect(ctr.mode).toBe(ctr.modi.MODE_SELECT);
    expect(d3.__registry.get("#layer|__removed")).toBe(true);
  });

  test("loadFromFile button: imports, clicks #reset, waits, loads graph, updates message, sets MODE_SELECT, alerts, and updates save state", async () => {
    jest.useFakeTimers();

    const { d3 } = await loadFresh({
      graphToJSON: { nodes: [1], edges: [] },
      localDrawings: [{ id: "drop", saved: false, graphJSON: { nodes: [1], edges: [] } }],
    });
    runHook({ d3 });

    importCC3FileMock.mockResolvedValue({ graphJSON: { foo: 1 } });

    // spy: the hook will call reset via document.querySelector("#reset")?.click()
    // which triggers the "#reset|click" handler we registered.
    const resetHandler = d3.__registry.get("#reset|click");
    expect(resetHandler).toEqual(expect.any(Function));

    const onLoad = d3.__registry.get("#loadFromFile|click");
    const p = onLoad();

    // allow the async handler to run until it hits the timeout
    await Promise.resolve();

    // advance the internal 50ms wait
    jest.advanceTimersByTime(60);
    await p;

    expect(ctr.reset).toHaveBeenCalledTimes(1);

    // loadFromFile uses stringification if needed
    const arg = graphSvc.fromJSON.mock.calls.at(-1)[0];
    expect(typeof arg).toBe("string");
    expect(arg).toContain('"foo":1');

    expect(svgh.updateMessage).toHaveBeenCalledTimes(1);
    expect(ctr.mode).toBe(ctr.modi.MODE_SELECT);
    expect(globalThis.alert).toHaveBeenCalled();

    jest.useRealTimers();
  });

  test("exportToFile button: calls exportCC3File(graphSvc.toJSON(),'drawing')", async () => {
    const { d3 } = await loadFresh({ graphToJSON: { nodes: [1], edges: [] } });
    runHook({ d3 });

    // clear calls made by useEffect/updateSaveButtonEnabled during mount
    graphSvc.toJSON.mockClear();
    exportCC3FileMock.mockClear();

    d3.__registry.get("#exportToFile|click")();

    expect(graphSvc.toJSON).toHaveBeenCalledTimes(1);
    expect(exportCC3FileMock).toHaveBeenCalledWith({ nodes: [1], edges: [] }, "drawing");
  });
});
