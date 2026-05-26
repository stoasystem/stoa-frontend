import type {
  LearningUnit,
  PracticeAnswerResult,
  PracticeChallenge,
  PracticeHintResponse,
  PracticeLesson,
  PracticeLessonResult,
  PracticeMistake,
  PracticeOverview,
  PracticeParentSummary,
  PracticePath,
  PracticeSubject,
} from '@/types/practice'

const now = '2026-05-26T12:00:00Z'

export const practiceSubjects: PracticeSubject[] = [
  {
    id: 'math',
    name: 'Mathematics',
    description: 'Practice equations, functions, and problem solving.',
    progress: 35,
    accent: 'burgundy',
  },
  {
    id: 'physics',
    name: 'Physics',
    description: 'Review motion, units, and graph interpretation.',
    progress: 22,
    accent: 'ink',
  },
]

const challenges: Record<string, PracticeChallenge[]> = {
  'lesson-linear-1': [
    {
      id: 'linear-1-c1',
      lessonId: 'lesson-linear-1',
      type: 'multiple_choice',
      prompt: 'Solve x + 4 = 9.',
      options: ['x = 4', 'x = 5', 'x = 9', 'x = 13'],
      correctAnswer: 'x = 5',
      hint: 'Undo the +4 by subtracting 4 from both sides.',
      explanation: '9 - 4 = 5, so x = 5.',
      topic: 'One-step equations',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'linear-1-c2',
      lessonId: 'lesson-linear-1',
      type: 'text_input',
      prompt: 'Solve 3x = 18. Write the value of x.',
      correctAnswer: '6',
      hint: 'Divide both sides by 3.',
      explanation: '18 divided by 3 is 6, so x = 6.',
      topic: 'One-step equations',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'linear-1-c3',
      lessonId: 'lesson-linear-1',
      type: 'ordering',
      prompt: 'Put the steps for solving x - 7 = 2 in order.',
      options: ['Add 7 to both sides', 'Write x = 9', 'Start with x - 7 = 2'],
      correctAnswer: ['Start with x - 7 = 2', 'Add 7 to both sides', 'Write x = 9'],
      hint: 'Begin with the equation, then undo the subtraction.',
      explanation: 'Adding 7 to both sides leaves x alone and gives 2 + 7 = 9.',
      topic: 'One-step equations',
      gradeLevel: 'Grade 8',
    },
  ],
  'lesson-linear-2': [
    {
      id: 'linear-2-c1',
      lessonId: 'lesson-linear-2',
      type: 'multiple_choice',
      prompt: 'Solve 2x + 3 = 11.',
      options: ['x = 3', 'x = 4', 'x = 7', 'x = 14'],
      correctAnswer: 'x = 4',
      hint: 'Subtract 3 first, then divide by 2.',
      explanation: '2x = 8, so x = 4.',
      topic: 'Two-step equations',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'linear-2-c2',
      lessonId: 'lesson-linear-2',
      type: 'text_input',
      prompt: 'Solve 5x - 10 = 15. Write the value of x.',
      correctAnswer: '5',
      hint: 'Add 10 to both sides before dividing.',
      explanation: '5x = 25, so x = 5.',
      topic: 'Two-step equations',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'linear-2-c3',
      lessonId: 'lesson-linear-2',
      type: 'explanation',
      prompt: 'Why do we subtract 3 first in 2x + 3 = 11?',
      correctAnswer: 'to isolate the term with x',
      hint: 'Think about which operation is furthest from x.',
      explanation: 'We undo addition before division so the x term is isolated.',
      topic: 'Two-step equations',
      gradeLevel: 'Grade 8',
    },
  ],
  'lesson-linear-3': [
    {
      id: 'linear-3-c1',
      lessonId: 'lesson-linear-3',
      type: 'multiple_choice',
      prompt: 'A notebook costs CHF 4. Mia spends CHF 20. Which equation finds n notebooks?',
      options: ['n + 4 = 20', '4n = 20', '20n = 4', 'n - 4 = 20'],
      correctAnswer: '4n = 20',
      hint: 'Total cost equals price per notebook times number of notebooks.',
      explanation: 'CHF 4 per notebook times n notebooks gives 4n = 20.',
      topic: 'Equation word problems',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'linear-3-c2',
      lessonId: 'lesson-linear-3',
      type: 'text_input',
      prompt: 'Solve 4n = 20. How many notebooks did Mia buy?',
      correctAnswer: '5',
      hint: 'Divide 20 by 4.',
      explanation: '20 divided by 4 is 5.',
      topic: 'Equation word problems',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'linear-3-c3',
      lessonId: 'lesson-linear-3',
      type: 'explanation',
      prompt: 'What does n represent in 4n = 20?',
      correctAnswer: 'number of notebooks',
      hint: 'Look for the unknown quantity in the story.',
      explanation: 'n is the number of notebooks Mia bought.',
      topic: 'Equation word problems',
      gradeLevel: 'Grade 8',
    },
  ],
  'lesson-quadratic-1': [
    {
      id: 'quad-1-c1',
      lessonId: 'lesson-quadratic-1',
      type: 'multiple_choice',
      prompt: 'Factor x² + 5x + 6.',
      options: ['(x + 2)(x + 3)', '(x + 1)(x + 6)', '(x - 2)(x - 3)', '(x + 5)(x + 6)'],
      correctAnswer: '(x + 2)(x + 3)',
      hint: 'Find two numbers that multiply to 6 and add to 5.',
      explanation: '2 and 3 multiply to 6 and add to 5.',
      topic: 'Factoring simple expressions',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'quad-1-c2',
      lessonId: 'lesson-quadratic-1',
      type: 'text_input',
      prompt: 'In x² + 7x + 10, which two numbers multiply to 10 and add to 7? Write them with a comma.',
      correctAnswer: '5,2',
      hint: 'List factor pairs of 10.',
      explanation: '5 and 2 multiply to 10 and add to 7.',
      topic: 'Factoring simple expressions',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'quad-1-c3',
      lessonId: 'lesson-quadratic-1',
      type: 'ordering',
      prompt: 'Order the factoring steps for x² + 7x + 10.',
      options: ['Write (x + 5)(x + 2)', 'Find factors of 10', 'Check they add to 7'],
      correctAnswer: ['Find factors of 10', 'Check they add to 7', 'Write (x + 5)(x + 2)'],
      hint: 'Choose numbers before writing the brackets.',
      explanation: 'The factors 5 and 2 work, so the expression factors as (x + 5)(x + 2).',
      topic: 'Factoring simple expressions',
      gradeLevel: 'Grade 8',
    },
  ],
  'lesson-quadratic-2': [
    {
      id: 'quad-2-c1',
      lessonId: 'lesson-quadratic-2',
      type: 'multiple_choice',
      prompt: 'Solve x² = 9.',
      options: ['x = 3 only', 'x = -3 only', 'x = 3 or x = -3', 'x = 9'],
      correctAnswer: 'x = 3 or x = -3',
      hint: 'Both positive and negative 3 square to 9.',
      explanation: '3² = 9 and (-3)² = 9.',
      topic: 'Simple quadratic equations',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'quad-2-c2',
      lessonId: 'lesson-quadratic-2',
      type: 'text_input',
      prompt: 'Solve x² = 16. Write both values separated by a comma.',
      correctAnswer: '4,-4',
      hint: 'Find the positive and negative square roots.',
      explanation: '4² = 16 and (-4)² = 16.',
      topic: 'Simple quadratic equations',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'quad-2-c3',
      lessonId: 'lesson-quadratic-2',
      type: 'explanation',
      prompt: 'Why are there two answers to x² = 16?',
      correctAnswer: 'positive and negative numbers square to the same value',
      hint: 'Think about 4 × 4 and -4 × -4.',
      explanation: 'A positive or negative number can square to the same positive result.',
      topic: 'Simple quadratic equations',
      gradeLevel: 'Grade 8',
    },
  ],
  'lesson-motion-1': [
    {
      id: 'motion-1-c1',
      lessonId: 'lesson-motion-1',
      type: 'multiple_choice',
      prompt: 'Which formula connects speed, distance, and time?',
      options: ['speed = distance ÷ time', 'speed = distance × time', 'time = speed × distance', 'distance = speed ÷ time'],
      correctAnswer: 'speed = distance ÷ time',
      hint: 'Speed tells how much distance is covered each unit of time.',
      explanation: 'Speed equals distance divided by time.',
      topic: 'Speed, distance, and time',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'motion-1-c2',
      lessonId: 'lesson-motion-1',
      type: 'text_input',
      prompt: 'A cyclist travels 30 km in 2 hours. What is the speed in km/h?',
      correctAnswer: '15',
      hint: 'Divide 30 by 2.',
      explanation: '30 km ÷ 2 h = 15 km/h.',
      topic: 'Speed, distance, and time',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'motion-1-c3',
      lessonId: 'lesson-motion-1',
      type: 'explanation',
      prompt: 'What does km/h mean?',
      correctAnswer: 'kilometres per hour',
      hint: 'The slash means per.',
      explanation: 'km/h means kilometres travelled in one hour.',
      topic: 'Speed, distance, and time',
      gradeLevel: 'Grade 8',
    },
  ],
  'lesson-motion-2': [
    {
      id: 'motion-2-c1',
      lessonId: 'lesson-motion-2',
      type: 'multiple_choice',
      prompt: 'Which is the same as 1 m/s?',
      options: ['3.6 km/h', '1 km/h', '60 km/h', '0.36 km/h'],
      correctAnswer: '3.6 km/h',
      hint: 'There are 3600 seconds in an hour and 1000 metres in a kilometre.',
      explanation: '1 m/s = 3.6 km/h.',
      topic: 'Units and conversion',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'motion-2-c2',
      lessonId: 'lesson-motion-2',
      type: 'text_input',
      prompt: 'Convert 10 m/s to km/h.',
      correctAnswer: '36',
      hint: 'Multiply by 3.6.',
      explanation: '10 × 3.6 = 36 km/h.',
      topic: 'Units and conversion',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'motion-2-c3',
      lessonId: 'lesson-motion-2',
      type: 'ordering',
      prompt: 'Order the conversion steps from m/s to km/h.',
      options: ['Multiply by 3.6', 'Start with the m/s value', 'Write the result in km/h'],
      correctAnswer: ['Start with the m/s value', 'Multiply by 3.6', 'Write the result in km/h'],
      hint: 'Use the conversion factor before writing the final unit.',
      explanation: 'm/s values are converted to km/h by multiplying by 3.6.',
      topic: 'Units and conversion',
      gradeLevel: 'Grade 8',
    },
  ],
  'lesson-motion-3': [
    {
      id: 'motion-3-c1',
      lessonId: 'lesson-motion-3',
      type: 'multiple_choice',
      prompt: 'On a distance-time graph, what does a steeper line mean?',
      options: ['Higher speed', 'Lower speed', 'No movement', 'Less time only'],
      correctAnswer: 'Higher speed',
      hint: 'A steeper line covers more distance in the same time.',
      explanation: 'Steeper distance-time lines show higher speed.',
      topic: 'Graph interpretation',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'motion-3-c2',
      lessonId: 'lesson-motion-3',
      type: 'text_input',
      prompt: 'If distance stays the same while time increases, what is the speed?',
      correctAnswer: '0',
      hint: 'No change in distance means no movement.',
      explanation: 'The object is stationary, so speed is 0.',
      topic: 'Graph interpretation',
      gradeLevel: 'Grade 8',
    },
    {
      id: 'motion-3-c3',
      lessonId: 'lesson-motion-3',
      type: 'explanation',
      prompt: 'What does a horizontal line show on a distance-time graph?',
      correctAnswer: 'no movement',
      hint: 'The distance value is not changing.',
      explanation: 'A horizontal line means the object is not moving.',
      topic: 'Graph interpretation',
      gradeLevel: 'Grade 8',
    },
  ],
}

