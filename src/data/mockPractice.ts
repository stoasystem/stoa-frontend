import type {
  LearningUnit,
  PracticeAnswerResult,
  PracticeChallenge,
  PracticeHintResponse,
  PracticeLesson,
  PracticeLessonResult,
  PracticeMistake,
  PracticeOverview,
  PracticePath,
  PracticeRoadmap,
  PracticeRoadmapLesson,
  PracticeRoadmapUnit,
  PracticeSubject,
  PracticeTopic,
  CurriculumCatalog,
  CurriculumProgressSummary,
  RoadmapLessonStatus,
} from '@/types/practice'

const now = '2026-05-26T12:00:00Z'
const demoSubjectId = 'mathematics'
const legacyMathSubjectId = 'math'
const demoGradeLevel = 'lower_secondary'
const demoGradeLevelLabel = 'Lower secondary'
const demoTopicId = 'equations'
const demoTopicTitle = 'Equations'
const initialCompletedRoadmapLessons = ['lesson-linear-1']
const roadmapLessonOrder = [
  'lesson-linear-1',
  'lesson-linear-2',
  'lesson-linear-3',
  'lesson-linear-4',
  'lesson-quadratic-1',
  'lesson-quadratic-2',
  'lesson-system-1',
]
let completedRoadmapLessons = new Set(initialCompletedRoadmapLessons)
let currentRoadmapLessonId = 'lesson-linear-2'

export const practiceSubjects: PracticeSubject[] = [
  {
    id: demoSubjectId,
    name: 'Mathematics',
    description: 'Short challenges for key mathematics topics. Available now: the equations demo path.',
    gradeLevels: [
      {
        id: demoGradeLevel,
        label: demoGradeLevelLabel,
        order: 1,
      },
    ],
    progress: 46,
    accent: 'burgundy',
  },
  {
    id: 'physics',
    name: 'Physics',
    description: 'Short practice for forces, motion, energy, and school physics topics. Path content is being prepared.',
    gradeLevels: [
      {
        id: demoGradeLevel,
        label: demoGradeLevelLabel,
        order: 1,
      },
    ],
    progress: 0,
    accent: 'blue',
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    description: 'Practice for formulas, reactions, atoms, and lab reasoning. Path content is being prepared.',
    gradeLevels: [
      {
        id: demoGradeLevel,
        label: demoGradeLevelLabel,
        order: 1,
      },
    ],
    progress: 0,
    accent: 'green',
  },
  {
    id: 'english',
    name: 'English',
    description: 'Practice for reading, writing, grammar, and class assignments. Path content is being prepared.',
    gradeLevels: [
      {
        id: demoGradeLevel,
        label: demoGradeLevelLabel,
        order: 1,
      },
    ],
    progress: 0,
    accent: 'purple',
  },
]

export const practiceTopics: PracticeTopic[] = [
  {
    id: demoTopicId,
    subjectId: demoSubjectId,
    gradeLevel: demoGradeLevel,
    title: demoTopicTitle,
    description: 'Demo topic for linear equations, quadratic basics, and linear systems.',
    order: 1,
    status: 'available',
    progress: 35,
    currentLessonId: currentRoadmapLessonId,
  },
  {
    id: 'forces-motion',
    subjectId: 'physics',
    gradeLevel: demoGradeLevel,
    title: 'Forces and motion',
    description: 'Coming later: short practice for motion, forces, and simple diagrams.',
    order: 1,
    status: 'coming_later',
    progress: 0,
  },
  {
    id: 'atoms-reactions',
    subjectId: 'chemistry',
    gradeLevel: demoGradeLevel,
    title: 'Atoms and reactions',
    description: 'Coming later: short practice for particles, formulas, and reactions.',
    order: 1,
    status: 'coming_later',
    progress: 0,
  },
  {
    id: 'reading-writing',
    subjectId: 'english',
    gradeLevel: demoGradeLevel,
    title: 'Reading and writing',
    description: 'Coming later: short practice for comprehension, grammar, and written answers.',
    order: 1,
    status: 'coming_later',
    progress: 0,
  },
]

