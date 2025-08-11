import React, { useMemo, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X, Search, BarChart3, Calendar, Target, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useWeeklyDailySync } from '../hooks/useWeeklyDailySync';
import { comprehensiveData, getWeekTopics, getMonthlyTopicsPool } from '../data/comprehensiveData';
 

export default function WeeklyPlan() {
  const [weeklyPlans, setWeeklyPlans] = useLocalStorage('weeklyPlans', []);
  // Undo/Redo stacks (in-memory)
  const [history, setHistory] = useState([]); // array of previous weeklyPlans
  const [redoStack, setRedoStack] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('august-2025');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  
  // Kısayollar: Ctrl+Z (undo), Ctrl+Y (redo)
  useKeyboardShortcuts({
    'ctrl+z': () => {
      if (history.length === 0) return;
      const prevState = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setRedoStack(r => [...r, weeklyPlans]);
      setWeeklyPlans(prevState);
    },
    'ctrl+y': () => {
      if (redoStack.length === 0) return;
      const nextState = redoStack[redoStack.length - 1];
      setRedoStack(r => r.slice(0, -1));
      setHistory(h => [...h, weeklyPlans]);
      setWeeklyPlans(nextState);
    },
  });
  
  // Haftalık-günlük plan senkronizasyonu
  useWeeklyDailySync();

  // Aylık plan verilerini localStorage'dan al
  const [monthlyPlans] = useLocalStorage('monthlyPlans', []);
  
  // Seçili ayın verilerini al (localStorage'dan)
  const selectedMonthData = monthlyPlans.find(month => month.id === selectedMonth);
  
  // Aylık plandaki konuları al (sürükle-bırak için)
  const [monthlyTopicsPool, setMonthlyTopicsPool] = useState({});
  
  // Seçili haftanın konularını al ve state'de tut
  const [weekTopics, setWeekTopics] = useState(getWeekTopics(selectedMonth, selectedWeek) || []);
  
  // Ay değiştiğinde aylık konuları güncelle
  React.useEffect(() => {
    // localStorage'daki gerçek aylık plan verilerini kullan
    const monthData = monthlyPlans.find(month => month.id === selectedMonth);
    if (monthData && monthData.subjects) {
      const topicsPool = {};
      Object.entries(monthData.subjects).forEach(([subject, topics]) => {
        if (topics.length > 0) {
          topicsPool[subject] = topics.map((topic, index) => ({
            id: `${selectedMonth}-${subject}-${topic}-${index}`,
            text: topic,
            subject: subject,
            monthId: selectedMonth,
            assignedWeeks: []
          }));
        }
      });
      setMonthlyTopicsPool(topicsPool);
    } else {
      setMonthlyTopicsPool({});
    }
  }, [selectedMonth, monthlyPlans]);
  
  // Hafta değiştiğinde haftalık konuları güncelle
  React.useEffect(() => {
    const currentPlan = weeklyPlans.find(plan => 
      plan.monthId === selectedMonth && plan.weekNumber === selectedWeek
    );
    setWeekTopics(currentPlan?.topics || []);
  }, [selectedMonth, selectedWeek, weeklyPlans]);
  
  // Mevcut haftalık planı bul veya oluştur
  const currentWeekPlan = weeklyPlans.find(plan => 
    plan.monthId === selectedMonth && plan.weekNumber === selectedWeek
  ) || {
    id: `${selectedMonth}-week-${selectedWeek}`,
    monthId: selectedMonth,
    weekNumber: selectedWeek,
    topics: [],
    goals: [],
    notes: ''
  };

  // Helper: update weeklyPlans with history capture
  const updateWeeklyPlans = (updater) => {
    setWeeklyPlans(prev => {
      setHistory(h => [...h.slice(-29), prev]); // keep last 30 states
      setRedoStack([]);
      return typeof updater === 'function' ? updater(prev) : updater;
    });
  };

  // Haftalık planı güncelle
  const updateWeekPlan = (updates) => {
    updateWeeklyPlans(prev => {
      const existingIndex = prev.findIndex(plan => 
        plan.monthId === selectedMonth && plan.weekNumber === selectedWeek
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...updates };
        return updated;
      } else {
        return [...prev, { ...currentWeekPlan, ...updates }];
      }
    });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Aylık konudan haftalık plana sürükleme
    if (source.droppableId.startsWith('monthly-') && destination.droppableId === 'weekly-topics') {
      const [, subject] = source.droppableId.split('-');
      const draggedTopic = monthlyTopicsPool[subject]?.[source.index];
      
      if (draggedTopic) {
        // Konuyu haftalık plana ekle
        const newWeekTopic = {
          id: `week-${selectedWeek}-${Date.now()}`,
          text: draggedTopic.text,
          subject: draggedTopic.subject,
          monthId: selectedMonth,
          weekNumber: selectedWeek,
          completed: false
        };
        
        const newWeekTopics = [...weekTopics, newWeekTopic];
        setWeekTopics(newWeekTopics);
        updateWeekPlan({ topics: newWeekTopics });
        
        // Konuyu aylık pool'dan çıkar
        const updatedMonthlyPool = { ...monthlyTopicsPool };
        updatedMonthlyPool[subject] = updatedMonthlyPool[subject].filter((_, index) => index !== source.index);
        
        // Eğer ders boş kaldıysa, dersi tamamen kaldır
        if (updatedMonthlyPool[subject].length === 0) {
          delete updatedMonthlyPool[subject];
        }
        
        setMonthlyTopicsPool(updatedMonthlyPool);
        toast.success(`"${draggedTopic.text}" konusu ${selectedWeek}. haftaya eklendi`);
      }
      return;
    }
    
    // Haftalık konular içinde sıralama
    if (source.droppableId === destination.droppableId && source.droppableId === 'weekly-topics') {
      const newWeekTopics = Array.from(weekTopics);
      const [removed] = newWeekTopics.splice(source.index, 1);
      newWeekTopics.splice(destination.index, 0, removed);
      setWeekTopics(newWeekTopics);
      updateWeekPlan({ topics: newWeekTopics });
    }
  };

  const addNewWeek = () => {
    const newWeekNumber = Math.max(...weeklyPlans
      .filter(plan => plan.monthId === selectedMonth)
      .map(plan => plan.weekNumber), 0) + 1;
    
    const newWeekPlan = {
      id: `${selectedMonth}-week-${newWeekNumber}`,
      monthId: selectedMonth,
      weekNumber: newWeekNumber,
      topics: [],
      goals: [],
      notes: ''
    };
    
    updateWeeklyPlans(prev => [...prev, newWeekPlan]);
    setSelectedWeek(newWeekNumber);
    toast.success(`${selectedMonthData?.name || 'Seçili Ay'} ${newWeekNumber}. hafta eklendi`);
  };

  const addGoal = () => {
    const goalText = prompt('Yeni hedef ekle:');
    if (goalText && goalText.trim()) {
      const newGoal = {
        id: Date.now(),
        text: goalText.trim(),
        completed: false
      };
      updateWeekPlan({ goals: [...currentWeekPlan.goals, newGoal] });
      toast.success('Hedef eklendi');
    }
  };

  const toggleGoal = (goalId) => {
    const updatedGoals = currentWeekPlan.goals.map(goal =>
      goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
    );
    updateWeekPlan({ goals: updatedGoals });
    
    const goal = currentWeekPlan.goals.find(g => g.id === goalId);
    toast.success(goal.completed ? 'Hedef tamamlandı olarak işaretlendi' : 'Hedef tamamlanmadı olarak işaretlendi');
  };

  const removeGoal = (goalId) => {
    const goal = currentWeekPlan.goals.find(g => g.id === goalId);
    const updatedGoals = currentWeekPlan.goals.filter(goal => goal.id !== goalId);
    updateWeekPlan({ goals: updatedGoals });
    toast.success(`${goal.text} hedefi silindi`);
  };

  const updateNotes = (notes) => {
    updateWeekPlan({ notes });
  };

  

  // Filtrelenmiş konular
  const filteredWeekTopics = (weekTopics || []).filter(topic => {
    const topicText = typeof topic === 'string' ? topic : (topic.text || '');
    return topicText.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="h-full">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Haftalık Plan</h1>
            <p className="text-gray-600 dark:text-gray-300">Haftalık çalışma planlarınızı organize edin</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Undo / Redo */}
            <button
              onClick={() => {
                if (history.length === 0) return;
                const prevState = history[history.length - 1];
                setHistory(h => h.slice(0, -1));
                setRedoStack(r => [...r, weeklyPlans]);
                setWeeklyPlans(prevState);
              }}
              disabled={history.length === 0}
              className={`px-3 py-2 rounded-lg text-sm border ${history.length===0 ? 'text-gray-400 border-gray-200 dark:border-gray-700' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'}`}
              title="Geri Al (Ctrl+Z)"
            >
              Geri Al
            </button>
            <button
              onClick={() => {
                if (redoStack.length === 0) return;
                const nextState = redoStack[redoStack.length - 1];
                setRedoStack(r => r.slice(0, -1));
                setHistory(h => [...h, weeklyPlans]);
                setWeeklyPlans(nextState);
              }}
              disabled={redoStack.length === 0}
              className={`px-3 py-2 rounded-lg text-sm border ${redoStack.length===0 ? 'text-gray-400 border-gray-200 dark:border-gray-700' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'}`}
              title="Yinele (Ctrl+Y)"
            >
              Yinele
            </button>
            
          </div>
        </div>
      </div>

      

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sol Panel - Ay ve Hafta Seçimi */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-soft-dark p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ay Seçimi</h3>
            
            {/* Ay Seçimi */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ay
              </label>
        <select
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
                  setSelectedWeek(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {comprehensiveData.months.map(month => (
                  <option key={month.id} value={month.id}>
                    {month.name}
            </option>
          ))}
        </select>
      </div>

            {/* Hafta Seçimi */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hafta
                </label>
                <button
                  onClick={addNewWeek}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Yeni Hafta
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(
                  () => {
                    const nums = weeklyPlans
                      .filter(p => p.monthId === selectedMonth)
                      .map(p => p.weekNumber);
                    const max = Math.max(4, ...(nums.length ? nums : [0]));
                    const weekNumbers = Array.from({ length: max }, (_, i) => i + 1);
                    return weekNumbers;
                  }
                )().map(weekNum => {
                  const weekPlan = weeklyPlans.find(plan => 
                    plan.monthId === selectedMonth && plan.weekNumber === weekNum
                  );
                  return (
                    <button
                      key={weekNum}
                      onClick={() => setSelectedWeek(weekNum)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedWeek === weekNum
                          ? 'bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{weekNum}. Hafta</span>
                        {weekPlan && weekPlan.topics.length > 0 && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                            {weekPlan.topics.length}
                          </span>
                        )}
                      </div>
                      {weekPlan && weekPlan.topics.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                          {weekPlan.topics.slice(0, 2).map(topic => 
                            typeof topic === 'string' ? topic : (topic.text || topic)
                          ).join(', ')}
                          {weekPlan.topics.length > 2 && '...'}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ay Bilgileri */}
            {selectedMonthData && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">{selectedMonthData.name}</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Toplam Konu:</span>
                    <span className="font-medium">{weekTopics.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ders Sayısı:</span>
                    <span className="font-medium">{Object.keys(selectedMonthData.subjects).length}</span>
                  </div>
                  {selectedMonthData.notes && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs">{selectedMonthData.notes[0]}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sağ Panel - Haftalık Plan */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-soft-dark p-6">
            <div className="flex items-center justify-between mb-6">
        <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedMonthData?.name} {selectedWeek}. Hafta
              </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {currentWeekPlan.topics.length} konu planlandı
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  İlerleme: {currentWeekPlan.goals.filter(g => g.completed).length}/{currentWeekPlan.goals.length}
                </span>
              </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Aylık Plan Konuları (Sürüklenebilir) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Aylık Plan Konuları
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Haftalara sürükleyin
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {Object.entries(monthlyTopicsPool).map(([subject, topics]) => (
                      <div key={subject} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          {subject}
                        </h4>
                        <Droppable droppableId={`monthly-${subject}`}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="space-y-2"
                            >
                              {topics.map((topic, index) => (
                                <Draggable key={topic.id} draggableId={topic.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`p-2 rounded-md text-sm transition-all ${
                                        snapshot.isDragging
                                          ? 'bg-blue-200 dark:bg-blue-800 shadow-lg cursor-grabbing'
                                          : 'bg-white dark:bg-gray-600 hover:bg-blue-50 dark:hover:bg-gray-500 cursor-grab'
                                      }`}
                                    >
                                      {topic.text}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    ))}
                    
                    {Object.keys(monthlyTopicsPool).length === 0 && (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <Clock className="w-8 h-8 mx-auto mb-2" />
                        <p>Bu ay için henüz konu eklenmemiş</p>
                        <p className="text-sm mt-1">Aylık plandan konu ekleyin</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Haftalık Plan Konuları (Bırakma Alanı) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedWeek}. Hafta Konuları
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {filteredWeekTopics.length} konu
                    </div>
                  </div>
                  
                  <Droppable droppableId="weekly-topics">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[400px] p-4 rounded-lg border-2 border-dashed transition-colors ${
                          snapshot.isDraggingOver
                            ? 'border-green-400 bg-green-50 dark:bg-green-900'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {filteredWeekTopics.map((topic, index) => (
                          <Draggable key={topic.id || `week-topic-${index}`} draggableId={topic.id || `week-topic-${index}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 mb-2 rounded-lg border transition-all ${
                                  snapshot.isDragging
                                    ? 'bg-green-100 dark:bg-green-800 border-green-300 dark:border-green-600 shadow-lg'
                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                      {topic.text || topic}
                                    </span>
                                    {topic.subject && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {topic.subject}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-green-500" />
                                    <button
                                      onClick={() => {
                                        const updatedTopics = weekTopics.filter((_, i) => i !== index);
                                        setWeekTopics(updatedTopics);
                                        updateWeekPlan({ topics: updatedTopics });
                                      }}
                                      className="text-red-500 hover:text-red-700 p-1"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {weekTopics.length === 0 && (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <Calendar className="w-8 h-8 mx-auto mb-2" />
                            <p>Aylık konuları buraya sürükleyin</p>
                            <p className="text-sm mt-1">Sol panelden konuları sürükleyebilirsiniz</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* Notlar */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notlar</h3>
                  <textarea
                    value={currentWeekPlan.notes}
                    onChange={(e) => updateNotes(e.target.value)}
                    placeholder="Bu hafta için notlarınızı buraya yazın..."
                    className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </DragDropContext>

            {/* Hedefler - Ortalanmış */}
            <div className="mt-8">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hedefler</h3>
                  <button
                    onClick={addGoal}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Hedef Ekle</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {currentWeekPlan.goals.map((goal) => (
                    <div key={goal.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                      <button
                        onClick={() => toggleGoal(goal.id)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          goal.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 dark:border-gray-500 hover:border-green-400'
                        }`}
                      >
                        {goal.completed && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </button>
                      <span className={`flex-1 text-sm ${goal.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                        {goal.text}
                      </span>
                      <button
                        onClick={() => removeGoal(goal.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {currentWeekPlan.goals.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                      <Target className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-sm">Henüz hedef eklenmemiş</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
