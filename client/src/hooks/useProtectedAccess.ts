import { useState, useEffect, useCallback } from 'react';

interface UseProtectedAccessReturn {
  isLocked: boolean;
  isProtected: boolean;
  showPasswordModal: boolean;
  setShowPasswordModal: (show: boolean) => void;
  verifyPassword: (password: string) => Promise<boolean>;
  checkUnlocked: () => void;
  loading: boolean;
}

export function useProtectedAccess(area: string): UseProtectedAccessReturn {
  const [isLocked, setIsLocked] = useState(true);
  const [isProtected, setIsProtected] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProtection = async () => {
      try {
        const res = await fetch(`/api/settings/is-protected/${area}`);
        const data = await res.json();
        setIsProtected(data.isProtected);
        
        if (!data.isProtected) {
          setIsLocked(false);
        } else {
          const unlocked = sessionStorage.getItem(`unlocked_${area}`) === 'true';
          if (unlocked) {
            setIsLocked(false);
          }
        }
      } catch {
        setIsProtected(true);
      } finally {
        setLoading(false);
      }
    };

    checkProtection();
  }, [area]);

  const verifyPassword = useCallback(async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area, password })
      });
      
      if (res.ok) {
        setIsLocked(false);
        setShowPasswordModal(false);
        sessionStorage.setItem(`unlocked_${area}`, 'true');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [area]);

  const checkUnlocked = useCallback(() => {
    if (sessionStorage.getItem(`unlocked_${area}`) === 'true') {
      setIsLocked(false);
    }
  }, [area]);

  return {
    isLocked,
    isProtected,
    showPasswordModal,
    setShowPasswordModal,
    verifyPassword,
    checkUnlocked,
    loading
  };
}