const challenges: Record<string, PracticeChallenge[]> = {
  'lesson-linear-1': [
    mc('linear-1-c1', 'lesson-linear-1', 'Which move starts solving x + 7 = 12?', [
      'Add 7 to both sides',
      'Subtract 7 from both sides',
      'Multiply both sides by 7',
      'Divide both sides by 7',
    ], 'Subtract 7 from both sides', 'Look at the +7. Use the opposite operation to remove it.', 'Correct. Subtracting 7 keeps both sides equal and starts isolating x.', 'Not quite. Focus on the +7 first: what operation undoes addition?', 'One-step equations'),
    input('linear-1-c2', 'lesson-linear-1', 'Solve x + 7 = 12. Write the value of x.', '5', 'Think about what number added to 7 gives 12.', 'Correct. You found the number that makes both sides equal.', 'Not quite. Try subtracting 7 from both sides first.', 'One-step equations'),
    order('linear-1-c3', 'lesson-linear-1', 'Order the steps for solving x - 4 = 9.', [
      'Start with x - 4 = 9',
      'Add 4 to both sides',
      'Write x = 13',
    ], ['Start with x - 4 = 9', 'Add 4 to both sides', 'Write x = 13'], 'Start from the equation, then undo the subtraction.', 'Correct. Adding 4 to both sides leaves x by itself.', 'Not quite. The first step is to identify the operation next to x.', 'One-step equations'),
  ],
  'lesson-linear-2': [
    mc('linear-2-c1', 'lesson-linear-2', 'In 3x + 5 = 20, what should you remove first?', [
      '+5',
      '3x',
      '20',
      'x',
    ], '+5', 'Remove the term that is added after 3x.', 'Correct. Removing +5 first leaves the term with x ready to divide.', 'Not quite. Look at the operation furthest from x.', 'Solving equations in two steps'),
    input('linear-2-c2', 'lesson-linear-2', 'Solve 3x + 5 = 20. Write the value of x.', '5', 'First remove the +5. Then divide by 3.', 'Correct. Subtracting 5 first gives 3x = 15, then x = 5.', 'Not quite. Try finding 3x before finding x.', 'Solving equations in two steps'),
    explanation('linear-2-c3', 'lesson-linear-2', 'Why do we divide by 3 after subtracting 5?', 'to leave x by itself', 'After subtracting 5, the equation has 3 times x.', 'Correct. Dividing by 3 undoes multiplication and leaves x by itself.', 'Not quite. Think about what operation undoes multiplying x by 3.', 'Solving equations in two steps'),
  ],
  'lesson-linear-3': [
    mc('linear-3-c1', 'lesson-linear-3', 'Solve 2(x + 3) = 14. What is a good first move?', [
      'Divide both sides by 2',
      'Add 3 to both sides',
      'Subtract 14 from both sides',
      'Multiply both sides by 2',
    ], 'Divide both sides by 2', 'The whole bracket is multiplied by 2.', 'Correct. Dividing by 2 changes the equation to x + 3 = 7.', 'Not quite. Notice the 2 outside the brackets.', 'Equations with brackets'),
    input('linear-3-c2', 'lesson-linear-3', 'Solve 2(x + 3) = 14. Write the value of x.', '4', 'You can first divide both sides by 2, then solve what remains.', 'Correct. 2(x + 3) = 14 becomes x + 3 = 7, so x = 4.', 'Not quite. First make the bracket equal to 7.', 'Equations with brackets'),
    order('linear-3-c3', 'lesson-linear-3', 'Order the steps for 2(x + 3) = 14.', [
      'Divide both sides by 2',
      'Write x + 3 = 7',
      'Subtract 3 from both sides',
      'Write x = 4',
    ], ['Divide both sides by 2', 'Write x + 3 = 7', 'Subtract 3 from both sides', 'Write x = 4'], 'Work outside the brackets before solving inside them.', 'Correct. Each operation keeps the equation balanced.', 'Not quite. Start by undoing the multiplication outside the bracket.', 'Equations with brackets'),
  ],
  'lesson-linear-4': [
    mc('linear-4-c1', 'lesson-linear-4', 'A notebook costs CHF 4. Mia spends CHF 20. Which equation finds n notebooks?', [
      'n + 4 = 20',
      '4n = 20',
      '20n = 4',
      'n - 4 = 20',
    ], '4n = 20', 'Total cost equals price per notebook times number of notebooks.', 'Correct. CHF 4 per notebook times n notebooks gives 4n = 20.', 'Not quite. Match total cost to price times quantity.', 'Equation word problems'),
    input('linear-4-c2', 'lesson-linear-4', 'Solve 4n = 20. How many notebooks did Mia buy?', '5', 'Divide the total cost by the cost per notebook.', 'Correct. 20 divided by 4 is 5 notebooks.', 'Not quite. The unknown is the number of notebooks, so divide 20 by 4.', 'Equation word problems'),
    explanation('linear-4-c3', 'lesson-linear-4', 'What does n represent in 4n = 20?', 'number of notebooks', 'Look for the unknown quantity in the story.', 'Correct. n is the number of notebooks Mia bought.', 'Not quite. Identify what the story is asking you to find.', 'Equation word problems'),
  ],
  'lesson-quadratic-1': [
    mc('quad-1-c1', 'lesson-quadratic-1', 'Which one is a quadratic equation?', [
      'x + 3 = 7',
      'x^2 - 5x + 6 = 0',
      '2x = 10',
      'y = 3x + 1',
    ], 'x^2 - 5x + 6 = 0', 'Look for an equation that contains x squared.', 'Correct. The x^2 term makes this a quadratic equation.', 'Not quite. A quadratic equation includes a squared variable.', 'Recognizing quadratic equations'),
    mc('quad-1-c2', 'lesson-quadratic-1', 'Which term shows the equation is quadratic: x^2 - 5x + 6 = 0?', [
      'x^2',
      '-5x',
      '+6',
      '= 0',
    ], 'x^2', 'Quadratic means the variable is squared.', 'Correct. x^2 is the squared term.', 'Not quite. Find the term where x is multiplied by itself.', 'Recognizing quadratic equations'),
    explanation('quad-1-c3', 'lesson-quadratic-1', 'Why is x + 3 = 7 not quadratic?', 'there is no x squared term', 'Check whether the variable is squared.', 'Correct. It is linear because x is not squared.', 'Not quite. Compare x with x^2.', 'Recognizing quadratic equations'),
  ],
  'lesson-quadratic-2': [
    mc('quad-2-c1', 'lesson-quadratic-2', 'Factor x^2 - 5x + 6.', [
      '(x - 2)(x - 3)',
      '(x + 2)(x + 3)',
      '(x - 1)(x - 6)',
      '(x + 1)(x - 6)',
    ], '(x - 2)(x - 3)', 'Find two numbers that multiply to 6 and add to -5.', 'Correct. -2 and -3 multiply to 6 and add to -5.', 'Not quite. Look for two negative numbers with product 6.', 'Factoring simple quadratics'),
    input('quad-2-c2', 'lesson-quadratic-2', 'In x^2 - 7x + 10, which two numbers multiply to 10 and add to -7? Write them with a comma.', '-5,-2', 'List factor pairs of 10, then choose the pair with sum -7.', 'Correct. -5 and -2 multiply to 10 and add to -7.', 'Not quite. The two numbers need a positive product and a negative sum.', 'Factoring simple quadratics'),
    order('quad-2-c3', 'lesson-quadratic-2', 'Order the factoring steps for x^2 - 7x + 10.', [
      'Find factors of 10',
      'Choose -5 and -2 because they add to -7',
      'Write (x - 5)(x - 2)',
    ], ['Find factors of 10', 'Choose -5 and -2 because they add to -7', 'Write (x - 5)(x - 2)'], 'Choose the numbers before writing the brackets.', 'Correct. The factors match both the product and the sum.', 'Not quite. Start by finding possible factor pairs.', 'Factoring simple quadratics'),
  ],
  'lesson-quadratic-3': [
    mc('quad-3-c1', 'lesson-quadratic-3', 'For (x - 2)(x - 3) = 0, what idea helps solve it?', [
      'If a product is zero, one factor is zero',
      'Add the two brackets',
      'Ignore the brackets',
      'Divide by x',
    ], 'If a product is zero, one factor is zero', 'A product equals 0 only when at least one factor is 0.', 'Correct. This is the zero-product idea.', 'Not quite. Focus on why multiplying two factors can give 0.', 'Solving factored quadratics'),
    input('quad-3-c2', 'lesson-quadratic-3', 'Solve (x - 2)(x - 3) = 0. Write both values separated by a comma.', '2,3', 'Set each factor equal to 0.', 'Correct. x - 2 = 0 gives 2, and x - 3 = 0 gives 3.', 'Not quite. Solve each bracket as a small equation.', 'Solving factored quadratics'),
    explanation('quad-3-c3', 'lesson-quadratic-3', 'Why can this equation have two answers?', 'either factor can be zero', 'There are two separate factors that could make the product zero.', 'Correct. Each factor gives one possible value for x.', 'Not quite. Think about which bracket could become zero.', 'Solving factored quadratics'),
  ],
  'lesson-quadratic-4': [
    mc('quad-4-c1', 'lesson-quadratic-4', 'Which value checks correctly in x^2 - 5x + 6 = 0?', [
      'x = 2',
      'x = 4',
      'x = 5',
      'x = 6',
    ], 'x = 2', 'Put the value into the original equation and see if the result is 0.', 'Correct. 2^2 - 5(2) + 6 = 0.', 'Not quite. Substitute the value and check whether the left side becomes 0.', 'Checking quadratic solutions'),
    mc('quad-4-c2', 'lesson-quadratic-4', 'For x^2 - 5x + 6 = 0, which pair should be checked?', [
      'x = 2 and x = 3',
      'x = -2 and x = -3',
      'x = 1 and x = 6',
      'x = 0 and x = 6',
    ], 'x = 2 and x = 3', 'Use the factor form (x - 2)(x - 3).', 'Correct. Both 2 and 3 make one factor equal to zero.', 'Not quite. Look at the numbers in the factor form.', 'Checking quadratic solutions'),
    explanation('quad-4-c3', 'lesson-quadratic-4', 'Why should we check both solutions?', 'both values must make the original equation true', 'Each answer should make the original equation equal 0.', 'Correct. Checking confirms each value works in the original equation.', 'Not quite. A solution is only useful if it satisfies the original equation.', 'Checking quadratic solutions'),
  ],
  'lesson-system-1': [
    mc('system-1-c1', 'lesson-system-1', 'Which pair solves the system? x + y = 7 and x - y = 1', [
      'x = 4, y = 3',
      'x = 3, y = 4',
      'x = 5, y = 2',
      'x = 2, y = 5',
    ], 'x = 4, y = 3', 'Try putting each pair into both equations.', 'Correct. 4 + 3 = 7 and 4 - 3 = 1.', 'Not quite. The pair must work in both equations.', 'Systems of equations'),
    explanation('system-1-c2', 'lesson-system-1', 'What does a solution to a system need to do?', 'satisfy both equations', 'A system has more than one equation.', 'Correct. One pair must make both equations true.', 'Not quite. Check whether one answer must work in one equation or both.', 'Systems of equations'),
    order('system-1-c3', 'lesson-system-1', 'Order the checking steps for x = 4, y = 3.', [
      'Check x + y = 7',
      'Check x - y = 1',
      'Confirm both equations are true',
    ], ['Check x + y = 7', 'Check x - y = 1', 'Confirm both equations are true'], 'A system solution must pass both checks.', 'Correct. Both equations must be true for the same pair.', 'Not quite. Check one equation, then the other, then decide.', 'Systems of equations'),
  ],
  'lesson-system-2': [
    mc('system-2-c1', 'lesson-system-2', 'In y = x + 1 and x + y = 9, what should replace y?', [
      'x + 1',
      '9',
      'x - 1',
      '1',
    ], 'x + 1', 'Use the expression that y is equal to.', 'Correct. Substitution means replacing y with x + 1.', 'Not quite. Look at the equation that already tells you y.', 'Solving by substitution'),
    input('system-2-c2', 'lesson-system-2', 'After substituting, solve x + (x + 1) = 9. What is x?', '4', 'Combine the x terms first.', 'Correct. 2x + 1 = 9, so x = 4.', 'Not quite. Combine x + x before solving.', 'Solving by substitution'),
    input('system-2-c3', 'lesson-system-2', 'Solve the system y = x + 1 and x + y = 9. Write x then y, separated by a comma.', '4,5', 'After finding x, use y = x + 1.', 'Correct. x = 4 and y = 5 satisfy both equations.', 'Not quite. Find x first, then substitute into y = x + 1.', 'Solving by substitution'),
  ],
  'lesson-system-3': [
    mc('system-3-c1', 'lesson-system-3', 'For x + y = 8 and x - y = 2, what happens if you add the equations?', [
      'The y terms cancel',
      'The x terms cancel',
      'Both variables disappear',
      'The equations become harder',
    ], 'The y terms cancel', 'Look at +y and -y.', 'Correct. +y and -y cancel when the equations are added.', 'Not quite. Focus on the signs in front of y.', 'Solving by elimination'),
    input('system-3-c2', 'lesson-system-3', 'Add the equations x + y = 8 and x - y = 2. What is x?', '5', 'Adding gives 2x = 10.', 'Correct. 2x = 10, so x = 5.', 'Not quite. After the y terms cancel, divide 10 by 2.', 'Solving by elimination'),
    input('system-3-c3', 'lesson-system-3', 'Solve x + y = 8 and x - y = 2. Write x then y, separated by a comma.', '5,3', 'Use x = 5 in either original equation.', 'Correct. x = 5 and y = 3 satisfy both equations.', 'Not quite. Substitute x = 5 back into x + y = 8.', 'Solving by elimination'),
  ],
  'lesson-system-4': [
    mc('system-4-c1', 'lesson-system-4', 'Which equation should x = 5, y = 3 satisfy in the system x + y = 8 and x - y = 2?', [
      'Both equations',
      'Only the first equation',
      'Only the second equation',
      'Neither equation',
    ], 'Both equations', 'A system solution must work in every equation.', 'Correct. A solution pair must satisfy both equations.', 'Not quite. A system has more than one equation to check.', 'Checking system solutions'),
    order('system-4-c2', 'lesson-system-4', 'Order the checking steps for x = 5, y = 3.', [
      'Check 5 + 3 = 8',
      'Check 5 - 3 = 2',
      'Confirm the pair solves the system',
    ], ['Check 5 + 3 = 8', 'Check 5 - 3 = 2', 'Confirm the pair solves the system'], 'Check both equations before deciding.', 'Correct. The same pair works in both equations.', 'Not quite. A pair solves the system only after both checks pass.', 'Checking system solutions'),
    explanation('system-4-c3', 'lesson-system-4', 'Why is checking both equations important?', 'the pair must satisfy both equations', 'One equation alone is not enough for a system.', 'Correct. A system solution must make every equation true.', 'Not quite. Think about what the word system means here.', 'Checking system solutions'),
  ],
}