const mathLessons: PracticeLesson[] = [
  lesson('lesson-linear-1', 'unit-linear-equations', 'math', 'Solving one-step equations', 'One-step equations', 'available', 'intro', 6),
  lesson('lesson-linear-2', 'unit-linear-equations', 'math', 'Solving two-step equations', 'Two-step equations', 'available', 'practice', 7),
  lesson('lesson-linear-3', 'unit-linear-equations', 'math', 'Word problems with equations', 'Equation word problems', 'locked', 'practice', 8),
  lesson('lesson-quadratic-1', 'unit-quadratic-basics', 'math', 'Factoring simple expressions', 'Factoring simple expressions', 'locked', 'intro', 8),
  lesson('lesson-quadratic-2', 'unit-quadratic-basics', 'math', 'Solving simple quadratic equations', 'Simple quadratic equations', 'locked', 'review', 8),
]

const physicsLessons: PracticeLesson[] = [
  lesson('lesson-motion-1', 'unit-motion', 'physics', 'Speed, distance, and time', 'Speed, distance, and time', 'available', 'intro', 6),
  lesson('lesson-motion-2', 'unit-motion', 'physics', 'Units and conversion', 'Units and conversion', 'available', 'practice', 7),
  lesson('lesson-motion-3', 'unit-motion', 'physics', 'Simple graph interpretation', 'Graph interpretation', 'locked', 'practice', 7),
]

