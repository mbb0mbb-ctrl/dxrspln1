import React, { forwardRef } from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Kart varyantları için sabitler
 */
export const CARD_VARIANTS = {
  DEFAULT: 'default',
  GRADIENT: 'gradient',
  GLASS: 'glass',
  ELEVATED: 'elevated'
};

/**
 * Renk temaları için sabitler
 */
export const COLOR_THEMES = {
  BLUE: 'blue',
  GREEN: 'green',
  PURPLE: 'purple',
  RED: 'red',
  YELLOW: 'yellow',
  GRAY: 'gray'
};

/**
 * Renk sınıfları konfigürasyonu
 */
const COLOR_CONFIGS = {
  [COLOR_THEMES.BLUE]: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    hover: 'group-hover:bg-blue-200 dark:group-hover:bg-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'group-hover:border-blue-300 dark:group-hover:border-blue-500',
    gradient: 'from-blue-500 to-blue-600',
    button: 'bg-blue-500 hover:bg-blue-600'
  },
  [COLOR_THEMES.GREEN]: {
    bg: 'bg-green-100 dark:bg-green-900',
    hover: 'group-hover:bg-green-200 dark:group-hover:bg-green-800',
    icon: 'text-green-600 dark:text-green-400',
    border: 'group-hover:border-green-300 dark:group-hover:border-green-500',
    gradient: 'from-green-500 to-green-600',
    button: 'bg-green-500 hover:bg-green-600'
  },
  [COLOR_THEMES.PURPLE]: {
    bg: 'bg-purple-100 dark:bg-purple-900',
    hover: 'group-hover:bg-purple-200 dark:group-hover:bg-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
    border: 'group-hover:border-purple-300 dark:group-hover:border-purple-500',
    gradient: 'from-purple-500 to-purple-600',
    button: 'bg-purple-500 hover:bg-purple-600'
  },
  [COLOR_THEMES.RED]: {
    bg: 'bg-red-100 dark:bg-red-900',
    hover: 'group-hover:bg-red-200 dark:group-hover:bg-red-800',
    icon: 'text-red-600 dark:text-red-400',
    border: 'group-hover:border-red-300 dark:group-hover:border-red-500',
    gradient: 'from-red-500 to-red-600',
    button: 'bg-red-500 hover:bg-red-600'
  }
};

/**
 * Temel Modern Kart bileşeni
 */
const ModernCard = forwardRef(({ 
  children, 
  className = '', 
  variant = CARD_VARIANTS.DEFAULT,
  hover = true, 
  clickable = false, 
  onClick,
  disabled = false,
  ...props 
}, ref) => {
  // Temel stil sınıfları
  const baseClasses = "bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300";
  
  // Varyant bazlı sınıflar
  const variantClasses = {
    [CARD_VARIANTS.DEFAULT]: "",
    [CARD_VARIANTS.GRADIENT]: "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
    [CARD_VARIANTS.GLASS]: "glass backdrop-blur-lg bg-white/80 dark:bg-gray-800/80",
    [CARD_VARIANTS.ELEVATED]: "shadow-2xl"
  };
  
  // Durum bazlı sınıflar
  const hoverClasses = hover && !disabled ? "hover:shadow-xl hover:-translate-y-1" : "";
  const clickableClasses = clickable && !disabled ? "cursor-pointer hover:scale-105 active:scale-95" : "";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <div
      ref={ref}
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${hoverClasses} 
        ${clickableClasses} 
        ${disabledClasses} 
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable && !disabled ? 0 : undefined}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  );
});

ModernCard.displayName = 'ModernCard';

/**
 * Özellik kartı bileşeni
 */
