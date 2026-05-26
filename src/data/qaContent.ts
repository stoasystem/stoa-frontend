export type QaItem = {
  question: string
  answer: string
}

export type QaCategory = {
  id: string
  title: string
  summary: string
  items: QaItem[]
}

export const qaCategories: QaCategory[] = [
  {
    id: 'students',
    title: 'Students',
    summary: 'How students ask questions, keep working, and get teacher help when needed.',
    items: [
      {
        question: 'How do students use STOA when they are stuck?',
        answer: 'Students open the learning chat, describe the homework problem, and work through a clear explanation or next step. The goal is to help them continue, not simply hand over final answers.',
      },
      {
        question: 'Can students upload homework or ask follow-up questions?',
        answer: 'Yes. The learning flow supports homework context and follow-up questions so a student can clarify what did not make sense and keep the explanation in one thread.',
      },
      {
        question: 'When does teacher support become relevant?',
        answer: 'Teacher support is used when the student needs a qualified teacher explanation, a confidence check, or a clearer next step beyond the automated learning assistant.',
      },
      {
        question: 'Does STOA include practice, or only chat?',
        answer: 'STOA includes guided practice paths and review moments alongside the learning chat, so students can build confidence after an explanation.',
      },
    ],
  },
  {
    id: 'parents',
    title: 'Parents',
    summary: 'What parents can see, how reports work, and how families evaluate STOA.',
    items: [
      {
        question: 'What can parents see?',
        answer: 'Parents can follow learning progress, recent activity, reports, and teacher-support moments without needing to read every private learning message.',
      },
      {
        question: 'Can parents test before paying?',
        answer: 'Yes. Families can start with the free trial, see how STOA fits homework routines, and choose a paid plan later.',
      },
      {
        question: 'How does STOA help parents understand progress?',
        answer: 'STOA summarizes learning history, weak topics, practice activity, and support records so parents can see where help is needed without interrupting study time.',
      },
      {
        question: 'Does STOA replace a parent or teacher?',
        answer: 'No. STOA organizes learning support. Parents stay informed, students keep working, and qualified teachers can step in for harder moments.',
      },
    ],
  },
  {
    id: 'teachers',
    title: 'Teachers',
    summary: 'Teacher responsibilities, application review, and dashboard access.',
    items: [
      {
        question: 'What are STOA teachers responsible for?',
        answer: 'Teachers explain the next step in a calm, age-appropriate way, review the student question and prior context, record the support outcome, and escalate unclear or unsafe cases.',
      },
      {
        question: 'How do teachers join a student request?',
        answer: 'When help is requested, the teacher sees the question, subject, grade, and prior explanation so the response stays connected to the existing learning thread.',
      },
      {
        question: 'How do I apply to teach on STOA?',
        answer: 'Create a teacher account, submit teaching subjects, education background, experience, and credential proof, then wait for review and interview approval.',
      },
      {
        question: 'Are teacher accounts activated immediately?',
        answer: 'No. Teacher dashboard access opens only after STOA reviews the profile, checks qualification evidence, and approves the teacher after interview.',
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing and plans',
    summary: 'Trial, checkout, limits, and plan changes.',
    items: [
      {
        question: 'Is payment live now?',
        answer: 'Checkout currently shows the plan choice flow without charging a card. Live payment collection will use a secure hosted payment page.',
      },
      {
        question: 'What happens when a plan limit is reached?',
        answer: 'STOA shows a clear upgrade or renewal path before support is interrupted.',
      },
      {
        question: 'Which plan should a family choose?',
        answer: 'Start with the support level your child needs: guided student support, parent visibility, or a teacher-supported plan for harder homework moments.',
      },
      {
        question: 'Can a family change plans later?',
        answer: 'Yes. The product flow is designed to make plan changes clear before billing or support access changes.',
      },
    ],
  },
]
