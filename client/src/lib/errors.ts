export class UserFriendlyError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'UserFriendlyError';
  }
}

export function toUserFriendlyError(error: any): UserFriendlyError {
  if (error instanceof UserFriendlyError) {
    return error;
  }

  // Handle known API error formats
  if (error?.code === 'PGRST116') {
    return new UserFriendlyError('The requested resource was not found.', error);
  }
  if (error?.code === '23505') { // Unique violation
    return new UserFriendlyError('This record already exists.', error);
  }

  // Network errors
  if (error?.message === 'Failed to fetch') {
    return new UserFriendlyError('Network error. Please check your connection.', error);
  }

  // Default fallback
  return new UserFriendlyError('An unexpected error occurred. Please try again.', error);
}
