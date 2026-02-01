/**
 * SMART Goal Form Utilities
 *
 * Pure functions for SMART Goal form logic.
 * See docs/panels/SmartGoalsPanel.md for specification.
 */

/**
 * Parse a quarter string like "Q1 2026" into components.
 * @param {string} quarterStr - Quarter string (e.g., "Q1 2026", "q2 2025")
 * @returns {{quarter: number, year: number}|null} Parsed result or null if invalid
 */
export function parseQuarter(quarterStr) {
  if (!quarterStr || typeof quarterStr !== "string") return null;

  const match = quarterStr.trim().match(/^[Qq](\d)\s+(\d{4})$/);
  if (!match) return null;

  const quarter = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);

  if (quarter < 1 || quarter > 4) return null;

  return { quarter, year };
}

/**
 * Calculate the end date of a quarter.
 * @param {number} quarter - Quarter number (1-4)
 * @param {number} year - Year (e.g., 2026)
 * @returns {string|null} ISO date string (YYYY-MM-DD) or null if invalid
 */
export function quarterEndDate(quarter, year) {
  const endDates = {
    1: `${year}-03-31`,
    2: `${year}-06-30`,
    3: `${year}-09-30`,
    4: `${year}-12-31`,
  };

  return endDates[quarter] || null;
}

/**
 * Build a goal payload, including only the relevant measure field.
 * @param {Object} formData - Raw form data
 * @returns {Object} Cleaned payload for API
 */
export function buildGoalPayload(formData) {
  const {
    title,
    why_this_matters,
    measure_type,
    frequency,
    duration_minutes,
    frequency_period,
    success_threshold,
    quarter,
    due_date,
    tags,
    habit_ids,
  } = formData;

  return {
    title,
    why_this_matters: why_this_matters || null,
    measure_type,
    frequency: measure_type === "frequency" ? frequency : null,
    duration_minutes: measure_type === "duration" ? duration_minutes : null,
    frequency_period,
    success_threshold,
    quarter,
    due_date: due_date || null,
    tags,
    habit_ids,
  };
}
