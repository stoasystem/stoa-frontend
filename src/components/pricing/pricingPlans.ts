import type { BillingPlan } from '@/types/billing'

export const pricingPlans = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    priceMonthly: 0,
    currency: 'CHF',
    purchasable: false,
    recommended: false,
    audience: 'Families validating fit during pilot.',
    cta: 'Start free trial',
    features: ['Limited learning questions', 'Parent dashboard', 'Basic learning history'],
  },
  {
    id: 'student',
    name: 'Student Plan',
    priceMonthly: 29,
    currency: 'CHF',
    purchasable: true,
    recommended: false,
    audience: 'A focused learner who needs guided homework help.',
    cta: 'Select student',
    features: ['Question explanations', 'Homework upload', 'Parent dashboard'],
  },
  {
    id: 'teacher_supported',
    name: 'Teacher-supported Plan',
    priceMonthly: 89,
    currency: 'CHF',
    purchasable: true,
    recommended: false,
    audience: 'Families who want a teacher to answer a few questions in writing each week.',
    cta: 'Select teacher support',
    features: ['Everything in Student', 'Weekly parent report', 'Weekly text answers from a teacher'],
  },
  {
    id: 'online_classroom',
    name: 'Online classroom',
    // PLACEHOLDER: price not decided yet (stoa-backend#474)
    priceMonthly: 149,
    currency: 'CHF',
    purchasable: true,
    recommended: true,
    audience: 'Families who want a teacher to work through questions live with their child.',
    cta: 'Select online classroom',
    features: [
      'Everything in Teacher-supported',
      'Online classroom with a teacher (whiteboard and voice)',
      'Weekly text answers and online classrooms',
    ],
  },
] satisfies [BillingPlan, BillingPlan, BillingPlan, BillingPlan]
