// Phase 2 repositories: the same interfaces as the mock, backed by the AURELIUS API routes.
import type { Repositories } from "../repositories";
import { apiAuth } from "./auth";
import {
  apiCatalog,
  apiCustomers,
  apiCustomization,
  apiCustomOrders,
  apiDrafts,
  apiEmails,
  apiKnowledge,
  apiNotifications,
  apiOrders,
  apiPayments,
  apiServices,
  apiSettings,
  apiTransactions,
} from "./repos";

export const apiRepositories: Repositories = {
  auth: apiAuth,
  catalog: apiCatalog,
  customization: apiCustomization,
  customOrders: apiCustomOrders,
  orders: apiOrders,
  services: apiServices,
  transactions: apiTransactions,
  payments: apiPayments,
  notifications: apiNotifications,
  settings: apiSettings,
  knowledge: apiKnowledge,
  customers: apiCustomers,
  drafts: apiDrafts,
  emails: apiEmails,
};
