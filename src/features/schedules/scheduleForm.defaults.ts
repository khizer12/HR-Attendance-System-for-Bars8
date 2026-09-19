export interface ScheduleFormValues {
  name: string;
  /** "HH:MM" */
  start_time: string;
  /** "HH:MM" */
  end_time: string;
  working_days: number[];
  grace_period_minutes: number;
  break_required: boolean;
  min_break_minutes: number | null;
  max_break_minutes: number | null;
  location_required: boolean;
  verification_interval_minutes: number;
  active: boolean;
}

export const SCHEDULE_DEFAULTS: ScheduleFormValues = {
  name: '',
  start_time: '10:30',
  end_time: '19:30',
  working_days: [1, 2, 3, 4, 5],
  grace_period_minutes: 10,
  break_required: false,
  min_break_minutes: null,
  max_break_minutes: null,
  location_required: false,
  verification_interval_minutes: 30,
  active: true,
};