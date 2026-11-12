/*
 * `choices.grade` as the backend sends it in English (stoa-backend#310): the
 * year groups in its order, each named by its `message_catalog`. The client
 * keeps no copy of this list; tests stand in for the backend with it.
 */
// No `@/` import: the dist e2e (tsconfig.node.json) reads this file too. The shape of `ProfileChoice`.
export const GRADES: { code: string; label: string }[] = [
  { code: 'grade_1_primary', label: 'Year 1 (primary school)' },
  { code: 'grade_2_primary', label: 'Year 2 (primary school)' },
  { code: 'grade_3_primary', label: 'Year 3 (primary school)' },
  { code: 'grade_4_primary', label: 'Year 4 (primary school)' },
  { code: 'grade_5_primary', label: 'Year 5 (primary school)' },
  { code: 'grade_6_primary', label: 'Year 6 (primary school)' },
  { code: 'grade_7_secondary', label: 'Year 7 (lower secondary)' },
  { code: 'grade_8_secondary', label: 'Year 8 (lower secondary)' },
  { code: 'grade_9_secondary', label: 'Year 9 (lower secondary)' },
  { code: 'grade_secondary_i', label: 'Lower secondary, not sure which year' },
  { code: 'grade_secondary_ii', label: 'Upper secondary (Gymnasium)' },
]

/** `choices.answerStyle` as the backend sends it in English (stoa-backend#314), in its order. */
export const ANSWER_STYLES: { code: string; label: string }[] = [
  { code: 'standard', label: 'Balanced' },
  { code: 'concise', label: 'Short and precise' },
  { code: 'encouraging', label: 'Patient and encouraging' },
  { code: 'vivid', label: 'With comparisons and examples' },
]