const mathLessons: PracticeLesson[] = [
  lesson('lesson-linear-1', 'unit-linear-equations', demoSubjectId, 'One-step equations', 'One-step equations', 'available', 'intro', 4),
  lesson('lesson-linear-2', 'unit-linear-equations', demoSubjectId, 'Solving equations in two steps', 'Solving equations in two steps', 'available', 'practice', 5),
  lesson('lesson-linear-3', 'unit-linear-equations', demoSubjectId, 'Equations with brackets', 'Equations with brackets', 'available', 'practice', 6),
  lesson('lesson-linear-4', 'unit-linear-equations', demoSubjectId, 'Word problems with linear equations', 'Equation word problems', 'available', 'review', 6),
  lesson('lesson-quadratic-1', 'unit-quadratic-equations', demoSubjectId, 'Recognizing quadratic equations', 'Recognizing quadratic equations', 'available', 'intro', 4),
  lesson('lesson-quadratic-2', 'unit-quadratic-equations', demoSubjectId, 'Factoring simple quadratics', 'Factoring simple quadratics', 'available', 'practice', 6),
  lesson('lesson-quadratic-3', 'unit-quadratic-equations', demoSubjectId, 'Solving factored quadratics', 'Solving factored quadratics', 'available', 'practice', 6),
  lesson('lesson-quadratic-4', 'unit-quadratic-equations', demoSubjectId, 'Checking two solutions', 'Checking quadratic solutions', 'available', 'review', 5),
  lesson('lesson-system-1', 'unit-linear-systems', demoSubjectId, 'What is a system of equations?', 'Systems of equations', 'available', 'intro', 4),
  lesson('lesson-system-2', 'unit-linear-systems', demoSubjectId, 'Solving by substitution', 'Solving by substitution', 'available', 'practice', 6),
  lesson('lesson-system-3', 'unit-linear-systems', demoSubjectId, 'Solving by elimination', 'Solving by elimination', 'available', 'practice', 6),
  lesson('lesson-system-4', 'unit-linear-systems', demoSubjectId, 'Checking the solution', 'Checking system solutions', 'available', 'review', 5),
]

