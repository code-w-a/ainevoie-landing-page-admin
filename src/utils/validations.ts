export function emailValidation(value: string) {
  return value.includes("@");
}

/**
 * Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
 */
export function passwordValidation(val: string) {
  return (
    /[A-Z]/.test(val) &&
    /[a-z]/.test(val) &&
    /\d/.test(val) &&
    /[@$!%*?&]/.test(val)
  );
}
