import React, { useState } from 'react';
import { Home, Calendar, BarChart3, FileText, Clock } from 'lucide-react';
import ExamTracker from './pages/ExamTracker';
import DailyPlan from './pages/DailyPlan';
import WeeklyPlan from './pages/WeeklyPlan';
import MonthlyPlan from './pages/MonthlyPlan';
import StudyTimer from './pages/StudyTimer';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useDarkMode } from './hooks/useDarkMode';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import ModernNavbar from './components/ModernNavbar';
import ModernLoadingSpinner from './components/ModernLoadingSpinner';
import { useToast } from './components/ModernToast';
import { FeatureCard } from './components/ModernCard';

export default function App() {
  const [activePage, setActivePage] = useLocalStorage('activePage', 'home');
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isLoading, setIsLoading] = useState(false);
  const { showToast, ToastContainer } = useToast();

  // Klavye kısayolları
  useKeyboardShortcuts({
    'ctrl+h': () => handlePageChange('home'),
    'ctrl+d': () => handlePageChange('daily'),
    'ctrl+w': () => handlePageChange('weekly'),
    'ctrl+m': () => handlePageChange('monthly'),
    'ctrl+e': () => handlePageChange('exam'),
    'ctrl+s': () => handlePageChange('timer'),
    'ctrl+t': () => {
      toggleDarkMode();
      showToast.success('Tema Değiştirildi', isDarkMode ? 'Açık tema aktif edildi' : 'Koyu tema aktif edildi');
    },
  });

  const handlePageChange = (page) => {
    if (page === activePage) return;
    
    setIsLoading(true);
    setActivePage(page);
    
    // Simüle edilmiş loading
    setTimeout(() => {
      setIsLoading(false);
      showToast.success('Sayfa Değiştirildi', `${getPageTitle(page)} sayfasına geçildi`);
    }, 500);
  };

  const getPageTitle = (page) => {
    const titles = {
      home: 'Ana Sayfa',
      daily: 'Günlük Plan',
      weekly: 'Haftalık Plan',
      monthly: 'Aylık Plan',
      exam: 'Deneme Takip',
      timer: 'Zamanlayıcı'
    };
    return titles[page] || 'Sayfa';
  };

  const renderHomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6 animate-float">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 animate-slide-up">
            Enesin YKS26 Ders Planı
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Çalışma planınızı organize edin ve hedeflerinize ulaşın
          </p>
        </div>

        {/* Ana Kategoriler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <FeatureCard
            icon={Calendar}
            title="Aylık Plan"
            description="Uzun vadeli hedeflerinizi belirleyin ve aylık çalışma stratejinizi oluşturun"
            onClick={() => handlePageChange('monthly')}
            color="blue"
            delay={0}
          />
          
          <FeatureCard
            icon={BarChart3}
            title="Haftalık Plan"
            description="Haftalık konularınızı organize edin ve düzenli çalışma rutini oluşturun"
            onClick={() => handlePageChange('weekly')}
            color="green"
            delay={0.1}
          />
          
          <FeatureCard
            icon={FileText}
            title="Günlük Plan"
            description="Günlük görevlerinizi sürükle-bırak ile kolayca organize edin"
            onClick={() => handlePageChange('daily')}
            color="purple"
            delay={0.2}
          />

          <FeatureCard
            icon={BarChart3}
            title="Deneme Takip"
            description="TYT/AYT deneme sonuçlarını kaydedin ve grafiklerle takip edin"
            onClick={() => handlePageChange('exam')}
            color="emerald"
            delay={0.3}
          />

          <FeatureCard
            icon={Clock}
            title="Zamanlayıcı"
            description="Kronometre ile çalışma süreni tut, günlük toplamları gör"
            onClick={() => handlePageChange('timer')}
            color="cyan"
            delay={0.4}
          />
        </div>

        {/* Alt Bilgi */}
        <div className="text-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="glass rounded-2xl p-6 max-w-2xl mx-auto">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Başlamak için yukarıdaki kategorilerden birini seçin
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p className="font-medium mb-2">Klavye Kısayolları:</p>
              <div className="flex flex-wrap justify-center gap-4">
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg">Ctrl+H (Ana Sayfa)</span>
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg">Ctrl+D (Günlük)</span>
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg">Ctrl+W (Haftalık)</span>
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg">Ctrl+M (Aylık)</span>
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg">Ctrl+E (Deneme)</span>
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg">Ctrl+S (Zamanlayıcı)</span>
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg">Ctrl+T (Tema)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPageWithNavigation = (pageComponent) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-inter flex">
      <ModernNavbar 
        activePage={activePage}
        onPageChange={handlePageChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => {
          toggleDarkMode();
          showToast.success('Tema Değiştirildi', isDarkMode ? 'Açık tema aktif edildi' : 'Koyu tema aktif edildi');
        }}
      />
      
      {/* Ana İçerik */}
      <main className="flex-1 lg:ml-0">
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <ModernLoadingSpinner size="lg" text="Sayfa yükleniyor..." />
          </div>
        ) : (
          pageComponent
        )}
      </main>
    </div>
  );

  const getPageComponent = () => {
    if (activePage === 'daily') return <DailyPlan />;
    if (activePage === 'weekly') return <WeeklyPlan />;
    if (activePage === 'monthly') return <MonthlyPlan />;
    if (activePage === 'exam') return <ExamTracker />;
    if (activePage === 'timer') return <StudyTimer />;
    return <div>404 Not Found</div>;
  };

  return (
    <>
      <ToastContainer />
      {activePage === 'home' ? (
        renderHomePage()
      ) : (
        renderPageWithNavigation(getPageComponent())
      )}
    </>
  );
}