export const practiceUnits: LearningUnit[] = [
  {
    id: 'unit-linear-equations',
    subjectId: demoSubjectId,
    gradeLevel: demoGradeLevel,
    topicId: demoTopicId,
    title: 'Linear equations in one variable',
    description: 'Build the habit of balancing both sides while isolating x.',
    order: 1,
    status: 'available',
    lessons: mathLessons.slice(0, 4),
  },
  {
    id: 'unit-quadratic-equations',
    subjectId: demoSubjectId,
    gradeLevel: demoGradeLevel,
    topicId: demoTopicId,
    title: 'Quadratic equations',
    description: 'Recognize simple quadratics, factor them, and check both solutions.',
    order: 2,
    status: 'available',
    lessons: mathLessons.slice(4, 8),
  },
  {
    id: 'unit-linear-systems',
    subjectId: demoSubjectId,
    gradeLevel: demoGradeLevel,
    topicId: demoTopicId,
    title: 'Linear systems in two variables',
    description: 'Use substitution, elimination, and checking with ordered pairs.',
    order: 3,
    status: 'available',
    lessons: mathLessons.slice(8),
  },
]

export const mockPractice = {
  mathematics: {
    lowerSecondary: {
      equations: {
        subject: practiceSubjects[0],
        topic: practiceTopics[0],
        units: practiceUnits,
        lessons: mathLessons,
      },
    },
  },
}

