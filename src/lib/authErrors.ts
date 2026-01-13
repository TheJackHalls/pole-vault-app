import { FirebaseError } from 'firebase/app';

export const getAuthErrorMessage = (error: unknown) => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/missing-password':
        return 'Please enter your password.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Incorrect email or password.';
      case 'auth/email-already-in-use':
        return 'That email is already registered. Try logging in instead.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};
