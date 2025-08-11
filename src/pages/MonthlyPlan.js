import React, { useState, useMemo } from 'react';
import { 
  Plus, X, CheckCircle, Circle, Calendar, Target, TrendingUp, 
  FileText, Search, BookOpen, Clock, Award, BarChart3, Edit3, Trash2, Save, RotateCcw
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { comprehensiveData } from '../data/comprehensiveData';
 
import ModernCard, { StatsCard, ProgressCard } from '../components/ModernCard';
import ModernLoadingSpinner from '../components/ModernLoadingSpinner';
import { useToast } from '../components/ModernToast';

export default function MonthlyPlan() {
  const [monthlyPlans, setMonthlyPlans] = useLocalStorage('monthlyPlans', comprehensiveData.months);
  const [selectedMonth, setSelectedMonth] = useState('august-2025');
  const [newGoal, setNewGoal] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editGoalText, setEditGoalText] = useState('');
  
  // Ders ve konu yönetimi state'leri
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [selectedSubjectForTopic, setSelectedSubjectForTopic] = useState('');
  
  // Onay dialog state'leri
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  const { showToast, ToastContainer } = useToast();

  // Mevcut ay verisi
  const selectedMonthData = useMemo(() => 
    monthlyPlans.find(month => month.id === selectedMonth),
    [monthlyPlans, selectedMonth]
  );

  // İstatistikler
  const stats = useMemo(() => {
    if (!selectedMonthData) return { totalTopics: 0, completedGoals: 0, totalGoals: 0, progress: 0 };
    
    const totalTopics = Object.values(selectedMonthData.subjects || {})
      .reduce((sum, topics) => sum + (Array.isArray(topics) ? topics.length : 0), 0);
    
    const completedGoals = (selectedMonthData.goals || []).filter(g => g.completed).length;
    const totalGoals = (selectedMonthData.goals || []).length;
    const progress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    
    return { totalTopics, completedGoals, totalGoals, progress };
  }, [selectedMonthData]);

  // LocalStorage'ı sıfırla ve tüm ayları yeniden yükle
  const resetToDefaultData = () => {
    setIsLoading(true);
    setTimeout(() => {
      localStorage.removeItem('monthlyPlans');
      setMonthlyPlans(comprehensiveData.months);
      setIsLoading(false);
      showToast.success('Başarılı', 'Veriler başarıyla sıfırlandı!');
    }, 1000);
  };

  // Yeni ders ekleme
  const addNewSubject = () => {
    if (!newSubjectName.trim()) {
      showToast.warning('Uyarı', 'Lütfen ders adı girin!');
      return;
    }

    if (!selectedMonthData) return;

    // Aynı isimde ders var mı kontrol et
    if (selectedMonthData.subjects && selectedMonthData.subjects[newSubjectName.trim()]) {
      showToast.warning('Uyarı', 'Bu ders zaten mevcut!');
      return;
    }

    const updatedPlans = monthlyPlans.map(month => {
      if (month.id === selectedMonthData.id) {
        return {
          ...month,
          subjects: {
            ...month.subjects,
            [newSubjectName.trim()]: []
          }
        };
      }
      return month;
    });

    setMonthlyPlans(updatedPlans);
    setNewSubjectName('');
    setShowAddSubjectModal(false);
    showToast.success('Başarılı', `"${newSubjectName.trim()}" dersi eklendi!`);
  };

  // Ders silme
  const deleteSubject = (subjectName) => {
    if (!selectedMonthData) return;

    // Temel derslerin silinmesini engelle
    const coreSubjects = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe'];
    if (coreSubjects.includes(subjectName)) {
      showToast.warning('Uyarı', 'Bu ders temel derslerden biridir ve silinemez!');
      return;
    }

    const updatedPlans = monthlyPlans.map(month => {
      if (month.id === selectedMonthData.id) {
        const newSubjects = { ...month.subjects };
        delete newSubjects[subjectName];
        return {
          ...month,
          subjects: newSubjects
        };
      }
      return month;
    });

    setMonthlyPlans(updatedPlans);
    showToast.info('Bilgi', `"${subjectName}" dersi silindi!`);
  };

  // Yeni konu ekleme
  const addNewTopic = () => {
    if (!newTopicName.trim()) {
      showToast.warning('Uyarı', 'Lütfen konu adı girin!');
      return;
    }

    if (!selectedSubjectForTopic || !selectedMonthData) return;

    const updatedPlans = monthlyPlans.map(month => {
      if (month.id === selectedMonthData.id) {
        const currentTopics = month.subjects?.[selectedSubjectForTopic] || [];
        return {
          ...month,
          subjects: {
            ...month.subjects,
            [selectedSubjectForTopic]: [...currentTopics, newTopicName.trim()]
          }
        };
      }
      return month;
    });

    setMonthlyPlans(updatedPlans);
    setNewTopicName('');
    setSelectedSubjectForTopic('');
    setShowAddTopicModal(false);
    showToast.success('Başarılı', `"${newTopicName.trim()}" konusu eklendi!`);
  };

  // Konu silme
  const deleteTopic = (subjectName, topicName) => {
    if (!selectedMonthData) return;

    const updatedPlans = monthlyPlans.map(month => {
      if (month.id === selectedMonthData.id) {
        const currentTopics = month.subjects?.[subjectName] || [];
        const filteredTopics = currentTopics.filter(topic => topic !== topicName);
        return {
          ...month,
          subjects: {
            ...month.subjects,
            [subjectName]: filteredTopics
          }
        };
      }
      return month;
    });

    setMonthlyPlans(updatedPlans);
    showToast.info('Bilgi', `"${topicName}" konusu silindi!`);
  };



  // Hedef ekleme
  const addGoal = (monthId) => {
    if (!newGoal.trim()) {
      showToast.warning('Uyarı', 'Lütfen bir hedef girin!');
      return;
    }

    const updatedPlans = monthlyPlans.map(month => {
      if (month.id === monthId) {
        const newGoalObj = {
          id: Date.now().toString(),
          text: newGoal.trim(),
          completed: false,
          createdAt: new Date().toISOString()
        };
        return {
          ...month,
          goals: [...(month.goals || []), newGoalObj]
        };
      }
      return month;
    });

    setMonthlyPlans(updatedPlans);
    setNewGoal('');
    showToast.success('Başarılı', 'Hedef başarıyla eklendi!');
  };

  // Hedef silme
  const removeGoal = (goalId) => {
    const updatedPlans = monthlyPlans.map(month => ({
      ...month,
      goals: (month.goals || []).filter(goal => goal.id !== goalId)
    }));

    setMonthlyPlans(updatedPlans);
    showToast.info('Bilgi', 'Hedef silindi!');
  };

  // Hedef tamamlama durumunu değiştirme
  const toggleGoal = (goalId) => {
    const updatedPlans = monthlyPlans.map(month => ({
      ...month,
      goals: (month.goals || []).map(goal =>
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      )
    }));

    setMonthlyPlans(updatedPlans);
    const goal = monthlyPlans.flatMap(m => m.goals || []).find(g => g.id === goalId);
    if (goal) {
      if (goal.completed) {
        showToast.info('Bilgi', 'Hedef tamamlanmadı olarak işaretlendi!');
      } else {
        showToast.success('Tebrikler', 'Hedef tamamlandı! 🎉');
      }
    }
  };

  // Hedef düzenleme başlatma
  const startEditGoal = (goal) => {
    setEditingGoal(goal.id);
    setEditGoalText(goal.text);
  };

  // Hedef düzenleme kaydetme
  const saveEditGoal = () => {
    if (!editGoalText.trim()) {
      showToast.warning('Uyarı', 'Hedef metni boş olamaz!');
      return;
    }

    const updatedPlans = monthlyPlans.map(month => ({
      ...month,
      goals: (month.goals || []).map(goal =>
        goal.id === editingGoal ? { ...goal, text: editGoalText.trim() } : goal
      )
    }));

    setMonthlyPlans(updatedPlans);
    setEditingGoal(null);
    setEditGoalText('');
    showToast.success('Başarılı', 'Hedef güncellendi!');
  };

  // Hedef düzenleme iptal etme
  const cancelEditGoal = () => {
    setEditingGoal(null);
    setEditGoalText('');
  };

  // HTML5 Drag & Drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);

  // HTML5 Drag handlers
  const handleDragStart = (e, topic, monthId, subject, index) => {
    console.log('Drag started:', topic);
    setDraggedItem({ topic, monthId, subject, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    console.log('Drag ended');
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, monthId, subject) => {
    e.preventDefault();
    setDragOverTarget(`${monthId}-${subject}`);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverTarget(null);
  };

  const handleDrop = (e, targetMonthId, targetSubject) => {
    e.preventDefault();
    console.log('Drop event:', { draggedItem, targetMonthId, targetSubject });
    
    if (!draggedItem) return;

    const { topic, monthId: sourceMonthId, subject: sourceSubject, index: sourceIndex } = draggedItem;

    // Aynı yere bırakılmışsa hiçbir şey yapma
    if (sourceMonthId === targetMonthId && sourceSubject === targetSubject) {
      setDraggedItem(null);
      setDragOverTarget(null);
      return;
    }

    const updatedPlans = monthlyPlans.map(month => {
      const newMonth = { ...month };

      // Kaynak aydan konuyu kaldır
      if (month.id === sourceMonthId) {
        const sourceTopics = [...(month.subjects?.[sourceSubject] || [])];
        sourceTopics.splice(sourceIndex, 1);
        newMonth.subjects = {
          ...month.subjects,
          [sourceSubject]: sourceTopics
        };
      }

      // Hedef aya konuyu ekle
      if (month.id === targetMonthId) {
        const targetTopics = [...(month.subjects?.[targetSubject] || [])];
        targetTopics.push(topic);
        newMonth.subjects = {
          ...month.subjects,
          [targetSubject]: targetTopics
        };
      }

      return newMonth;
    });

    setMonthlyPlans(updatedPlans);
    
    if (sourceMonthId !== targetMonthId) {
      showToast.info('Bilgi', `Konu "${topic}" başka aya taşındı!`);
    } else {
      showToast.info('Bilgi', `Konu "${topic}" başka derse taşındı!`);
    }

    setDraggedItem(null);
    setDragOverTarget(null);
  };

  

  // Filtrelenmiş konular
  const filteredTopics = useMemo(() => {
    if (!selectedMonthData?.subjects) return {};

    const filtered = {};
    Object.entries(selectedMonthData.subjects).forEach(([subject, topics]) => {
      if (selectedSubject === 'all' || selectedSubject === subject) {
        const filteredTopicList = Array.isArray(topics) 
          ? topics.filter(topic => 
              topic.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : [];
        
        if (filteredTopicList.length > 0) {
          filtered[subject] = filteredTopicList;
        }
      }
    });

    return filtered;
  }, [selectedMonthData, selectedSubject, searchTerm]);

  // Genel ilerleme hesaplama
  const getOverallProgressForMonth = (month) => {
    if (!month.goals || month.goals.length === 0) return 0;
    const completed = month.goals.filter(g => g.completed).length;
    return Math.round((completed / month.goals.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ModernLoadingSpinner type="dots" size="lg" />
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      

      {/* Yeni Ders Ekleme Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Yeni Ders Ekle
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ders Adı
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Örn: Tarih, Coğrafya, Felsefe..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addNewSubject()}
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAddSubjectModal(false);
                    setNewSubjectName('');
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={addNewSubject}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Konu Ekleme Modal */}
      {showAddTopicModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Yeni Konu Ekle
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ders Seçin
                </label>
                <select
                  value={selectedSubjectForTopic}
                  onChange={(e) => setSelectedSubjectForTopic(e.target.value)}
                  className="w-full px-3 py-2 mb-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Ders seçin...</option>
                  {selectedMonthData?.subjects && Object.keys(selectedMonthData.subjects).map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Konu Adı
                </label>
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Örn: Limit, Türev, İntegral..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addNewTopic()}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAddTopicModal(false);
                    setNewTopicName('');
                    setSelectedSubjectForTopic('');
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={addNewTopic}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Başlık ve Araçlar */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Aylık Plan
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Aylık hedeflerinizi yönetin ve konularınızı organize edin
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowAddSubjectModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Ders Ekle
              </button>
              <button
                onClick={() => setShowAddTopicModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Konu Ekle
              </button>
              
              <button
                onClick={resetToDefaultData}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Sıfırla
              </button>
            </div>
          </div>
        </div>

        {/* Ana İçerik */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sol Panel - Ay Seçimi */}
          <div className="lg:col-span-1">
            <ModernCard className="p-6">
              <div className="flex items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Aylar
                </h3>
              </div>
              
              <div className="space-y-3">
                {monthlyPlans.map((month) => (
                  <div key={month.id}>
                    <button
                      onClick={() => setSelectedMonth(month.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedMonth === month.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-600'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{month.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getOverallProgressForMonth(month) >= 80
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : getOverallProgressForMonth(month) >= 50
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {getOverallProgressForMonth(month)}%
                        </span>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </ModernCard>
          </div>

          {/* Sağ Panel - Ana İçerik */}
          <div className="lg:col-span-3 space-y-8">
            {selectedMonthData && (
              <>
                {/* Ay Başlığı ve İlerleme */}
                <ModernCard className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedMonthData.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        {stats.totalTopics} konu • {stats.totalGoals} hedef
                      </p>
                    </div>
                    
                    <div className="text-center lg:text-right">
                      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {stats.progress}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Genel İlerleme
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${stats.progress}%` }}
                      />
                    </div>
                  </div>
                </ModernCard>

                {/* İstatistik Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatsCard
                    title="Toplam Konu"
                    value={stats.totalTopics}
                    icon={BookOpen}
                    color="blue"
                  />
                  <StatsCard
                    title="Tamamlanan Hedef"
                    value={stats.completedGoals}
                    icon={CheckCircle}
                    color="green"
                  />
                  <StatsCard
                    title="Toplam Hedef"
                    value={stats.totalGoals}
                    icon={Target}
                    color="purple"
                  />
                </div>

                {/* Hedef Yönetimi */}
                <ModernCard className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Hedefler
                  </h3>
                  
                  {/* Yeni Hedef Ekleme */}
                  <div className="mb-6">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        placeholder="Yeni hedef ekle..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && addGoal(selectedMonthData.id)}
                      />
                      <button
                        onClick={() => addGoal(selectedMonthData.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Hedef Listesi */}
                  {selectedMonthData.goals && selectedMonthData.goals.length > 0 ? (
                    <div className="space-y-3">
                      {selectedMonthData.goals.map((goal) => (
                        <div
                          key={goal.id}
                          className={`p-4 rounded-lg border transition-all ${
                            goal.completed
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {editingGoal === goal.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editGoalText}
                                onChange={(e) => setEditGoalText(e.target.value)}
                                className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onKeyPress={(e) => e.key === 'Enter' && saveEditGoal()}
                              />
                              <button
                                onClick={saveEditGoal}
                                className="text-green-500 hover:text-green-700 p-1 rounded transition-colors"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEditGoal}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleGoal(goal.id)}
                                  className="flex-shrink-0"
                                >
                                  {goal.completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-gray-400" />
                                  )}
                                </button>
                                <span className={`flex-1 ${
                                  goal.completed 
                                    ? 'text-green-700 dark:text-green-300 line-through' 
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {goal.text}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => startEditGoal(goal)}
                                    className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => removeGoal(goal.id)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Bu ay için henüz hedef eklenmemiş
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Yukarıdaki formu kullanarak yeni hedef ekleyebilirsiniz
                      </p>
                    </div>
                  )}
                </ModernCard>

                {/* Arama ve Filtreleme */}
                <ModernCard className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Konu ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tüm Dersler</option>
                      {selectedMonthData.subjects && Object.keys(selectedMonthData.subjects).map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  {/* Konular - HTML5 Drag & Drop */}
                  <div className="space-y-6">
                    {Object.entries(filteredTopics).map(([subject, topics]) => (
                      <div key={subject} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 group">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white text-lg flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            {subject}
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({topics.length} konu)
                            </span>
                          </h4>
                          <button
                            onClick={() => deleteSubject(subject)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded transition-all duration-200"
                            title="Dersi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div
                          className={`min-h-[80px] p-3 rounded-lg transition-all duration-200 ${
                            dragOverTarget === `${selectedMonthData.id}-${subject}`
                              ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 dark:border-blue-500 scale-102'
                              : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent'
                          }`}
                          onDragOver={handleDragOver}
                          onDragEnter={(e) => handleDragEnter(e, selectedMonthData.id, subject)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, selectedMonthData.id, subject)}
                        >
                          <div className="flex flex-wrap gap-2">
                            {topics.map((topic, index) => (
                              <div
                                key={`${selectedMonthData.id}-${subject}-${index}-${topic}`}
                                className="group relative"
                              >
                                <div
                                  draggable
                                  className={`px-3 py-2 pr-8 rounded-md text-sm font-medium transition-all duration-200 cursor-grab select-none ${
                                    draggedItem?.topic === topic && draggedItem?.subject === subject
                                      ? 'bg-blue-500 text-white shadow-lg transform rotate-1 scale-105 opacity-50'
                                      : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 hover:scale-105'
                                  }`}
                                  onDragStart={(e) => handleDragStart(e, topic, selectedMonthData.id, subject, index)}
                                  onDragEnd={handleDragEnd}
                                  onMouseDown={() => console.log('Clicking topic:', topic)}
                                >
                                  {topic}
                                </div>
                                <button
                                  onClick={() => deleteTopic(subject, topic)}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-0.5 rounded transition-all duration-200"
                                  title="Konuyu Sil"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {Object.keys(filteredTopics).length === 0 && (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm || selectedSubject !== 'all' 
                          ? 'Arama kriterlerinize uygun konu bulunamadı'
                          : 'Bu ay için henüz konu eklenmemiş'
                        }
                      </p>
                    </div>
                  )}
                </ModernCard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
