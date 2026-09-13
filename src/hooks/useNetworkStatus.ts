import { useState, useEffect } from 'react';
import { NetworkService } from '../services/networkService';

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState<boolean>(NetworkService.isOffline);
  const [isSimulated, setIsSimulated] = useState<boolean>(NetworkService.isSimulated);
  const [isActuallyOffline, setIsActuallyOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleNetworkChange = (e: Event) => {
      // Custom event from NetworkService
      if (e.type === 'agro-network-change') {
        const detail = (e as CustomEvent).detail;
        setIsOffline(detail.isOffline);
        setIsSimulated(detail.isSimulated);
        setIsActuallyOffline(detail.isActuallyOffline);
      }
    };

    window.addEventListener('agro-network-change', handleNetworkChange);

    // Initial sync just in case
    setIsOffline(NetworkService.isOffline);
    setIsSimulated(NetworkService.isSimulated);
    setIsActuallyOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('agro-network-change', handleNetworkChange);
    };
  }, []);

  return {
    isOffline,
    isOnline: !isOffline,
    isSimulated,
    isActuallyOffline,
    setSimulatedOffline: (simulated: boolean) => NetworkService.setSimulatedOffline(simulated)
  };
}