export function getMockPracticeRoadmap(subjectId: string, topicId = demoTopicId): PracticeRoadmap {
  const resolvedSubjectId = normalizeSubjectId(subjectId)
  const resolvedTopicId = normalizeTopicId(topicId)
  const roadmapLessons = buildRoadmapLessons(resolvedSubjectId, resolvedTopicId)
  const completedCount = roadmapLessons.filter((lesson) => lesson.status === 'completed' || lesson.status === 'review').length
  const progress = Math.round((completedCount / roadmapLessons.length) * 100)

  return {
    subjectId: resolvedSubjectId,
    topicId: resolvedTopicId,
    gradeLevel: demoGradeLevel,
    topic: {
      id: resolvedTopicId,
      subjectId: resolvedSubjectId,
      gradeLevel: demoGradeLevel,
      title: demoTopicTitle,
      description: 'Follow short equation lessons in a calm roadmap before asking about unclear steps.',
      progress,
      currentLessonId: currentRoadmapLessonId,
    },
    progress,
    currentLessonId: currentRoadmapLessonId,
    units: buildRoadmapUnits(resolvedSubjectId, resolvedTopicId),
  }
}

export const mockPracticeMistakes: PracticeMistake[] = [
  {
    id: 'mistake-1',
    subjectId: demoSubjectId,
    subjectName: 'Mathematics',
    gradeLevel: demoGradeLevel,
    topicId: demoTopicId,
    lessonId: 'lesson-linear-2',
    lessonTitle: 'Solving equations in two steps',
    challengeId: 'linear-2-c2',
    topic: 'Solving equations in two steps',
    prompt: 'Solve 3x + 5 = 20. Write the value of x.',
    studentAnswer: '15',
    correctAnswer: '5',
    hint: 'First remove the +5. Then divide by 3.',
    reviewed: false,
    createdAt: now,
  },
  {
    id: 'mistake-2',
    subjectId: demoSubjectId,
    subjectName: 'Mathematics',
    gradeLevel: demoGradeLevel,
    topicId: demoTopicId,
    lessonId: 'lesson-system-2',
    lessonTitle: 'Solving by substitution',
    challengeId: 'system-2-c3',
    topic: 'Solving by substitution',
    prompt: 'Solve the system y = x + 1 and x + y = 9.',
    studentAnswer: 'x = 5, y = 4',
    correctAnswer: 'x = 4, y = 5',
    hint: 'After finding x, use y = x + 1.',
    reviewed: true,
    createdAt: now,
  },
]

