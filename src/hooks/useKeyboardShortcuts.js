import { useEffect } from 'react';

export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + Key kombinasyonları
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      
      for (const [key, callback] of Object.entries(shortcuts)) {
        const [modifier, targetKey] = key.split('+');
        
        if (modifier === 'ctrl' && isCtrlOrCmd && event.key.toLowerCase() === targetKey) {
          event.preventDefault();
          callback();
        } else if (modifier === 'key' && event.key.toLowerCase() === targetKey) {
          event.preventDefault();
          callback();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
