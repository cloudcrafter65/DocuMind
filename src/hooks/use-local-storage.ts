
"use client"

import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value.
  // Initialize with initialValue to ensure server and client initial renders match.
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isMounted, setIsMounted] = useState(false);

  // Effect to load from localStorage on client mount
  useEffect(() => {
    setIsMounted(true);
    // This effect runs only on the client, after initial hydration
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        // If no item in localStorage, ensure we're using initialValue (already set by useState)
        // or explicitly set it if needed (though useState already handles it)
        setStoredValue(initialValue); 
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValue); // Fallback to initial value on error
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // initialValue is not needed here as we only want to load from storage once based on key

  // Effect to save to localStorage when storedValue changes (and component is mounted)
  useEffect(() => {
    if (isMounted) {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue, isMounted]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    // Allow value to be a function so we have same API as useState
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
  }, [storedValue]);

  // On the server or before isMounted is true on client, return initialValue.
  // After mounting and loading from localStorage, return the actual storedValue.
  return [isMounted ? storedValue : initialValue, setValue];
}

export default useLocalStorage;

