export interface Payment {
  id: string
  subscriptionId: string
  amount: number
  currency: string
  timestamp: string
  status: string
  stripePaymentIntentId: string | null
  planId: string
  planName: string
  parentId: string
  parentEmail: string
  parentFullName: string
  transactionNumber?: string
}
