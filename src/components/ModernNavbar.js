import React, { useState } from 'react';
import { Home, Calendar, BarChart3, FileText, Moon, Sun, Menu, X, Settings, Clock } from 'lucide-react';

const ModernNavbar = ({ activePage, onPageChange, isDarkMode, onToggleDarkMode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'home', label: 'Ana Sayfa', icon: Home, shortcut: 'Ctrl+H', color: 'blue' },
    { id: 'monthly', label: 'Aylık Plan', icon: Calendar, shortcut: 'Ctrl+M', color: 'blue' },
    { id: 'weekly', label: 'Haftalık Plan', icon: BarChart3, shortcut: 'Ctrl+W', color: 'green' },
    { id: 'daily', label: 'Günlük Plan', icon: FileText, shortcut: 'Ctrl+D', color: 'purple' },
    { id: 'exam', label: 'Deneme Takip', icon: BarChart3, shortcut: 'Ctrl+E', color: 'green' },
    { id: 'timer', label: 'Zamanlayıcı', icon: Clock, shortcut: 'Ctrl+S', color: 'blue' },
    // Theme toggle moved into main list
    { id: 'theme', label: isDarkMode ? 'Açık Tema' : 'Koyu Tema', icon: isDarkMode ? Sun : Moon, shortcut: 'Ctrl+T', color: 'gray' },
  ];

  const handleNavClick = (pageId) => {
    if (pageId === 'theme') {
      onToggleDarkMode();
      setIsMobileMenuOpen(false);
      return;
    }
    onPageChange(pageId);
    setIsMobileMenuOpen(false);
  };

  const getNavItemClasses = (item) => {
    const baseClasses = "group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 focus-ring";
    const isActive = activePage === item.id;
    
    if (isActive) {
      return `${baseClasses} bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 text-white shadow-lg`;
    }
    
    return `${baseClasses} text-gray-700 dark:text-gray-300 hover:bg-${item.color}-50 dark:hover:bg-${item.color}-900/20 hover:text-${item.color}-600 dark:hover:text-${item.color}-400`;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-col shadow-lg">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ders Planı</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Çalışma Organizatörü</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={getNavItemClasses(item)}
                title={`${item.label} (${item.shortcut})`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {activePage === item.id && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse-soft" />
                )}
                
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.shortcut}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Actions removed per request */}
      </nav>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Ders Planı</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-ring"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-ring"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menü</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={getNavItemClasses(item)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {activePage === item.id && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse-soft" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModernNavbar;
