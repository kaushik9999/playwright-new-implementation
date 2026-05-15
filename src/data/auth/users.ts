// SauceDemo provides several preconfigured users that exercise different behaviors. Tests reference these by name rather than hardcoding strings throughout the suite.
export const PASSWORD = 'secret_sauce';

export const Users = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
  problem: 'problem_user',
  performanceGlitch: 'performance_glitch_user',
  error: 'error_user',
  visual: 'visual_user',
} as const;

export type UserName = (typeof Users)[keyof typeof Users];

export const lockedOutErrorText =
  'Epic sadface: Sorry, this user has been locked out.';
export const missingUsernameErrorText = 'Epic sadface: Username is required';
export const missingPasswordErrorText = 'Epic sadface: Password is required';
export const invalidCredentialsErrorText =
  'Epic sadface: Username and password do not match any user in this service';
