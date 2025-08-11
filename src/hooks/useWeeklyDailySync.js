import { useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Ders kategorileri için sabitler
 */
const SUBJECT_CATEGORIES = {
  TYT_MATH: 'TYT Matematik',
  TYT_BIOLOGY: 'TYT Biyoloji',
  TYT_PHYSICS: 'TYT Fizik',
  TYT_CHEMISTRY: 'TYT Kimya',
  AYT_MATH: 'AYT Matematik',
  AYT_BIOLOGY: 'AYT Biyoloji',
  AYT_PHYSICS: 'AYT Fizik',
  AYT_CHEMISTRY: 'AYT Kimya',
  GEOMETRY: 'TYT/AYT Geometri',
  GENERAL: 'Genel'
};

/**
 * Konu kategorisi belirleme kuralları
 */
const CATEGORY_RULES = [
  { keywords: ['tyt', 'matematik'], category: SUBJECT_CATEGORIES.TYT_MATH },
  { keywords: ['tyt', 'biyoloji'], category: SUBJECT_CATEGORIES.TYT_BIOLOGY },
  { keywords: ['tyt', 'fizik'], category: SUBJECT_CATEGORIES.TYT_PHYSICS },
  { keywords: ['tyt', 'kimya'], category: SUBJECT_CATEGORIES.TYT_CHEMISTRY },
  { keywords: ['ayt', 'matematik'], category: SUBJECT_CATEGORIES.AYT_MATH },
  { keywords: ['ayt', 'biyoloji'], category: SUBJECT_CATEGORIES.AYT_BIOLOGY },
  { keywords: ['ayt', 'fizik'], category: SUBJECT_CATEGORIES.AYT_PHYSICS },
  { keywords: ['ayt', 'kimya'], category: SUBJECT_CATEGORIES.AYT_CHEMISTRY },
  { keywords: ['geometri'], category: SUBJECT_CATEGORIES.GEOMETRY },
  { keywords: ['matematik'], category: SUBJECT_CATEGORIES.TYT_MATH },
  { keywords: ['biyoloji'], category: SUBJECT_CATEGORIES.TYT_BIOLOGY },
  { keywords: ['fizik'], category: SUBJECT_CATEGORIES.TYT_PHYSICS },
  { keywords: ['kimya'], category: SUBJECT_CATEGORIES.TYT_CHEMISTRY }
];

/**
 * Haftalık ve günlük planlar arasında konu senkronizasyonu sağlar
 * Haftalık planda eklenen konular, o haftanın günlerine otomatik dağıtılır
 */
export const useWeeklyDailySync = () => {
  const [weeklyPlans] = useLocalStorage('weeklyPlans', []);
  const [dailyPlans, setDailyPlans] = useLocalStorage('dailyPlans', {});

  /**
   * Haftalık planlardan günlük planlara konu senkronizasyonu
   */
  const syncWeeklyToDaily = useCallback(() => {
    if (!weeklyPlans.length) return;

    let hasChanges = false;
    const updatedDailyPlans = { ...dailyPlans };

    weeklyPlans.forEach(weekPlan => {
      if (!isValidWeekPlan(weekPlan)) return;

      const weekDates = getWeekDatesFromPlan(weekPlan);
      
      weekPlan.topics.forEach((topic, index) => {
        const dayIndex = index % 7;
        const targetDate = weekDates[dayIndex];
        const dayKey = formatDateKey(targetDate);

        if (!isTopicAlreadyExists(updatedDailyPlans[dayKey], weekPlan.id, topic)) {
          const dailyTopic = createDailyTopic(topic, weekPlan, index);
          updatedDailyPlans[dayKey] = [...(updatedDailyPlans[dayKey] || []), dailyTopic];
          hasChanges = true;
        }
      });
    });

    if (hasChanges) {
      setDailyPlans(updatedDailyPlans);
    }
  }, [weeklyPlans, dailyPlans, setDailyPlans]);

  /**
   * Haftalık plandan silinen konuları günlük plandan temizle
   */
  const cleanupRemovedTopics = useCallback(() => {
    if (!weeklyPlans.length) return;

    let hasChanges = false;
    const updatedDailyPlans = { ...dailyPlans };

    Object.keys(updatedDailyPlans).forEach(dayKey => {
      const dayTopics = updatedDailyPlans[dayKey];
      if (!dayTopics?.length) return;

      const filteredTopics = dayTopics.filter(topic => {
        // Haftalık plandan gelmeyen konuları koru
        if (!topic.weekPlanId) return true;

        const weekPlan = weeklyPlans.find(wp => wp.id === topic.weekPlanId);
        
        // Haftalık plan silinmişse konuyu da sil
        if (!weekPlan) {
          hasChanges = true;
          return false;
        }

        // Konu haftalık plandan silinmişse günlük plandan da sil
        const topicExists = weekPlan.topics?.includes(topic.originalTopic);
        if (!topicExists) {
          hasChanges = true;
          return false;
        }

        return true;
      });

      if (filteredTopics.length !== dayTopics.length) {
        updatedDailyPlans[dayKey] = filteredTopics;
      }
    });

    if (hasChanges) {
      setDailyPlans(updatedDailyPlans);
    }
  }, [weeklyPlans, dailyPlans, setDailyPlans]);

  // Otomatik senkronizasyon devre dışı bırakıldı.
  // Kullanıcı haftalık konuları günlük günlere manuel olarak dağıtacak.
  // İleride ihtiyaç olursa aşağıdaki efektler tekrar etkinleştirilebilir.
  // useEffect(() => {
  //   syncWeeklyToDaily();
  // }, [syncWeeklyToDaily]);
  // useEffect(() => {
  //   cleanupRemovedTopics();
  // }, [cleanupRemovedTopics]);

  // Manuel senkronizasyon fonksiyonu
  const manualSync = useCallback(() => {
    syncWeeklyToDaily();
    cleanupRemovedTopics();
  }, [syncWeeklyToDaily, cleanupRemovedTopics]);

  return {
    syncWeeklyToDaily: manualSync,
    isLoading: false // Gelecekte async işlemler için
  };
};

/**
 * Yardımcı fonksiyonlar
 */

/**
 * Hafta planının geçerli olup olmadığını kontrol eder
 */
const isValidWeekPlan = (weekPlan) => {
  return weekPlan && 
         weekPlan.topics && 
         Array.isArray(weekPlan.topics) && 
         weekPlan.topics.length > 0 &&
         weekPlan.id &&
         typeof weekPlan.weekNumber === 'number';
};

/**
 * Konunun zaten var olup olmadığını kontrol eder
 */
const isTopicAlreadyExists = (dayTopics, weekPlanId, topic) => {
  if (!dayTopics || !Array.isArray(dayTopics)) return false;
  
  return dayTopics.some(t => 
    t.weekPlanId === weekPlanId && t.originalTopic === topic
  );
};

/**
 * Günlük konu objesi oluşturur
 */
const createDailyTopic = (topic, weekPlan, index) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  
  return {
    id: `${weekPlan.id}-${index}-${timestamp}-${randomId}`,
    title: topic,
    category: determineTopicCategory(topic),
    weekPlanId: weekPlan.id,
    originalTopic: topic,
    monthId: weekPlan.monthId,
    weekNumber: weekPlan.weekNumber,
    addedDate: new Date().toISOString(),
    completed: false,
    syncedAt: timestamp
  };
};