export function getMockPracticeOverview(): PracticeOverview {
  const recommendedLesson = getMockLesson('lesson-linear-2') ?? mathLessons[1]

  return {
    subjects: practiceSubjects,
    topics: practiceTopics,
    recommendedLesson,
    dailyGoal: {
      completed: 2,
      target: 3,
      label: '2 of 3 practice challenges',
    },
    studyStreak: 5,
    progressPoints: 264,
    recentMistakes: mockPracticeMistakes,
    weakTopics: [
      {
        id: 'weak-practice-1',
        subject: 'Mathematics',
        topic: 'Solving equations in two steps',
        note: 'Could benefit from one more guided attempt with isolating x.',
      },
      {
        id: 'weak-practice-2',
        subject: 'Mathematics',
        topic: 'Solving by substitution',
        note: 'Review how to replace y before solving the equation.',
      },
    ],
  }
}

export function getMockPracticePath(subjectId: string, topicId = demoTopicId): PracticePath {
  const resolvedSubjectId = normalizeSubjectId(subjectId)
  const resolvedTopicId = normalizeTopicId(topicId)

  return {
    subjectId: resolvedSubjectId,
    gradeLevel: demoGradeLevel,
    topicId: resolvedTopicId,
    topicTitle: demoTopicTitle,
    units: practiceUnits.filter((unit) => unit.subjectId === resolvedSubjectId && unit.topicId === resolvedTopicId),
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
      ? challenge?.correctFeedback ?? 'Good work. You used the right step.'
      : challenge?.incorrectFeedback ?? 'Not quite. Use the hint, then try once more.',
    explanation: correct ? challenge?.explanation : undefined,
    hint: challenge?.hint,
    nextChallengeId,
    attemptsRemaining: correct ? 2 : 1,
    canAskLearningAssistant: !correct,
    canAskTeacher: !correct && currentIndex >= 1,
  }
}

export function completeMockLesson(lessonId: string): PracticeLessonResult {
  const targetLesson = getMockLesson(lessonId) ?? mathLessons[0]
  const totalCount = targetLesson.challenges.length
  advanceMockRoadmapProgress(lessonId)

  return {
    lessonId,
    subjectId: targetLesson.subjectId,
    gradeLevel: targetLesson.gradeLevel,
    topicId: targetLesson.topicId,
    correctCount: Math.max(totalCount - 1, 1),
    totalCount,
    progressPoints: totalCount * 8,
    studyStreak: 6,
    timeSpentSeconds: totalCount * 70,
    mistakes: mockPracticeMistakes.filter((mistake) => mistake.lessonId === lessonId),
  }
}

function buildRoadmapUnits(subjectId: string, topicId: string): PracticeRoadmapUnit[] {
  return [
    {
      id: 'unit-linear-equations',
      title: 'Linear equations',
      description: 'Build confidence with equations step by step.',
      order: 1,
      lessons: roadmapLessonOrder.slice(0, 4).map((lessonId, index) => roadmapLesson(lessonId, subjectId, topicId, index + 1)),
    },
    {
      id: 'unit-quadratic-basics',
      title: 'Quadratic basics',
      description: 'Recognize simple quadratic patterns after the linear path is secure.',
      order: 2,
      lessons: roadmapLessonOrder.slice(4, 6).map((lessonId, index) => roadmapLesson(lessonId, subjectId, topicId, index + 1)),
    },
    {
      id: 'unit-linear-systems-roadmap',
      title: 'Linear systems',
      description: 'Connect two equations once the first roadmap sequence is complete.',
      order: 3,
      lessons: roadmapLessonOrder.slice(6).map((lessonId, index) => roadmapLesson(lessonId, subjectId, topicId, index + 1)),
    },
  ]
}

