import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";

let useTemplates;

// React hook mocks (no jsdom / no react-dom)
let lastCleanup;
const reactMock = {
  useEffect: jest.fn((fn) => {
    lastCleanup = fn?.();
  }),
};

// Minimal state + memo engine for this hook
function makeReactHookMock() {
  // single state slot is enough for this hook in these tests
  let state;
  const setState = jest.fn((updater) => {
    state = typeof updater === "function" ? updater(state) : updater;
  });

  let lastMemoDeps;
  let lastMemoValue;

  return {
    __getState: () => state,
    __resetState: () => {
      state = undefined;
      lastMemoDeps = undefined;
      lastMemoValue = undefined;
    },

    useState: jest.fn((initial) => {
      if (state === undefined) state = initial;
      return [state, setState];
    }),

    useMemo: jest.fn((factory, deps) => {
      const same =
          Array.isArray(lastMemoDeps) &&
          Array.isArray(deps) &&
          lastMemoDeps.length === deps.length &&
          lastMemoDeps.every((d, i) => Object.is(d, deps[i]));

      if (!same) {
        lastMemoDeps = deps;
        lastMemoValue = factory();
      }
      return lastMemoValue;
    }),

    useEffect: reactMock.useEffect,
  };
}

async function loadFresh() {
  jest.resetModules();
  jest.clearAllMocks();
  lastCleanup = undefined;

  const reactHooks = makeReactHookMock();

  await jest.unstable_mockModule("react", () => ({
    __esModule: true,
    useState: reactHooks.useState,
    useMemo: reactHooks.useMemo,
    useEffect: reactHooks.useEffect,
  }));

  ({ useTemplates } = await import(
      "../../src/ui/pages/Gallery/hooks/useTemplates.js"
      ));

  return { reactHooks };
}

function runHook({ reactHooks, files } = {}) {
  // call the hook
  const returned = useTemplates(files);

  // because our useEffect runs immediately, it may set state,
  // but there is no re-render; return both:
  // - "returned" (what the hook returned on this call)
  // - "templates" (the current state after effects ran)
  return {
    returned,
    get templates() {
      return reactHooks.__getState();
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  if (typeof lastCleanup === "function") lastCleanup();
});

describe("useTemplates (no jsdom, pure hook)", () => {
  test("maps primary fields", async () => {
    const { reactHooks } = await loadFresh();

    const files = {
      "/templates/foo.json": {
        name: "Foo Template",
        svgPath: "PATH",
        graphJSON: { a: 1 },
      },
    };

    const hook = runHook({ reactHooks, files });

    expect(hook.templates).toEqual([
      {
        id: "tpl-foo",
        name: "Foo Template",
        svgPath: "PATH",
        graphJSON: { a: 1 },
        isTemplate: true,
      },
    ]);
  });

  test("uses fallbacks", async () => {
    const { reactHooks } = await loadFresh();

    const files = {
      "/x/bar.json": {
        svg: "<svg />",
        extra: 123,
      },
    };

    const hook = runHook({ reactHooks, files });

    expect(hook.templates).toEqual([
      {
        id: "tpl-bar",
        name: "bar",
        svgPath: "<svg />",
        graphJSON: { svg: "<svg />", extra: 123 },
        isTemplate: true,
      },
    ]);
  });

  test("covers filename edge cases", async () => {
    const { reactHooks } = await loadFresh();

    const files = {
      baz: {},
      "/trailing/": {},
    };

    const hook = runHook({ reactHooks, files });

    expect(hook.templates).toHaveLength(2);
    expect(hook.templates).toEqual(
        expect.arrayContaining([
          {
            id: "tpl-baz",
            name: "baz",
            svgPath: "",
            graphJSON: {},
            isTemplate: true,
          },
          {
            id: "tpl-",
            name: "",
            svgPath: "",
            graphJSON: {},
            isTemplate: true,
          },
        ])
    );
  });

  test("updates when input changes (simulate re-render)", async () => {
    const { reactHooks } = await loadFresh();

    const filesA = {
      "/a.json": { name: "A", svgPath: "A", graphJSON: { a: 1 } },
    };
    const filesB = {
      "/b.json": { name: "B", svgPath: "B", graphJSON: { b: 2 } },
      "/c.json": { svgPath: "C" },
    };

    // first render
    let hook = runHook({ reactHooks, files: filesA });
    expect(hook.templates).toEqual([
      { id: "tpl-a", name: "A", svgPath: "A", graphJSON: { a: 1 }, isTemplate: true },
    ]);

    // re-render with new props
    hook = runHook({ reactHooks, files: filesB });
    expect(hook.templates).toEqual([
      { id: "tpl-b", name: "B", svgPath: "B", graphJSON: { b: 2 }, isTemplate: true },
      { id: "tpl-c", name: "c", svgPath: "C", graphJSON: { svgPath: "C" }, isTemplate: true },
    ]);
  });
});