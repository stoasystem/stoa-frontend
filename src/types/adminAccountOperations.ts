import type { ParentAccountOperations, AccountOperationsBilling } from './parentAccountOperations'
import type { SubscriptionBillingEvent } from './subscriptionOperations'

export type AdminAccountOperationsBilling = AccountOperationsBilling & {
  events?: SubscriptionBillingEvent[]
}

export type AdminAccountOperations = Omit<ParentAccountOperations, 'billing'> & {
  billing: AdminAccountOperationsBilling
}
