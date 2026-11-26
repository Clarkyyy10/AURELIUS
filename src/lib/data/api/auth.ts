import type { AuthRepo } from "../repositories";
import { UserFacingError } from "../repositories";
import { useClientState } from "../client-state";
import type { UserProfile } from "@/types";
import { api } from "./http";

const setUser = (user: UserProfile | null) => useClientState.getState().setUser(user);

export const apiAuth: AuthRepo = {
  async getSession() {
    const { user } = await api<{ user: UserProfile | null }>("GET", "/api/auth/session", undefined, { background: true });
    setUser(user);
    return { user };
  },
  async register(input) {
    // No session until the email is confirmed (FR-41): the page shows "check your inbox".
    const { user } = await api<{ user: UserProfile }>("POST", "/api/auth/register", {
      fullName: input.fullName,
      email: input.email,
      contactNumber: input.contactNumber,
      password: input.password,
      privacyConsent: input.privacyConsent,
      captchaToken: input.captchaToken,
    });
    return user;
  },
  async login(email, password, captchaToken) {
    const { user } = await api<{ user: UserProfile }>("POST", "/api/auth/login", { email, password, captchaToken });
    setUser(user);
    return user;
  },
  async logout() {
    await api("POST", "/api/auth/logout");
    setUser(null);
  },
  async resendVerification() {
    await api("POST", "/api/auth/resend-verification", {});
  },
  async verifyEmail(token) {
    // The email link is opened by /auth/confirm, which signs the person in and passes the result here.
    if (token !== "confirmed") throw new UserFacingError("This confirmation link is invalid or has expired. Ask for a new link below.");
    const { user } = await this.getSession();
    if (!user?.emailVerified) throw new UserFacingError("This confirmation link is invalid or has expired. Ask for a new link below.");
    return user;
  },
  async requestPasswordReset(email, captchaToken) {
    await api("POST", "/api/auth/forgot-password", { email, captchaToken });
  },
  async resetPassword(_token, newPassword) {
    await api("POST", "/api/auth/reset-password", { password: newPassword });
    setUser(null);
  },
  async updateProfile(input) {
    const { user } = await api<{ user: UserProfile }>("PATCH", "/api/account/profile", input);
    setUser(user);
    return user;
  },
  async changePassword(currentPassword, newPassword) {
    await api("POST", "/api/account/password", { currentPassword, newPassword });
  },
};
