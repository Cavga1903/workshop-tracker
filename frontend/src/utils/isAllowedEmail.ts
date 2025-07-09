export const ALLOWED_DOMAINS = ["kraftstories.com", "kraftuniverse.com"];

export function isAllowedEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const normalizedEmail = email.toLowerCase().trim();
  return ALLOWED_DOMAINS.some(domain => normalizedEmail.endsWith("@" + domain));
}

export function getAllowedDomainsText(): string {
  if (ALLOWED_DOMAINS.length === 1) {
    return `@${ALLOWED_DOMAINS[0]}`;
  }
  
  if (ALLOWED_DOMAINS.length === 2) {
    return `@${ALLOWED_DOMAINS[0]} or @${ALLOWED_DOMAINS[1]}`;
  }
  
  const lastDomain = ALLOWED_DOMAINS[ALLOWED_DOMAINS.length - 1];
  const otherDomains = ALLOWED_DOMAINS.slice(0, -1);
  return `@${otherDomains.join(", @")} or @${lastDomain}`;
}

export function getExampleEmail(): string {
  return `yourname@${ALLOWED_DOMAINS[0]}`;
}

// Optional: Log failed attempts for analytics/debugging
export function logFailedDomainAttempt(email: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('🚫 Invalid domain attempted:', email);
  }
  
  // Could extend this to send to analytics service
  // analytics.track('invalid_domain_attempt', { email: email.split('@')[1] });
} 