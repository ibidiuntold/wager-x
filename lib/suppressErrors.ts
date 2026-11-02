export const suppressChromeErrors = () => {
  if (typeof window !== 'undefined') {
    const originalOnError = window.onerror;
    const originalConsoleWarn = console.warn;

    // Suppress specific console warnings
    console.warn = (...args) => {
      if (
        typeof args[0] === 'string' && 
        (args[0].includes('persistence') || 
         args[0].includes('@firebase/firestore'))
      ) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    // Suppress Chrome extension errors
    window.onerror = (message, source, lineno, colno, error) => {
      if (
        message.toString().includes('message port') || 
        message.toString().includes('lastError')
      ) {
        return true;
      }
      return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
    };
  }
};