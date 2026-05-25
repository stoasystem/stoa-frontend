import type { BillingPlan } from '@/components/billing/PlanCard'

export const pricingPlans: BillingPlan[] = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    price: 'CHF 0',
    audience: 'Families validating fit during pilot.',
    cta: 'Start free trial',
    features: ['Limited AI questions', 'Limited file uploads', 'Basic learning history'],
  },
  {
    id: 'student',
    name: 'Student Plan',
    price: 'CHF 19/mo',
    audience: 'A focused learner who needs guided homework help.',
    cta: 'Select student',
    features: ['AI learning chat', 'Homework upload', 'Learning history'],
  },
  {
    id: 'family',
    name: 'Family Plan',
    price: 'CHF 39/mo',
    audience: 'Parents who want a clearer view of progress.',
    cta: 'Select family',
    features: ['Everything in Student', 'Parent dashboard', 'Weekly parent report'],
  },
  {
    id: 'tutor_supported',
    name: 'Tutor-supported Plan',
    price: 'CHF 79/mo',
    audience: 'Families who want human teacher backup.',
    cta: 'Select tutor support',
    features: ['Everything in Family', 'Human teacher help quota', 'Priority teacher support'],
  },
]
