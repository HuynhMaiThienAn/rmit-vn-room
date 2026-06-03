'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuthGate() {
  const router = useRouter();
  const [isValidated, setIsValidated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const expectedKey = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY?.trim();
    const incomingKey = new URL(window.location.href).searchParams.get('key')?.trim();
    const storedKey = sessionStorage.getItem('admin_passcode')?.trim();

    if (
      expectedKey &&
      ((storedKey && storedKey === expectedKey) || (incomingKey && incomingKey === expectedKey))
    ) {
      if (incomingKey && incomingKey === expectedKey) {
        sessionStorage.setItem('admin_passcode', incomingKey);
      }
      setIsValidated(true);
      setIsChecking(false);

      if (incomingKey) {
        const url = new URL(window.location.href);
        url.searchParams.delete('key');
        window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
      }
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  return { isValidated, isChecking };
}
