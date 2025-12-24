import { useEffect, useState } from 'react';
import apiService from '@/lib/apiService';

export function useApi() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return {
    apiService: isClient ? apiService : null,
    isClient,
  };
}
