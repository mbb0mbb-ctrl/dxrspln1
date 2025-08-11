/**
 * Utility function to clear all stored data from localStorage
 * This will reset the application to a completely clean state
 */
export const clearAllStoredData = () => {
  const keysToRemove = [
    'monthlyPlans',
    'weeklyPlans', 
    'dailyPlans',
    'activePage',
    'darkMode'
  ];

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`Cleared localStorage key: ${key}`);
    } catch (error) {
      console.error(`Error clearing localStorage key ${key}:`, error);
    }
  });

  console.log('All stored data has been cleared from localStorage');
  
  // Optionally reload the page to ensure clean state
  if (window.confirm('Tüm veriler temizlendi. Sayfayı yeniden yüklemek ister misiniz?')) {
    window.location.reload();
  }
};

/**
 * Clear only plan-related data (keep UI preferences)
 */
export const clearPlanData = () => {
  const planKeys = [
    'monthlyPlans',
    'weeklyPlans', 
    'dailyPlans'
  ];

  planKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`Cleared plan data: ${key}`);
    } catch (error) {
      console.error(`Error clearing plan data ${key}:`, error);
    }
  });

  console.log('All plan data has been cleared from localStorage');
};

// For development/debugging - log all current localStorage data
export const logAllStoredData = () => {
  console.log('Current localStorage data:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`${key}:`, JSON.parse(value || 'null'));
  }
};
