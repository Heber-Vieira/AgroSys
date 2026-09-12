/**
 * AgroSys - Resilient IndexedDB Storage Engine
 * Provides durable, transactional client-side database persistence that survives
 * browser cache clears ("Clear Browsing Data"), offline states, and network failures.
 */

const DB_NAME = 'AgroSysPersistentDB';
const DB_VERSION = 1;

export const STORES = {
  SETTINGS: 'settings',
  BRANDINGS: 'brandings',
  COMPANIES: 'companies',
  ALARMS: 'alarms',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initializes or returns the open IndexedDB database instance.
 */
export function getIDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não é suportado neste navegador.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.BRANDINGS)) {
        db.createObjectStore(STORES.BRANDINGS, { keyPath: 'tenantId' });
      }
      if (!db.objectStoreNames.contains(STORES.COMPANIES)) {
        db.createObjectStore(STORES.COMPANIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.ALARMS)) {
        db.createObjectStore(STORES.ALARMS, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Request browser persistent storage privilege so cache cleaning won't evict DB
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().catch(() => {});
      }

      resolve(db);
    };

    request.onerror = (event) => {
      console.warn('Falha ao abrir IndexedDB:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

/**
 * Save an item into an IndexedDB store.
 */
export async function setIDBItem(storeName: string, item: any): Promise<boolean> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);

      req.onsuccess = () => resolve(true);
      req.onerror = (e) => {
        console.warn(`Erro ao gravar no IndexedDB [${storeName}]:`, (e.target as IDBRequest).error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn(`Exceção ao gravar no IndexedDB [${storeName}]:`, err);
    return false;
  }
}

/**
 * Retrieve an item by key from an IndexedDB store.
 */
export async function getIDBItem<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result ? (req.result as T) : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

/**
 * Retrieve all items from an IndexedDB store.
 */
export async function getAllIDBItems<T>(storeName: string): Promise<T[]> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => {
        resolve(req.result ? (req.result as T[]) : []);
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

/**
 * Delete an item from an IndexedDB store.
 */
export async function deleteIDBItem(storeName: string, key: string): Promise<boolean> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}

/**
 * Saves a key-value setting to both localStorage and persistent IndexedDB.
 */
export async function saveToDurableStorage(key: string, value: any, storeName: string = STORES.SETTINGS): Promise<void> {
  try {
    const stringVal = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringVal);

    if (storeName === STORES.SETTINGS) {
      await setIDBItem(STORES.SETTINGS, { key, value: stringVal, updatedAt: new Date().toISOString() });
    } else {
      await setIDBItem(storeName, value);
    }
  } catch (err) {
    console.warn(`Erro ao salvar no armazenamento durável (${key}):`, err);
  }
}

/**
 * Retrieves a durable setting, falling back to IndexedDB if missing in localStorage.
 */
export async function getDurableSetting<T>(key: string, storeName: string = STORES.SETTINGS): Promise<T | null> {
  try {
    const localVal = localStorage.getItem(key);
    if (localVal !== null) {
      try {
        return JSON.parse(localVal) as T;
      } catch (e) {
        return localVal as unknown as T;
      }
    }

    // Check IndexedDB
    const record = await getIDBItem<{ key: string; value: any }>(storeName, key);
    if (record) {
      const raw = record.value;
      if (raw !== undefined && raw !== null) {
        const stringified = typeof raw === 'string' ? raw : JSON.stringify(raw);
        localStorage.setItem(key, stringified);
        try {
          return JSON.parse(stringified) as T;
        } catch (e) {
          return stringified as unknown as T;
        }
      }
    }
  } catch (err) {
    console.warn(`Erro ao carregar parâmetro durável (${key}):`, err);
  }
  return null;
}

/**
 * Self-healing routine: Reads all items stored in IndexedDB and repopulates localStorage
 * if localStorage was cleared by the user ("Clear Browsing Data").
 */
export async function restoreDurableStorageToLocalStorage(): Promise<number> {
  let restoredCount = 0;
  try {
    // 1. Restore key-value items in STORES.SETTINGS
    const settings = await getAllIDBItems<{ key: string; value: any }>(STORES.SETTINGS);
    settings.forEach(item => {
      if (item && item.key) {
        const valStr = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
        if (!localStorage.getItem(item.key) && valStr) {
          localStorage.setItem(item.key, valStr);
          restoredCount++;
        }
      }
    });

    // 2. Restore Brandings in STORES.BRANDINGS
    const brandings = await getAllIDBItems<any>(STORES.BRANDINGS);
    brandings.forEach(b => {
      if (b && b.tenantId) {
        if (b.logoUrl) {
          const k = `agrosys_company_logo_url_${b.tenantId}`;
          if (!localStorage.getItem(k)) { localStorage.setItem(k, b.logoUrl); restoredCount++; }
        }
        if (b.logoDarkUrl) {
          const k = `agrosys_company_logo_dark_url_${b.tenantId}`;
          if (!localStorage.getItem(k)) { localStorage.setItem(k, b.logoDarkUrl); restoredCount++; }
        }
        if (b.logoAdaptiveMode) {
          const k = `agrosys_company_logo_adaptive_mode_${b.tenantId}`;
          if (!localStorage.getItem(k)) { localStorage.setItem(k, b.logoAdaptiveMode); restoredCount++; }
        }
        if (b.logoIconId) {
          const k = `agrosys_company_logo_icon_${b.tenantId}`;
          if (!localStorage.getItem(k)) { localStorage.setItem(k, b.logoIconId); restoredCount++; }
        }
      }
    });

    // 3. Restore Alarms in STORES.ALARMS
    const alarms = await getAllIDBItems<{ key: string; value: any }>(STORES.ALARMS);
    alarms.forEach(a => {
      if (a && a.key && a.value) {
        const valStr = typeof a.value === 'string' ? a.value : JSON.stringify(a.value);
        if (!localStorage.getItem(a.key)) {
          localStorage.setItem(a.key, valStr);
          restoredCount++;
        }
      }
    });
  } catch (err) {
    console.warn('Erro ao restaurar cache do IndexedDB para o LocalStorage:', err);
  }
  return restoredCount;
}