export const practiceUnits: LearningUnit[] = [
  {
    id: 'unit-linear-equations',
    subjectId: 'math',
    title: 'Linear equations',
    description: 'Build confidence with equations step by step.',
    order: 1,
    status: 'available',
    lessons: mathLessons.slice(0, 3),
  },
  {
    id: 'unit-quadratic-basics',
    subjectId: 'math',
    title: 'Quadratic basics',
    description: 'Recognize simple factors and square-root solutions.',
    order: 2,
    status: 'locked',
    lessons: mathLessons.slice(3),
  },
  {
    id: 'unit-motion',
    subjectId: 'physics',
    title: 'Motion',
    description: 'Use formulas, units, and graphs to describe movement.',
    order: 1,
    status: 'available',
    lessons: physicsLessons,
  },
]

export const mockPracticeMistakes: PracticeMistake[] = [
  {
    id: 'mistake-1',
    subjectId: 'math',
    subjectName: 'Mathematics',
    lessonId: 'lesson-linear-2',
    lessonTitle: 'Solving two-step equations',
    challengeId: 'linear-2-c1',
    topic: 'Two-step equations',
    prompt: 'Solve 2x + 3 = 11.',
    studentAnswer: 'x = 7',
    correctAnswer: 'x = 4',
    hint: 'Subtract 3 first, then divide by 2.',
    reviewed: false,
    createdAt: now,
  },
  {
    id: 'mistake-2',
    subjectId: 'physics',
    subjectName: 'Physics',
    lessonId: 'lesson-motion-1',
    lessonTitle: 'Speed, distance, and time',
    challengeId: 'motion-1-c2',
    topic: 'Speed, distance, and time',
    prompt: 'A cyclist travels 30 km in 2 hours. What is the speed in km/h?',
    studentAnswer: '60',
    correctAnswer: '15',
    hint: 'Divide distance by time.',
    reviewed: true,
    createdAt: now,
  },
]

