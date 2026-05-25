import type { BillingPlan } from '@/types/billing'

export const pricingPlans: BillingPlan[] = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    priceMonthly: 0,
    currency: 'CHF',
    audience: 'Families validating fit during pilot.',
    cta: 'Start free trial',
    features: ['Limited AI questions', 'Limited file uploads', 'Basic learning history'],
  },
  {
    id: 'student',
    name: 'Student Plan',
    priceMonthly: 29,
    currency: 'CHF',
    audience: 'A focused learner who needs guided homework help.',
    cta: 'Select student',
    features: ['AI learning chat', 'Homework upload', 'Learning history'],
  },
  {
    id: 'family',
    name: 'Family Plan',
    priceMonthly: 49,
    currency: 'CHF',
    recommended: true,
    audience: 'Parents who want a clearer view of progress.',
    cta: 'Select family',
    features: ['Everything in Student', 'Parent dashboard', 'Weekly parent report'],
  },
  {
    id: 'tutor_supported',
    name: 'Tutor-supported Plan',
    priceMonthly: 89,
    currency: 'CHF',
    audience: 'Families who want human teacher backup.',
    cta: 'Select tutor support',
    features: ['Everything in Family', 'Human teacher help quota', 'Priority teacher support'],
  },
]