export const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  color = COLOR_THEMES.BLUE,
  delay = 0,
  disabled = false,
  className = '',
  showHoverIndicator = true
}) => {
  if (!Icon || !title) {
    console.warn('FeatureCard: icon ve title gerekli props');
    return null;
  }

  const colors = COLOR_CONFIGS[color] || COLOR_CONFIGS[COLOR_THEMES.BLUE];

  return (
    <ModernCard 
      clickable 
      onClick={onClick}
      disabled={disabled}
      className={`group p-8 animate-slide-up ${className}`}
      style={{ animationDelay: `${delay}s` }}
      role="button"
      aria-label={`${title} - ${description}`}
    >
      <div className="text-center">
        <div className={`
          w-16 h-16 ${colors.bg} ${colors.hover} 
          rounded-full flex items-center justify-center mx-auto mb-4 
          transition-colors duration-200
        `}>
          <Icon className={`w-8 h-8 ${colors.icon}`} aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {description}
          </p>
        )}
        
        {/* Hover göstergesi */}
        {showHoverIndicator && (
          <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ChevronRight className="w-5 h-5 text-gray-400 mx-auto" aria-hidden="true" />
          </div>
        )}
      </div>
    </ModernCard>
  );
};

/**
 * İstatistik kartı bileşeni
 */
export const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'positive', 
  icon: Icon,
  className = '',
  loading = false
}) => {
  if (!title || value === undefined) {
    console.warn('StatsCard: title ve value gerekli props');
    return null;
  }

  const changeColor = changeType === 'positive' 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400';
  
  return (
    <ModernCard className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          {loading ? (
            <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
          )}
          {change && !loading && (
            <p className={`text-sm ${changeColor} mt-1 flex items-center`}>
              <span className="mr-1">
                {changeType === 'positive' ? '↗' : '↘'}
              </span>
              {changeType === 'positive' ? '+' : ''}{change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          </div>
        )}
      </div>
    </ModernCard>
  );
};

/**
 * İlerleme kartı bileşeni
 */
export const ProgressCard = ({ 
  title, 
  progress, 
  total, 
  description,
  color = COLOR_THEMES.BLUE,
  className = '',
  showPercentage = true,
  animated = true
}) => {
  if (!title || typeof progress !== 'number' || typeof total !== 'number') {
    console.warn('ProgressCard: title, progress ve total gerekli props');
    return null;
  }

  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
  const colors = COLOR_CONFIGS[color] || COLOR_CONFIGS[COLOR_THEMES.BLUE];

  return (
    <ModernCard className={`p-6 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {progress}/{total}
          </span>
        </div>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            İlerleme
          </span>
          {showPercentage && (
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {percentage}%
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className={`
              bg-gradient-to-r ${colors.gradient} h-2 rounded-full
              ${animated ? 'transition-all duration-500 ease-out' : ''}
            `}
            style={{ width: `${Math.min(percentage, 100)}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${title} ilerleme: ${percentage}%`}
          />
        </div>
      </div>
    </ModernCard>
  );
};

/**
 * Aksiyon kartı bileşeni
 */
export const ActionCard = ({ 
  title, 
  description, 
  action, 
  actionText = 'Başla',
  icon: Icon,
  color = COLOR_THEMES.BLUE,
  className = '',
  disabled = false,
  loading = false
}) => {
  if (!title || !action) {
    console.warn('ActionCard: title ve action gerekli props');
    return null;
  }

  const colors = COLOR_CONFIGS[color] || COLOR_CONFIGS[COLOR_THEMES.BLUE];

  const handleAction = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    action(e);
  };

  return (
    <ModernCard className={`p-6 ${className}`} hover>
      <div className="flex items-start space-x-4">
        {Icon && (
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              {description}
            </p>
          )}
          <button 
            onClick={handleAction}
            disabled={disabled || loading}
            className={`
              ${colors.button} text-white px-4 py-2 rounded-lg text-sm font-medium 
              transition-all duration-200 hover:shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center space-x-2
            `}
            aria-label={`${title} - ${actionText}`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{loading ? 'Yükleniyor...' : actionText}</span>
          </button>
        </div>
      </div>
    </ModernCard>
  );
};

export default ModernCard;