function buildRoadmapLessons(subjectId: string, topicId: string) {
  return buildRoadmapUnits(subjectId, topicId).flatMap((unit) => unit.lessons)
}

function roadmapLesson(
  lessonId: string,
  subjectId: string,
  topicId: string,
  order: number,
): PracticeRoadmapLesson {
  const sourceLesson = getMockLesson(lessonId) ?? mathLessons[0]
  const status = getRoadmapLessonStatus(lessonId)

  return {
    id: sourceLesson.id,
    title: sourceLesson.title,
    description: sourceLesson.topic,
    order,
    status,
    estimatedMinutes: sourceLesson.estimatedMinutes,
    unlockCondition: status === 'locked' ? 'Complete the previous lesson first.' : undefined,
    subjectId,
    gradeLevel: sourceLesson.gradeLevel,
    topicId,
    unitId: sourceLesson.unitId,
    challengeCount: sourceLesson.challenges.length,
  }
}

function getRoadmapLessonStatus(lessonId: string): RoadmapLessonStatus {
  if (completedRoadmapLessons.has(lessonId)) {
    return lessonId === 'lesson-linear-1' ? 'completed' : 'review'
  }

  if (lessonId === currentRoadmapLessonId) {
    return 'current'
  }

  const currentIndex = roadmapLessonOrder.indexOf(currentRoadmapLessonId)
  const lessonIndex = roadmapLessonOrder.indexOf(lessonId)

  if (lessonIndex === currentIndex + 1) {
    return 'available'
  }

  return 'locked'
}

function advanceMockRoadmapProgress(lessonId: string) {
  if (!roadmapLessonOrder.includes(lessonId)) return

  completedRoadmapLessons = new Set([...completedRoadmapLessons, lessonId])
  const lessonIndex = roadmapLessonOrder.indexOf(lessonId)
  const nextLessonId = roadmapLessonOrder[lessonIndex + 1]

  if (nextLessonId) {
    currentRoadmapLessonId = nextLessonId
  }
}

export function getMockPracticeHint(challengeId: string): PracticeHintResponse {
  const challenge = Object.values(challenges).flat().find((item) => item.id === challengeId)

  return {
    title: 'Focus on the next step',
    hint: challenge?.hint ?? 'Look for the operation you can undo first.',
    nextStep: 'Try one more answer after applying the hint. If the step is still unclear, ask for a guided explanation.',
  }
}

export function getMockCurriculumCatalog(): CurriculumCatalog {
  return {
    subjects: [
      {
        id: 'math',
        name: 'Mathematics',
        description: 'Active curriculum path with equation lessons and exercise bank coverage.',
        gradeLevels: [demoGradeLevel],
        language: 'neutral',
        rolloutState: 'active',
        order: 1,
      },
      {
        id: 'physics',
        name: 'Physics',
        description: 'Forces and motion rollout prepared for teacher-reviewed practice expansion.',
        gradeLevels: [demoGradeLevel],
        language: 'neutral',
        rolloutState: 'active',
        order: 2,
      },
      {
        id: 'german',
        name: 'German',
        description: 'Grammar and reading rollout with language metadata.',
        gradeLevels: [demoGradeLevel],
        language: 'de',
        rolloutState: 'active',
        order: 3,
      },
      {
        id: 'english',
        name: 'English',
        description: 'Reading, writing, and grammar rollout with language metadata.',
        gradeLevels: [demoGradeLevel],
        language: 'en',
        rolloutState: 'active',
        order: 4,
      },
    ],
    topics: [
      {
        id: demoTopicId,
        subjectId: 'math',
        gradeLevel: demoGradeLevel,
        title: demoTopicTitle,
        description: 'Linear equations, quadratics, and systems.',
        rolloutState: 'active',
        order: 1,
      },
      {
        id: 'forces-motion',
        subjectId: 'physics',
        gradeLevel: demoGradeLevel,
        title: 'Forces and motion',
        description: 'Free-body reasoning and simple motion situations.',
        rolloutState: 'active',
        order: 1,
      },
      {
        id: 'cases-and-articles',
        subjectId: 'german',
        gradeLevel: demoGradeLevel,
        title: 'Cases and articles',
        description: 'Nominative, accusative, and article endings.',
        rolloutState: 'active',
        order: 1,
      },
      {
        id: 'reading-writing',
        subjectId: 'english',
        gradeLevel: demoGradeLevel,
        title: 'Reading and writing',
        description: 'Comprehension, grammar, and structured written answers.',
        rolloutState: 'active',
        order: 1,
      },
    ],
    units: practiceUnits.map((unit) => ({
      id: unit.id,
      subjectId: unit.subjectId === demoSubjectId ? 'math' : unit.subjectId,
      gradeLevel: unit.gradeLevel,
      topicId: unit.topicId,
      title: unit.title,
      description: unit.description,
      rolloutState: 'active',
      order: unit.order,
    })),
    lessons: practiceUnits.flatMap((unit) =>
      unit.lessons.map((lessonItem) => ({
        id: lessonItem.id,
        subjectId: lessonItem.subjectId === demoSubjectId ? 'math' : lessonItem.subjectId,
        gradeLevel: lessonItem.gradeLevel,
        unitId: lessonItem.unitId,
        topicId: lessonItem.topicId,
        title: lessonItem.title,
        objective: lessonItem.topic,
        difficulty: lessonItem.difficulty,
        estimatedMinutes: lessonItem.estimatedMinutes,
        rolloutState: 'active' as const,
        exerciseCount: lessonItem.challenges.length,
        source: 'practice_backfill',
      })),
    ),
    rolloutSubjects: ['english', 'german', 'math', 'physics'],
    includePreview: false,
    source: 'practice_backfill',
  }
}

