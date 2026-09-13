/**
 * AgroSys - Global Network State Service
 * 
 * Provides synchronous access to the real network status for non-React files
 * (API callers, background syncs, db storage) and manages the simulation mode.
 */

class NetworkServiceClass {
  private _isSimulatedOffline: boolean = false;
  private _isActuallyOffline: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this._isActuallyOffline = !navigator.onLine;

      window.addEventListener('online', this.handleNetworkChange);
      window.addEventListener('offline', this.handleNetworkChange);
    }
  }

  private handleNetworkChange = () => {
    this._isActuallyOffline = !navigator.onLine;
    this.dispatchEvent();
  };

  private dispatchEvent() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('agro-network-change', { 
        detail: { 
          isOffline: this.isOffline,
          isSimulated: this._isSimulatedOffline,
          isActuallyOffline: this._isActuallyOffline
        } 
      }));
    }
  }

  /**
   * Returns true if the app is truly offline (no internet) OR manually simulated as offline.
   */
  public get isOffline(): boolean {
    return this._isActuallyOffline || this._isSimulatedOffline;
  }

  /**
   * Returns true only if the app has a real internet connection AND is not simulated offline.
   */
  public get isOnline(): boolean {
    return !this.isOffline;
  }

  /**
   * Exposes whether the offline state is real or simulated
   */
  public get isSimulated(): boolean {
    return this._isSimulatedOffline;
  }

  /**
   * Manually toggle simulated offline mode for testing the resilient systems
   */
  public setSimulatedOffline(simulated: boolean) {
    if (this._isSimulatedOffline !== simulated) {
      this._isSimulatedOffline = simulated;
      this.dispatchEvent();
    }
  }
}

export const NetworkService = new NetworkServiceClass();
