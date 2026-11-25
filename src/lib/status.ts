// Status vocabulary for the two lifecycles in docs/04-flowcharts.md that are
// settled: custom order and service request. The ready-made order sequence
// (N45) and the payment proof keys (proof-expired) are open, so they are not
// listed here. Labels follow docs/12-ui-components.md section 2.4.

export const customOrderStatuses = {
  draft: "Draft",
  submitted: "Submitted",
  "under-review": "Under review",
  rejected: "Rejected",
  "design-approved": "Design approved",
  "quotation-issued": "Quotation issued",
  "quotation-accepted": "Quotation accepted",
  declined: "Declined",
  "down-payment-verified": "Down payment verified",
  "in-production": "In production",
  "ready-for-claiming": "Ready for claiming",
  claimed: "Claimed",
  unclaimed: "Unclaimed",
} as const;

export const serviceStatuses = {
  submitted: "Submitted",
  received: "Received",
  "under-assessment": "Under assessment",
  "quotation-issued": "Quotation issued",
  "quotation-accepted": "Quotation accepted",
  "quotation-declined": "Quotation declined",
  "return-pending": "Declined, item to be returned",
  "down-payment-verified": "Down payment verified",
  "in-progress": "In progress",
  completed: "Completed",
  "ready-for-claiming": "Ready for claiming",
  claimed: "Claimed",
  unclaimed: "Unclaimed",
} as const;

export type CustomOrderStatus = keyof typeof customOrderStatuses;
export type ServiceStatus = keyof typeof serviceStatuses;
