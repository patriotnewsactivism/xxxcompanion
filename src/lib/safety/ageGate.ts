export const MINIMUM_AGE = 18;
export const AGE_COOKIE = "age_verified";

export function minimumAgeForJurisdiction(countryCode?: string): number {
  if (countryCode === "US" || countryCode === "GB") return 18;
  return MINIMUM_AGE;
}

export function computeAge(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = now.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return age;
}