export function getMockPracticeOverview(): PracticeOverview {
  const recommendedLesson = getMockLesson('lesson-linear-2') ?? mathLessons[1]

  return {
    subjects: practiceSubjects,
    recommendedLesson,
    dailyGoal: {
      completed: 2,
      target: 3,
      label: '2 of 3 short practices',
    },
    studyStreak: 5,
    progressPoints: 240,
    recentMistakes: mockPracticeMistakes,
    weakTopics: [
      {
        id: 'weak-practice-1',
        subject: 'Mathematics',
        topic: 'Two-step equations',
        note: 'Could benefit from one more guided attempt.',
      },
      {
        id: 'weak-practice-2',
        subject: 'Physics',
        topic: 'Unit conversion',
        note: 'Review the conversion factor before graph work.',
      },
    ],
  }
}

export function getMockPracticePath(subjectId: string): PracticePath {
  return {
    subjectId,
    units: practiceUnits.filter((unit) => unit.subjectId === subjectId),
  }
}

export function getMockLesson(lessonId: string): PracticeLesson | undefined {
  return practiceUnits.flatMap((unit) => unit.lessons).find((item) => item.id === lessonId)
}

export function getMockMistakes() {
  return { items: mockPracticeMistakes }
}

export function submitMockChallengeAnswer(challengeId: string, answer: string | string[]): PracticeAnswerResult {
  const challenge = Object.values(challenges).flat().find((item) => item.id === challengeId)
  const correct = challenge ? answersMatch(answer, challenge.correctAnswer, challenge.type) : false
  const lessonChallenges = challenge ? challenges[challenge.lessonId] : []
  const currentIndex = lessonChallenges.findIndex((item) => item.id === challengeId)
  const nextChallengeId = correct ? lessonChallenges[currentIndex + 1]?.id : undefined

  return {
    challengeId,
    correct,
    feedback: correct
      ? 'Good work. You used the right step.'
      : 'Not quite. Use the hint, then try once more.',
    explanation: correct ? challenge?.explanation : undefined,
    hint: challenge?.hint,
    nextChallengeId,
    attemptsRemaining: correct ? 2 : 1,
  }
}