export function getMockCurriculumProgress(studentId = 'user-student', subjectId?: string): CurriculumProgressSummary {
  return {
    studentId,
    subjectId,
    completedLessons: completedRoadmapLessons.size,
    completedLessonIds: [...completedRoadmapLessons],
    mistakeCount: mockPracticeMistakes.length,
    weakTopics: [
      { topicId: demoTopicId, count: 2 },
      { topicId: 'cases-and-articles', count: 1 },
    ],
    source: 'practice_progress',
  }
}

function mc(
  id: string,
  lessonId: string,
  prompt: string,
  options: string[],
  correctAnswer: string,
  hint: string,
  correctFeedback: string,
  incorrectFeedback: string,
  topic: string,
): PracticeChallenge {
  return challenge(id, lessonId, 'multiple_choice', prompt, correctAnswer, hint, correctFeedback, incorrectFeedback, topic, options)
}

function input(
  id: string,
  lessonId: string,
  prompt: string,
  correctAnswer: string,
  hint: string,
  correctFeedback: string,
  incorrectFeedback: string,
  topic: string,
): PracticeChallenge {
  return challenge(id, lessonId, 'text_input', prompt, correctAnswer, hint, correctFeedback, incorrectFeedback, topic)
}

function explanation(
  id: string,
  lessonId: string,
  prompt: string,
  correctAnswer: string,
  hint: string,
  correctFeedback: string,
  incorrectFeedback: string,
  topic: string,
): PracticeChallenge {
  return challenge(id, lessonId, 'explanation', prompt, correctAnswer, hint, correctFeedback, incorrectFeedback, topic)
}

function order(
  id: string,
  lessonId: string,
  prompt: string,
  options: string[],
  correctAnswer: string[],
  hint: string,
  correctFeedback: string,
  incorrectFeedback: string,
  topic: string,
): PracticeChallenge {
  return challenge(id, lessonId, 'ordering', prompt, correctAnswer, hint, correctFeedback, incorrectFeedback, topic, options)
}

function challenge(
  id: string,
  lessonId: string,
  type: PracticeChallenge['type'],
  prompt: string,
  correctAnswer: string | string[],
  hint: string,
  correctFeedback: string,
  incorrectFeedback: string,
  topic: string,
  options?: string[],
): PracticeChallenge {
  const unitId = getLessonUnitId(lessonId)

  return {
    id,
    lessonId,
    unitId,
    subjectId: demoSubjectId,
    gradeLevel: demoGradeLevel,
    topicId: demoTopicId,
    topic,
    type,
    prompt,
    options,
    correctAnswer,
    hint,
    explanation: correctFeedback,
    correctFeedback,
    incorrectFeedback,
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
    gradeLevel: demoGradeLevel,
    topicId: demoTopicId,
    title,
    topic,
    status,
    difficulty,
    estimatedMinutes,
    challenges: challenges[id],
  }
}

function normalizeSubjectId(subjectId: string) {
  return subjectId === legacyMathSubjectId ? demoSubjectId : subjectId
}

function normalizeTopicId(topicId: string) {
  return topicId || demoTopicId
}

function getLessonUnitId(lessonId: string) {
  if (lessonId.startsWith('lesson-quadratic')) {
    return 'unit-quadratic-equations'
  }

  if (lessonId.startsWith('lesson-system')) {
    return 'unit-linear-systems'
  }

  return 'unit-linear-equations'
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
  return value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[xy]\s*=/g, '')
    .replace(/and/g, '')
    .replace(/,/g, '')
    .replace(/[()]/g, '')
}
