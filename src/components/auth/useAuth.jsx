import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [organisation, setOrganisation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (!authenticated) {
        setLoading(false);
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.org_id) {
        const orgs = await base44.entities.Organisation.filter({ id: currentUser.org_id });
        if (orgs.length > 0) {
          setOrganisation(orgs[0]);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const refreshOrg = useCallback(async () => {
    if (user?.org_id) {
      const orgs = await base44.entities.Organisation.filter({ id: user.org_id });
      if (orgs.length > 0) {
        setOrganisation(orgs[0]);
      }
    }
  }, [user?.org_id]);

  const canEdit = user?.org_role === 'admin' || user?.org_role === 'manager';
  const isAdmin = user?.org_role === 'admin';

  return {
    user,
    organisation,
    loading,
    isAuthenticated,
    canEdit,
    isAdmin,
    refreshOrg,
    refreshUser: loadUserData
  };
}