export function completeMockLesson(lessonId: string): PracticeLessonResult {
  const targetLesson = getMockLesson(lessonId) ?? mathLessons[0]
  const totalCount = targetLesson.challenges.length

  return {
    lessonId,
    subjectId: targetLesson.subjectId,
    correctCount: Math.max(totalCount - 1, 1),
    totalCount,
    progressPoints: totalCount * 8,
    studyStreak: 6,
    timeSpentSeconds: totalCount * 75,
    mistakes: mockPracticeMistakes.filter((mistake) => mistake.lessonId === lessonId),
  }
}

export function getMockPracticeHint(challengeId: string): PracticeHintResponse {
  const challenge = Object.values(challenges).flat().find((item) => item.id === challengeId)

  return {
    title: 'Focus on the next step',
    hint: challenge?.hint ?? 'Look for the operation you can undo first.',
    nextStep: 'Try one more answer after applying the hint. If it still feels unclear, ask for a step explanation.',
  }
}

export function getMockPracticeParentSummary(): PracticeParentSummary {
  return {
    lessonsCompletedThisWeek: 4,
    topicsPracticed: ['Linear equations', 'Speed and distance', 'Units conversion'],
    mistakesReviewed: 3,
    practiceStreak: 5,
    recommendedNextTopic: 'Two-step equations',
    supportiveNote: 'Anna could benefit from more practice with two-step equations before moving to word problems.',
  }
}

function lesson(
  id: string,
  unitId: string,
  subjectId: string,
  title: string,
  topic: string,
  status: PracticeLesson['status'],
  difficulty: PracticeLesson['difficulty'],
  estimatedMinutes: number,
): PracticeLesson {
  return {
    id,
    unitId,
    subjectId,
    title,
    topic,
    status,
    difficulty,
    estimatedMinutes,
    challenges: challenges[id],
  }
}

function answersMatch(
  answer: string | string[],
  correctAnswer: string | string[],
  type: PracticeChallenge['type'],
) {
  if (Array.isArray(correctAnswer)) {
    return Array.isArray(answer) && correctAnswer.every((item, index) => normalize(item) === normalize(answer[index] ?? ''))
  }

  if (Array.isArray(answer)) {
    return false
  }

  if (type === 'explanation') {
    const normalizedAnswer = answer.toLowerCase()
    const expectedWords = correctAnswer
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 4)

    return expectedWords.some((word) => normalizedAnswer.includes(word))
  }

  return normalize(answer) === normalize(correctAnswer)
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, '').replace(/x=/g, '').replace(/,/g, '')
}
