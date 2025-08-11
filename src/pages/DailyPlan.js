import React, { useState, useMemo } from 'react';
import { Plus, Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle, Circle, Trash2, Book, Target, GripVertical, FileText } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useWeeklyDailySync } from '../hooks/useWeeklyDailySync';
import { useToast } from '../hooks/useToast';
import ModernCard from '../components/ModernCard';
import { comprehensiveData } from '../data/comprehensiveData';

export default function DailyPlan() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyTasks, setDailyTasks] = useLocalStorage('dailyPlans', {});
  const [weeklyPlans, setWeeklyPlans] = useLocalStorage('weeklyPlans', []);
  const [newTaskText, setNewTaskText] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  
  // Haftalık-günlük plan senkronizasyonu
  useWeeklyDailySync();
  
  // Toast bildirimleri
  const { showToast, ToastContainer } = useToast();
  
  // Tarih yardımcı fonksiyonları
  const getDayKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Haftalık plan konularını al (WeeklyPlan ile aynı monthId formatına göre)
  const getWeeklyTopicsForWeek = (weekStartDate) => {
    // comprehensiveData'dan ay id'sini bul (ör: 'august-2025')
    const monthEntry = comprehensiveData.months.find(m => (
      m.year === weekStartDate.getFullYear() && m.month === (weekStartDate.getMonth() + 1)
    ));
    const monthId = monthEntry?.id;

    // Ayın içinde hafta numarası (Pazartesi başlangıç)
    const getWeekNumberInMonth = (date) => {
      // Seçili tarihin haftabaşı (Pazartesi)
      const d = new Date(date);
      const day = d.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day; // Pazartesi'ye çek
      const monday = new Date(d);
      monday.setDate(d.getDate() + mondayOffset);

      // Ayın ilk Pazartesi'sini bul
      const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      let firstMonday = new Date(firstOfMonth);
      // 1..7 günleri arasında Pazartesi olanı bul
      for (let i = 0; i < 7; i++) {
        const temp = new Date(firstOfMonth);
        temp.setDate(1 + i);
        if (temp.getDay() === 1) {
          firstMonday = temp;
          break;
        }
      }

      // Eğer ayın ilk haftası Pazartesi'den önce başlıyorsa, bu haftayı 1 kabul et
      if (monday < firstMonday) return 1;

      const diffMs = monday.getTime() - firstMonday.getTime();
      const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
      return weeks + 1; // 1'den başlat
    };

    const weekNumber = getWeekNumberInMonth(weekStartDate);

    if (!monthId) return [];

    const weekPlan = weeklyPlans.find(plan => 
      plan.monthId === monthId && plan.weekNumber === weekNumber
    );
    
    return weekPlan ? (Array.isArray(weekPlan.topics) ? weekPlan.topics : []) : [];
  };

  const getDayTasks = (date) => dailyTasks[getDayKey(date)] || [];
  
  const setDayTasks = (date, tasks) => {
    const dayKey = getDayKey(date);
    setDailyTasks(prev => ({ ...prev, [dayKey]: tasks }));
  };

  // Hafta navigasyonu
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const goToCurrentWeek = () => {
    setSelectedDate(new Date());
  };

  // Haftanın tarihlerini hesapla
  const getWeekDates = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi başlangıç
    startOfWeek.setDate(diff);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      weekDates.push(weekDate);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(selectedDate);

  // Tarih formatları
  const getDayName = (date) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[date.getDay()];
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric',
      month: 'short'
    });
  };

  const toInputDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Seçili gün için görevler (görev ekleme için)
  const currentTasks = useMemo(() => getDayTasks(selectedDate), [selectedDate, dailyTasks]);

  // Haftalık planlardan gelen görevleri ayırt et (seçili gün için)
  const weeklyTasks = currentTasks.filter(task => task.fromWeekly);
  const dailyOnlyTasks = currentTasks.filter(task => !task.fromWeekly);

  // Tüm hafta için görevleri hesapla
  const weeklyTasksData = useMemo(() => {
    return weekDates.map(date => {
      const tasks = getDayTasks(date);
      return {
        date,
        tasks,
        weeklyTasks: tasks.filter(task => task.fromWeekly),
        dailyTasks: tasks.filter(task => !task.fromWeekly)
      };
    });
  }, [weekDates, dailyTasks]);

  // Seçili tarihe göre ay bilgisini bul (goals göstermek için)
  const currentMonthEntry = useMemo(() => {
    return comprehensiveData.months.find(m => (
      m.year === selectedDate.getFullYear() && m.month === (selectedDate.getMonth() + 1)
    ));
  }, [selectedDate]);

  // Bu haftanın haftalık plan konularını al
  const weeklyTopicsForWeek = useMemo(() => {
    try {
      const weekStart = weekDates[0];
      const topics = getWeeklyTopicsForWeek(weekStart);
      
      // Eğer topics array değilse, boş array döndür
      if (!Array.isArray(topics)) {
        return [];
      }
      
      // Her topic'in düzgün formatlandığından emin ol
      return topics.map((topic, index) => {
        if (typeof topic === 'string') {
          return {
            id: `weekly-topic-${index}`,
            text: topic,
            subject: 'Genel',
            monthId: `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}`,
            weekNumber: Math.ceil(weekStart.getDate() / 7),
            completed: false
          };
        }
        
        // Eğer zaten obje ise, gerekli alanların var olduğundan emin ol
        return {
          id: topic.id || `weekly-topic-${index}`,
          text: topic.text || topic.title || 'Konu',
          subject: topic.subject || 'Genel',
          monthId: topic.monthId || `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}`,
          weekNumber: topic.weekNumber || Math.ceil(weekStart.getDate() / 7),
          completed: topic.completed || false
        };
      });
    } catch (error) {
      console.error('Error getting weekly topics:', error);
      return [];
    }
  }, [weekDates, weeklyPlans]);

  // Görev ekleme
  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask = {
        id: `daily-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: newTaskText.trim(),
        completed: false,
        fromWeekly: false,
        createdAt: new Date().toISOString()
      };
      
      const updatedTasks = [...currentTasks, newTask];
      setDayTasks(selectedDate, updatedTasks);
      setNewTaskText('');
      showToast('Görev eklendi!', 'success');
    }
  };

  // Görev silme (belirli bir tarih için)
  const removeTask = (taskId, date = selectedDate) => {
    const tasks = getDayTasks(date);
    const task = tasks.find(t => t.id === taskId);
    if (task && task.fromWeekly) {
      showToast('Haftalık planlardan gelen görevler silinemez', 'error');
      return;
    }
    
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setDayTasks(date, updatedTasks);
    showToast('Görev silindi', 'success');
  };

  // Görev durumu değiştirme (belirli bir tarih için)
  const toggleTask = (taskId, date = selectedDate) => {
    const tasks = getDayTasks(date);
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setDayTasks(date, updatedTasks);
  };

  // HTML5 Drag & Drop
  const handleDragStart = (e, task, sourceDate) => {
    // Haftalık planlardan gelen görevlerin taşınmasını engelle
    if (task.fromWeekly) {
      e.preventDefault();
      showToast('Haftalık planlardan gelen görevler taşınamaz', 'warning');
      return;
    }
    
    setDraggedTask({ ...task, sourceDate });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetDate, targetIndex = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedTask) return;

    const { sourceDate, ...taskData } = draggedTask;
    const sourceKey = getDayKey(sourceDate);
    const targetKey = getDayKey(targetDate);
    
    // Aynı güne bırakılmışsa hiçbir şey yapma
    if (sourceKey === targetKey && targetIndex === null) {
      setDraggedTask(null);
      return;
    }
    
    // Aynı gün içinde sıralama değiştirme
    if (sourceKey === targetKey && targetIndex !== null) {
      const tasks = getDayTasks(sourceDate);
      const currentIndex = tasks.findIndex(t => t.id === taskData.id);
      
      if (currentIndex === -1 || currentIndex === targetIndex) {
        setDraggedTask(null);
        return;
      }

      const newTasks = [...tasks];
      const [movedTask] = newTasks.splice(currentIndex, 1);
      newTasks.splice(targetIndex, 0, movedTask);
      
      setDayTasks(sourceDate, newTasks);
      showToast('Görev sırası değiştirildi', 'success');
    } 
    // Farklı günlere taşıma
    else if (sourceKey !== targetKey) {
      const sourceTasks = getDayTasks(sourceDate);
      const targetTasks = getDayTasks(targetDate);
      
      // Görevin kaynak günde var olduğunu kontrol et
      const taskExists = sourceTasks.find(t => t.id === taskData.id);
      if (!taskExists) {
        setDraggedTask(null);
        return;
      }
      
      // Kaynak günden kaldır
      const newSourceTasks = sourceTasks.filter(t => t.id !== taskData.id);
      
      // Hedef güne ekle (sourceDate referansını kaldır)
      const cleanTask = {
        id: taskData.id,
        title: taskData.title,
        completed: taskData.completed,
        fromWeekly: taskData.fromWeekly,
        createdAt: taskData.createdAt
      };
      const newTargetTasks = [...targetTasks, cleanTask];
      
      // Batch update ile her iki günü de güncelle
      setDailyTasks(prev => ({
        ...prev,
        [sourceKey]: newSourceTasks,
        [targetKey]: newTargetTasks
      }));
      
      showToast(`Görev ${formatDate(targetDate)} gününe taşındı`, 'success');
    }
    
    setDraggedTask(null);
  };

  // Enter tuşu ile görev ekleme
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  // DnD: Haftalık konulardan günlere ekleme + gün görevlerini yeniden sırala/taşı
  const handleTopicDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Gün içi / günler arası görev taşıma & sıralama
    if (source.droppableId.startsWith('day-') && destination.droppableId.startsWith('day-')) {
      const sourceKey = source.droppableId.replace('day-', '');
      const destKey = destination.droppableId.replace('day-', '');

      // Kaynak/ hedef tarihleri bul
      const sourceDate = weekDates.find(d => getDayKey(d) === sourceKey);
      const destDate = weekDates.find(d => getDayKey(d) === destKey);
      if (!sourceDate || !destDate) return;

      const sourceTasks = getDayTasks(sourceDate);
      const destTasks = getDayTasks(destDate);

      // Taşınacak görevi kaynak listeden çıkar
      const movingIndex = source.index;
      if (movingIndex < 0 || movingIndex >= sourceTasks.length) return;
      const movingTask = sourceTasks[movingIndex];
      const newSource = [...sourceTasks];
      newSource.splice(movingIndex, 1);

      if (sourceKey === destKey) {
        // Aynı gün içinde yeniden sıralama
        const newList = [...newSource];
        newList.splice(destination.index, 0, movingTask);
        setDayTasks(sourceDate, newList);
      } else {
        // Farklı güne taşıma
        const newDest = [...destTasks];
        newDest.splice(destination.index, 0, movingTask);
        setDailyTasks(prev => ({
          ...prev,
          [sourceKey]: newSource,
          [destKey]: newDest
        }));
      }
      return;
    }

    // Haftalık konulardan günlere sürükleme
    if (source.droppableId === 'weekly-topics' && destination.droppableId.startsWith('day-')) {
      const dayKey = destination.droppableId.replace('day-', '');
      const targetDate = weekDates.find(date => getDayKey(date) === dayKey);
      
      if (!targetDate) return;

      const draggedTopic = weeklyTopicsForWeek[source.index];
      const topicText = typeof draggedTopic === 'string' ? draggedTopic : (draggedTopic.text || draggedTopic);
      
      // Yeni görev oluştur
      const newTask = {
        id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: topicText,
        completed: false,
        fromWeekly: true,
        createdAt: new Date().toISOString()
      };

      // Hedef güne ekle
      const currentTasks = getDayTasks(targetDate);
      const updatedTasks = [...currentTasks, newTask];
      setDayTasks(targetDate, updatedTasks);

      // Haftalık panelden kaldır: ilgili haftanın weeklyPlans kaydından bu topic'i sil
      try {
        const weekStart = weekDates[0];
        const monthEntry = comprehensiveData.months.find(m => (
          m.year === weekStart.getFullYear() && m.month === (weekStart.getMonth() + 1)
        ));
        const monthId = monthEntry?.id;

        // Ay içi hafta numarasını (Pazartesi başlangıçlı) hesapla
        const getWeekNumberInMonth = (date) => {
          const d = new Date(date);
          const day = d.getDay();
          const mondayOffset = day === 0 ? -6 : 1 - day; // Pazartesi'ye kaydır
          const monday = new Date(d);
          monday.setDate(d.getDate() + mondayOffset);

          const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
          let firstMonday = new Date(firstOfMonth);
          for (let i = 0; i < 7; i++) {
            const temp = new Date(firstOfMonth);
            temp.setDate(1 + i);
            if (temp.getDay() === 1) { firstMonday = temp; break; }
          }
          if (monday < firstMonday) return 1;
          const diffMs = monday.getTime() - firstMonday.getTime();
          const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
          return weeks + 1;
        };

        const weekNumber = getWeekNumberInMonth(weekStart);

        if (monthId && typeof weekNumber === 'number') {
          setWeeklyPlans(prev => {
            const idx = prev.findIndex(p => p.monthId === monthId && p.weekNumber === weekNumber);
            if (idx === -1) return prev;
            const updated = [...prev];
            const currentTopics = Array.isArray(updated[idx].topics) ? [...updated[idx].topics] : [];
            // source.index üzerinden kaldır
            if (source.index >= 0 && source.index < currentTopics.length) {
              currentTopics.splice(source.index, 1);
              updated[idx] = { ...updated[idx], topics: currentTopics };
            }
            return updated;
          });
        }
      } catch (e) {
        console.error('Weekly topic remove failed:', e);
      }

      showToast(`"${topicText}" konusu ${getDayName(targetDate)} gününe eklendi`, 'success');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Başlık ve Hafta Navigasyonu */}
        <ModernCard className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Haftalık Günlük Plan
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tüm haftanın görevlerini bir arada görün ve yönetin
                </p>
              </div>
            </div>
            
            {/* Hafta Navigasyonu ve Tarih Seçici */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={goToPreviousWeek}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToCurrentWeek}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
              >
                Bugüne Dön
              </button>
              <button
                onClick={goToNextWeek}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xl" aria-hidden="true">📅</span>
                <input
                  type="date"
                  value={toInputDate(selectedDate)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const [yy, mm, dd] = val.split('-');
                    const newDate = new Date(Number(yy), Number(mm) - 1, Number(dd));
                    setSelectedDate(newDate);
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Hafta Aralığı */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {formatWeekRange()}
              </h2>
            </div>
          </div>
        </ModernCard>

          {/* Görev Ekleme */}
        <ModernCard className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Seçili güne görev ekleyin..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getDayName(selectedDate)} - {formatDate(selectedDate)}
              </span>
              <button
                onClick={addTask}
                disabled={!newTaskText.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Ekle
              </button>
            </div>
          </div>
        </ModernCard>

        {/* Haftalık Konular ve Günler - Tek bir DragDropContext içinde */}
        <DragDropContext onDragEnd={handleTopicDragEnd}>
          {weeklyTopicsForWeek.length > 0 && (
            <ModernCard className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Bu Haftanın Konuları
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {weeklyTopicsForWeek.length} konu • Günlere sürükleyin
                </div>
              </div>
              <Droppable droppableId="weekly-topics" direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-wrap gap-2 p-3 rounded-lg border border-dashed transition-colors ${
                      snapshot.isDraggingOver
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {weeklyTopicsForWeek.map((topic, index) => {
                      // Güvenli text çıkarma
                      let topicText = 'Konu';
                      if (typeof topic === 'string') {
                        topicText = topic;
                      } else if (topic && typeof topic === 'object') {
                        topicText = topic.text || topic.title || topic.name || 'Konu';
                      }
                      topicText = String(topicText);
                      const topicId = typeof topic === 'string' ? `weekly-topic-${index}` : (topic.id || `weekly-topic-${index}`);
                      return (
                        <Draggable key={topicId} draggableId={topicId} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`px-3 py-2 rounded-md text-sm font-medium cursor-grab transition-all ${
                                snapshot.isDragging
                                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-200'
                              }`}
                            >
                              {topicText}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </ModernCard>  
          )}
 
        {/* Haftalık Grid - 4 üst + 3 alt sütun */}
        {(() => {
          const firstRowDays = weeklyTasksData.slice(0, 4);
          const secondRowDays = weeklyTasksData.slice(4);
 
          const renderDayCard = (dayData) => {
            const { date, tasks, weeklyTasks: dayWeeklyTasks, dailyTasks: dayDailyTasks } = dayData;
            const isSelectedDay = selectedDate.toDateString() === date.toDateString();
            const isTodayDate = isToday(date);
            
            return (
              <ModernCard 
                key={getDayKey(date)}
                className={`min-h-[480px] transition-all duration-200 ${
                  isSelectedDay 
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : isTodayDate 
                      ? 'ring-1 ring-green-400 bg-green-50 dark:bg-green-900/20'
                      : ''
                }`}
                onClick={() => setSelectedDate(date)}
                clickable
              >
                {/* Gün Başlığı */}
                <div className={`text-center pb-3 border-b border-gray-200 dark:border-gray-700 mb-4 ${
                  isSelectedDay ? 'border-blue-200 dark:border-blue-600' : ''
                }`}>
                  <div className={`text-lg font-semibold ${
                    isTodayDate 
                      ? 'text-green-600 dark:text-green-400' 
                      : isSelectedDay
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                  }`}>
                    {getDayName(date)}
                  </div>
                  <div className={`text-sm ${
                    isTodayDate 
                      ? 'text-green-500 dark:text-green-400' 
                      : isSelectedDay
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {formatDate(date)}
                  </div>
                  {isTodayDate && (
                    <span className="inline-block mt-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                      Bugün
                    </span>
                  )}
                  {isSelectedDay && !isTodayDate && (
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                      Seçili
                    </span>
                  )}
                </div>
 
                {/* Drop Zone (DnD hedefi) */}
                <Droppable droppableId={`day-${getDayKey(date)}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-3 min-h-[380px] transition-colors duration-200 rounded-lg p-2 ${
                        snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      {/* Tüm Görevler (tek listede) */}
                      {tasks.map((task, taskIndex) => (
                        <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`p-3 rounded-lg border transition-all ${
                                task.fromWeekly
                                  ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900 dark:to-indigo-900 border-purple-200 dark:border-purple-600'
                                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                              } ${dragSnapshot.isDragging ? 'shadow-lg scale-[1.01]' : ''}`}
                              title={'Görevi sürükleyip başka güne taşıyabilir veya sıralayabilirsiniz'}
                            >
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTask(task.id, date);
                                  }}
                                  className="flex-shrink-0"
                                >
                                  {task.completed ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-blue-600" />
                                  )}
                                </button>
                                <span className={`flex-1 text-sm ${
                                  task.completed 
                                    ? 'line-through text-gray-500' 
                                    : task.fromWeekly ? 'text-purple-800 dark:text-purple-200' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {typeof task.title === 'string' ? task.title : (task.title?.text || task.title?.title || task.text || 'Görev')}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeTask(task.id, date);
                                  }}
                                  className="flex-shrink-0 text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      
                      {/* Boş Gün Mesajı */}
                      {tasks.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 py-8">
                          <div className="text-center">
                            <Calendar className="w-6 h-6 mx-auto mb-2" />
                            <p className="text-xs">Görev yok</p>
                          </div>
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </ModernCard>
            );
          };
 
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {firstRowDays.map(renderDayCard)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
                {secondRowDays.map(renderDayCard)}
              </div>
            </div>
          );
        })()}
        </DragDropContext>

        {/* Toast Container */}
        <ToastContainer />
      </div>
    </div>
  );
}
