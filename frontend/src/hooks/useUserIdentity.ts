import { useState, useCallback } from 'react';

const USER_KEY = 'bhumix_user_id';
const ROLE_KEY = 'bhumix_user_role';

export type UserRole = 'field_officer' | 'tehsildar' | 'super_admin';

export const ROLE_DISPLAY: Record<UserRole, string> = {
  field_officer: 'Field Officer',
  tehsildar: 'Tehsildar',
  super_admin: 'Super Admin',
};

/**
 * Manages user identity + role stored in localStorage.
 * One-tap login — role selection is the only input, user_id is auto-set.
 */
export function useUserIdentity() {
  const [userId, setUserIdState] = useState<string | null>(() => {
    return localStorage.getItem(USER_KEY);
  });

  const [role, setRoleState] = useState<UserRole | null>(() => {
    return localStorage.getItem(ROLE_KEY) as UserRole | null;
  });

  const login = useCallback((userRole: UserRole) => {
    // Auto-generate a user_id from the role (no name input needed)
    const id = userRole;
    localStorage.setItem(USER_KEY, id);
    localStorage.setItem(ROLE_KEY, userRole);
    setUserIdState(id);
    setRoleState(userRole);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
    setUserIdState(null);
    setRoleState(null);
  }, []);

  return { userId, role, login, logout, isIdentified: !!userId && !!role };
}
