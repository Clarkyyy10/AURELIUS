// Phase 2 repositories: the same interfaces as the mock, backed by the AURELIUS API routes.
import type { Repositories } from "../repositories";
import { UserFacingError } from "../repositories";
import { apiAuth } from "./auth";

/** Placeholder for repositories that are added in later Phase 2 stages. */
function notYet<T extends object>(name: string): T {
  return new Proxy({} as T, {
    get: (_t, prop) => () => Promise.reject(new UserFacingError(`${name}.${String(prop)} is not available yet.`)),
  });
}

export const apiRepositories: Repositories = {
  auth: apiAuth,
  catalog: notYet("catalog"),
  customization: notYet("customization"),
  customOrders: notYet("customOrders"),
  orders: notYet("orders"),
  services: notYet("services"),
  transactions: notYet("transactions"),
  payments: notYet("payments"),
  notifications: notYet("notifications"),
  settings: notYet("settings"),
  knowledge: notYet("knowledge"),
  customers: notYet("customers"),
  drafts: notYet("drafts"),
  emails: notYet("emails"),
};
