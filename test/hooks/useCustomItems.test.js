import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";

let useCustomItems;

// React useEffect mock: run effect immediately + capture cleanup (if any)
let lastCleanup;
const reactMock = {
  useEffect: jest.fn((fn) => {
    lastCleanup = fn();
  }),
};

// Minimal React state engine (enough for this hook)
function makeReactStateMock() {
  // one hook call => one state slot for these tests
  let state;
  const setState = jest.fn((updater) => {
    state = typeof updater === "function" ? updater(state) : updater;
  });

  return {
    __getState: () => state,
    __setInitial: (v) => {
      state = v;
    },
    useState: jest.fn((initial) => {
      if (state === undefined) state = initial;
      return [state, setState];
    }),
    useCallback: jest.fn((fn) => fn),
    useEffect: reactMock.useEffect,
  };
}

// In-memory storage (Node-friendly)
function makeStorage(seedObj) {
  const m = new Map(Object.entries(seedObj || {}));
  return {
    getItem: jest.fn((k) => (m.has(k) ? m.get(k) : null)),
    setItem: jest.fn((k, v) => m.set(k, String(v))),
    removeItem: jest.fn((k) => m.delete(k)),
    clear: jest.fn(() => m.clear()),
    __map: m,
  };
}

async function loadFresh({ storageSeed } = {}) {
  jest.resetModules();
  jest.clearAllMocks();
  lastCleanup = undefined;

  globalThis.localStorage = makeStorage(storageSeed);

  const reactState = makeReactStateMock();

  await jest.unstable_mockModule("react", () => ({
    __esModule: true,
    useState: reactState.useState,
    useEffect: reactState.useEffect,
    useCallback: reactState.useCallback,
  }));

  ({ useCustomItems } = await import(
      "../../src/ui/pages/Gallery/hooks/useCustomItems.js"
      ));

  return { reactState };
}

function runHook({ reactState, storageKey } = {}) {
  const api = useCustomItems(storageKey);

  // effect runs immediately (our mock), which calls setCustomItems(...)
  // but since we don't re-render, we read the updated state from the mock store
  return {
    api,
    get customItems() {
      return reactState.__getState();
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  if (typeof lastCleanup === "function") lastCleanup();
});

describe("useCustomItems (no jsdom, no react-dom, ESM)", () => {
  test("loads empty array when localStorage is empty", async () => {
    const { reactState } = await loadFresh();
    const hook = runHook({ reactState });

    expect(hook.customItems).toEqual([]);
  });

  test("filters only saved items from localStorage", async () => {
    const data = [
      { id: "1", saved: true },
      { id: "2", saved: false },
      { id: "3", saved: true },
    ];

    const { reactState } = await loadFresh({
      storageSeed: { drawings: JSON.stringify(data) },
    });

    const hook = runHook({ reactState });

    expect(hook.customItems).toEqual([
      { id: "1", saved: true },
      { id: "3", saved: true },
    ]);
  });

  test("uses custom storageKey", async () => {
    const data = [{ id: "x", saved: true }];

    const { reactState } = await loadFresh({
      storageSeed: { "my-key": JSON.stringify(data) },
    });

    const hook = runHook({ reactState, storageKey: "my-key" });

    expect(hook.customItems).toEqual([{ id: "x", saved: true }]);
  });

  test("deleteItem removes item from state and localStorage", async () => {
    const data = [
      { id: "a", saved: true },
      { id: "b", saved: true },
    ];

    const { reactState } = await loadFresh({
      storageSeed: { drawings: JSON.stringify(data) },
    });

    const hook = runHook({ reactState });

    // sanity: effect filtered (both saved)
    expect(hook.customItems).toEqual(data);

    hook.api.deleteItem("a");

    expect(hook.customItems).toEqual([{ id: "b", saved: true }]);

    const stored = JSON.parse(localStorage.setItem.mock.calls.at(-1)[1]);
    expect(stored).toEqual([{ id: "b", saved: true }]);
    expect(localStorage.setItem).toHaveBeenCalledWith(
        "drawings",
        JSON.stringify([{ id: "b", saved: true }])
    );
  });

  test("deleteItem with custom storageKey", async () => {
    const data = [
      { id: "1", saved: true },
      { id: "2", saved: true },
    ];

    const { reactState } = await loadFresh({
      storageSeed: { custom: JSON.stringify(data) },
    });

    const hook = runHook({ reactState, storageKey: "custom" });

    hook.api.deleteItem("2");

    expect(hook.customItems).toEqual([{ id: "1", saved: true }]);
    expect(localStorage.setItem).toHaveBeenCalledWith(
        "custom",
        JSON.stringify([{ id: "1", saved: true }])
    );
  });
});
