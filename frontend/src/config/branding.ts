import { getAllowedDomainsText, getExampleEmail } from '../utils/isAllowedEmail';

export const COMPANY_NAME = "Kraft Universe";
export const COMPANY_DOMAIN = "kraftuniverse.com";
export const APP_NAME = "Workshop Tracker";

// Branding messages with dynamic domain support
export const BRANDING_MESSAGES = {
  loginTitle: `${APP_NAME}`,
  loginSubtitle: `Secure Login - Company domains only`,
  signupTitle: `Join ${COMPANY_NAME}`,
  signupSubtitle: `Exclusive to company domains`,
  forgotPasswordTitle: `${COMPANY_NAME} Account`,
  forgotPasswordSubtitle: `Secure password reset for company domains`,
  emailPlaceholder: getExampleEmail(),
  emailValidationMessage: `Must be a company email (${getAllowedDomainsText()})`,
  authRestrictionMessage: `Only company email addresses are allowed (${getAllowedDomainsText()})`,
  signupAuthRestrictionMessage: `You must sign up with a company email (${getAllowedDomainsText()})`,
  copyright: `© 2024 ${COMPANY_NAME}. Secure authentication powered by Supabase.`,
  signupCopyright: `© 2024 ${COMPANY_NAME}. By signing up, you agree to our Terms of Service.`,
  forgotPasswordCopyright: `© 2024 ${COMPANY_NAME}. Secure password reset powered by Supabase.`,
  newUserPrompt: `New to ${COMPANY_NAME}?`,
  protectedRouteTitle: COMPANY_NAME,
  navbarTitle: APP_NAME,
}; 