import assert from "node:assert/strict";
import { test } from "node:test";

import { DELETE_HABIT_CONFIRMATION, deleteHabitFlow } from "./deleteHabitFlow.js";
import { purgeHabitState } from "./habitState.js";

test("deleteHabitFlow aborts when confirmation is declined", async () => {
  const calls = [];
  const apiClient = {
    deleteHabit: () => calls.push("api"),
  };
  const result = await deleteHabitFlow({
    id: 2,
    confirmDelete: () => false,
    confirmMessage: "Delete?",
    apiClient,
    setStatus: (value) => calls.push(`status:${value}`),
    purgeHabitState: () => calls.push("purge"),
    state: {},
    onAfterDelete: () => calls.push("afterDelete"),
    saveTimeLogs: () => calls.push("saveTime"),
    saveManualLogs: () => calls.push("saveManual"),
    saveActiveTimers: () => calls.push("saveActive"),
    loadHabits: () => calls.push("load"),
  });

  assert.deepEqual(result, { deleted: false });
  assert.deepEqual(calls, []);
});

test("deleteHabitFlow executes delete sequence when confirmed", async () => {
  const calls = [];
  const state = { activeTimers: { 9: { start: 123 } } };
  const apiClient = {
    deleteHabit: async (id) => calls.push(`api:${id}`),
  };

  const result = await deleteHabitFlow({
    id: 9,
    confirmDelete: (message) => {
      calls.push(`confirm:${message}`);
      return true;
    },
    confirmMessage: DELETE_HABIT_CONFIRMATION,
    apiClient,
    setStatus: (value) => calls.push(`status:${value}`),
    purgeHabitState: (target, id) => calls.push(`purge:${id}:${target === state}`),
    state,
    onAfterDelete: (id) => calls.push(`afterDelete:${id}`),
    saveTimeLogs: () => calls.push("saveTime"),
    saveManualLogs: () => calls.push("saveManual"),
    saveActiveTimers: () => calls.push("saveActive"),
    loadHabits: async () => calls.push("load"),
  });

  assert.deepEqual(result, { deleted: true });
  assert.deepEqual(calls, [
    `confirm:${DELETE_HABIT_CONFIRMATION}`,
    "status:Deleting...",
    "api:9",
    "purge:9:true",
    "afterDelete:9",
    "saveTime",
    "saveManual",
    "saveActive",
    "status:Deleted",
    "load",
  ]);
});

test("deleteHabitFlow accepts async confirmation", async () => {
  const calls = [];
  const apiClient = {
    deleteHabit: async (id) => calls.push(`api:${id}`),
  };

  const result = await deleteHabitFlow({
    id: 3,
    confirmDelete: (message) => {
      calls.push(`confirm:${message}`);
      return Promise.resolve(true);
    },
    confirmMessage: DELETE_HABIT_CONFIRMATION,
    apiClient,
    setStatus: (value) => calls.push(`status:${value}`),
    purgeHabitState: () => calls.push("purge"),
    state: {},
    onAfterDelete: () => calls.push("afterDelete"),
    saveTimeLogs: () => calls.push("saveTime"),
    saveManualLogs: () => calls.push("saveManual"),
    saveActiveTimers: () => calls.push("saveActive"),
    loadHabits: async () => calls.push("load"),
  });

  assert.deepEqual(result, { deleted: true });
  assert.equal(calls[0], `confirm:${DELETE_HABIT_CONFIRMATION}`);
  assert.ok(calls.includes("api:3"));
});

test("deleteHabitFlow stops when api delete fails", async () => {
  const calls = [];
  const apiClient = {
    deleteHabit: async () => {
      throw new Error("fail");
    },
  };

  await assert.rejects(
    deleteHabitFlow({
      id: 4,
      confirmDelete: () => true,
      confirmMessage: DELETE_HABIT_CONFIRMATION,
      apiClient,
      setStatus: (value) => calls.push(`status:${value}`),
      purgeHabitState: () => calls.push("purge"),
      state: {},
      onAfterDelete: () => calls.push("afterDelete"),
      saveTimeLogs: () => calls.push("saveTime"),
      saveManualLogs: () => calls.push("saveManual"),
      saveActiveTimers: () => calls.push("saveActive"),
      loadHabits: () => calls.push("load"),
    }),
  );

  assert.deepEqual(calls, ["status:Deleting..."]);
});

test("deleteHabitFlow purges logs and timers when confirmed", async () => {
  const state = {
    timeLogs: { "2024-01-01": { "5": 10 } },
    manualLogs: { "2024-01-01": { "5": 5 } },
    activeTimers: { 5: { start: 123 } },
  };

  await deleteHabitFlow({
    id: 5,
    confirmDelete: () => true,
    confirmMessage: DELETE_HABIT_CONFIRMATION,
    apiClient: { deleteHabit: async () => {} },
    setStatus: () => {},
    purgeHabitState,
    state,
    onAfterDelete: () => {},
    saveTimeLogs: () => {},
    saveManualLogs: () => {},
    saveActiveTimers: () => {},
    loadHabits: async () => {},
  });

  assert.deepEqual(state.timeLogs, { "2024-01-01": {} });
  assert.deepEqual(state.manualLogs, { "2024-01-01": {} });
  assert.deepEqual(state.activeTimers, {});
});

test("deleteHabitFlow warning mentions irreversible delete", async () => {
  assert.match(DELETE_HABIT_CONFIRMATION, /cannot be undone/i);
});
