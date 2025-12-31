import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

function createClock(initial) {
  let now = initial instanceof Date ? initial.getTime() : new Date(initial).getTime();
  class FakeDate extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super(now);
      } else {
        super(...args);
      }
    }
    static now() {
      return now;
    }
  }
  return {
    FakeDate,
    advance(ms) {
      now += ms;
    },
  };
}

function buildDom({ initialNow = "2025-01-15T09:00:00Z" } = {}) {
  const dom = new JSDOM(
    `
    <div id="status"></div>
    <form id="habit-form"></form>
    <button id="refresh" type="button"></button>
    <div id="edit-overlay"></div>
    <form id="edit-form"></form>
    <button id="close-edit" type="button"></button>
    <div id="completions"></div>

    <input id="workday-start" type="time" value="09:00" />
    <input id="workday-hours" type="number" />
    <button id="workday-save" type="button">Save plan</button>
    <button id="workday-clockin" type="button">Clock in</button>
    <button id="workday-clockout" type="button">Clock out</button>
    <input id="workday-worked-override" type="number" />
    <button id="workday-apply-worked" type="button">Apply adjustment</button>
    <div id="workday-progress"></div>
    <div id="workday-label"></div>
  `,
    { url: "http://localhost" },
  );

  const clock = createClock(initialNow);
  const intervalCallbacks = [];
  const originalDate = global.Date;
  const originalSetInterval = global.setInterval;

  global.window = dom.window;
  global.document = dom.window.document;
  global.localStorage = dom.window.localStorage;
  Object.defineProperty(global, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });
  global.Date = clock.FakeDate;
  global.confirm = () => true;
  global.fetch = async (url, options = {}) => {
    const resolved = typeof url === "string" ? new URL(url, "http://localhost") : url;
    const pathname = resolved.pathname || "/";
    if (pathname === "/workday") {
      if ((options.method || "GET").toUpperCase() === "PUT") {
        const body = options.body ? JSON.parse(options.body) : {};
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 1, ...body }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: 1,
          planned_start: "09:00",
          planned_minutes: null,
          clock_in_at: null,
          clock_out_at: null,
          worked_minutes_override: null,
        }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => [],
    };
  };
  global.setInterval = (fn) => {
    intervalCallbacks.push(fn);
    return intervalCallbacks.length;
  };

  return {
    dom,
    clock,
    intervalCallbacks,
    restore() {
      global.Date = originalDate;
      global.setInterval = originalSetInterval;
      delete global.navigator;
    },
  };
}

async function loadApp() {
  const url = new URL("./app.js", import.meta.url);
  url.searchParams.set("cachebust", `${Date.now()}-${Math.random()}`);
  await import(url.href);
}

test("clocking in shows running label and locks inputs", async () => {
  // 1. Setup
  const { dom, restore } = buildDom();

  // 2. Act
  try {
    await loadApp();
    dom.window.document.querySelector("#workday-clockin").click();

    // 3. Assert
    const label = dom.window.document.querySelector("#workday-label").textContent;
    assert.match(label, /Worked time/);
    assert.match(label, /running/);
    assert.equal(dom.window.document.querySelector("#workday-clockin").disabled, true);
    assert.equal(dom.window.document.querySelector("#workday-clockout").disabled, false);
    assert.equal(dom.window.document.querySelector("#workday-save").disabled, true);
  } finally {
    restore();
  }
});

test("worked override updates label after clock out", async () => {
  // 1. Setup
  const { dom, restore } = buildDom();

  // 2. Act
  try {
    await loadApp();
    dom.window.document.querySelector("#workday-clockin").click();
    dom.window.document.querySelector("#workday-clockout").click();
    dom.window.document.querySelector("#workday-worked-override").value = "120";
    dom.window.document.querySelector("#workday-apply-worked").click();

    // 3. Assert
    const label = dom.window.document.querySelector("#workday-label").textContent;
    assert.equal(label, "Adjusted worked time: 2h");
  } finally {
    restore();
  }
});

test("clocked progress reflects worked minutes against plan", async () => {
  // 1. Setup
  const { dom, restore } = buildDom();
  try {
    const clockInAt = new Date(Date.now() - 60 * 60000).toISOString();
    dom.window.localStorage.setItem(
      "focusos-workday",
      JSON.stringify({
        plannedStart: "09:00",
        plannedMinutes: 480,
        clockInAt,
        clockOutAt: null,
        workedMinutesOverride: null,
      }),
    );

    // 2. Act
    await loadApp();

    // 3. Assert
    const progress = dom.window.document.querySelector("#workday-progress");
    const expectedPct = (60 / 480) * 100;
    assert.equal(progress.style.width, `${expectedPct}%`);
  } finally {
    restore();
  }
});

test("clocked progress defaults to 8h when no plan exists", async () => {
  // 1. Setup
  const { dom, restore } = buildDom();
  try {
    const clockInAt = new Date(Date.now() - 60 * 60000).toISOString();
    dom.window.localStorage.setItem(
      "focusos-workday",
      JSON.stringify({
        plannedStart: "09:00",
        plannedMinutes: null,
        clockInAt,
        clockOutAt: null,
        workedMinutesOverride: null,
      }),
    );

    // 2. Act
    await loadApp();

    // 3. Assert
    const progress = dom.window.document.querySelector("#workday-progress");
    const expectedPct = (60 / 480) * 100;
    assert.equal(progress.style.width, `${expectedPct}%`);
  } finally {
    restore();
  }
});

test("clocked workday ticks based on plan and stops early on clock out", async () => {
  // 1. Setup
  const { dom, clock, intervalCallbacks, restore } = buildDom({
    initialNow: "2025-01-15T09:00:00Z",
  });

  // 2. Act
  try {
    await loadApp();
    dom.window.document.querySelector("#workday-hours").value = "3";
    dom.window.document.querySelector("#workday-save").click();
    dom.window.document.querySelector("#workday-clockin").click();

    clock.advance(30 * 60000);
    intervalCallbacks.forEach((fn) => fn());

    clock.advance(30 * 60000);
    dom.window.document.querySelector("#workday-clockout").click();
    intervalCallbacks.forEach((fn) => fn());

    // 3. Assert
    const label = dom.window.document.querySelector("#workday-label").textContent;
    assert.equal(label, "Worked time: 1h");

    const progress = dom.window.document.querySelector("#workday-progress");
    const actualPct = parseFloat(progress.style.width);
    const expectedPct = (60 / 180) * 100;
    assert.ok(Math.abs(actualPct - expectedPct) < 0.5);
  } finally {
    restore();
  }
});
