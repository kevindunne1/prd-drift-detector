/**
 * Whimsical loading verbs for PRD drift analysis
 * Inspired by Claude Code's delightful status messages
 *
 * All verbs are:
 * - Positive and cheerful
 * - In gerund form (ending in -ing)
 * - Relevant to analysis/comparison tasks
 * - UK/Australian English spellings
 * - Free from alarming or destructive connotations
 */

export const loadingVerbs = [
  // Investigation & Examination
  "Scrutinising",
  "Investigating",
  "Examining",
  "Inspecting",
  "Surveying",
  "Sleuthing",
  "Exploring",

  // Comparison & Matching
  "Cross-referencing",
  "Correlating",
  "Juxtaposing",
  "Reconciling",
  "Comparing",
  "Matching",
  "Aligning",

  // Analysis & Evaluation
  "Analysing",
  "Evaluating",
  "Assessing",
  "Appraising",
  "Deciphering",
  "Interpreting",

  // Synthesis & Integration
  "Synthesising",
  "Harmonising",
  "Orchestrating",
  "Weaving",
  "Integrating",

  // Measurement & Calibration
  "Calibrating",
  "Measuring",
  "Gauging",
  "Triangulating",

  // Discovery & Insight
  "Illuminating",
  "Uncovering",
  "Excavating",
  "Discovering",
  "Revealing",

  // Mapping & Navigation
  "Cartographing",
  "Mapping",
  "Charting",
  "Navigating",

  // Verification & Validation
  "Validating",
  "Verifying",
  "Confirming",
  "Cross-checking",
];

/**
 * Get a random loading verb
 * Uses crypto.getRandomValues for better randomness
 */
export function getRandomLoadingVerb(): string {
  if (typeof window !== "undefined" && window.crypto) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const randomIndex = array[0] % loadingVerbs.length;
    return loadingVerbs[randomIndex];
  }

  // Fallback to Math.random if crypto not available
  const randomIndex = Math.floor(Math.random() * loadingVerbs.length);
  return loadingVerbs[randomIndex];
}
