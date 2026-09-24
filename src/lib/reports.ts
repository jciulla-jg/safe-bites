import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

/**
 * Reporting a community entry as wrong or inappropriate (report_submission,
 * 0007 migration). The server hides an entry from everyone at 3 reports;
 * this device also stops showing anything it has reported, straight away.
 */

export type ReportTarget = 'feedback' | 'community_item';

const STORAGE_KEY = 'safe-bites/reported-submissions';

export async function loadReportedIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

export async function reportSubmission(targetType: ReportTarget, targetId: string): Promise<void> {
  const { data, error } = await supabase.rpc('report_submission', {
    p_target_type: targetType,
    p_target_id: targetId,
  });
  if (error || data !== true) {
    throw error ?? new Error('Could not report.');
  }
  const reported = await loadReportedIds();
  reported.add(targetId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(reported)));
}