/**
 * Hafta planından hafta tarihlerini hesaplar
 */
const getWeekDatesFromPlan = (weekPlan) => {
  try {
    // Ağustos 2025 base tarihi
    const baseDate = new Date(2025, 7, 1);
    const weekStartDate = new Date(baseDate);
    weekStartDate.setDate(baseDate.getDate() + (weekPlan.weekNumber - 1) * 7);
    
    // Haftanın pazartesi gününü bul
    const dayOfWeek = weekStartDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStartDate.setDate(weekStartDate.getDate() + mondayOffset);

    // 7 günlük tarihleri oluştur
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + i);
      return date;
    });
  } catch (error) {
    console.error('Hafta tarihleri hesaplanırken hata:', error);
    return [];
  }
};

/**
 * Tarihi string formatına çevirir (YYYY-MM-DD)
 */
const formatDateKey = (date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error('Geçersiz tarih:', date);
    return new Date().toISOString().split('T')[0];
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Konu içeriğine göre kategori belirler
 */
const determineTopicCategory = (topic) => {
  if (!topic || typeof topic !== 'string') {
    return SUBJECT_CATEGORIES.GENERAL;
  }

  const topicLower = topic.toLowerCase();
  
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(keyword => topicLower.includes(keyword))) {
      return rule.category;
    }
  }
  
  return SUBJECT_CATEGORIES.GENERAL;
};

export default useWeeklyDailySync;
