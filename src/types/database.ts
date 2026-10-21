/**
 * Tipos del esquema de Supabase (ver supabase/migrations).
 * Escritos a mano con el mismo formato que genera `supabase gen types`.
 * Si modificas el esquema, actualiza este archivo.
 */

type Timestamp = string
/** Fecha local 'yyyy-MM-dd'. */
type DateString = string

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type GoalCategory =
  | 'educacion'
  | 'carrera'
  | 'salud'
  | 'ejercicio'
  | 'finanzas'
  | 'personal'
  | 'creatividad'
  | 'otra'
export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived'
export type HabitStatus = 'active' | 'paused' | 'archived'
export type FrequencyType = 'daily' | 'weekly' | 'interval'
export type VisionQuestionKey = 'persona' | 'importancia' | 'vida' | 'motivacion'

export type ProfileRow = {
  id: string
  display_name: string | null
  created_at: Timestamp
  updated_at: Timestamp
}

export type GoalRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  category: GoalCategory
  color: string | null
  status: GoalStatus
  specific: string
  measurable: string
  achievable: string
  relevant: string
  start_date: DateString
  deadline: DateString
  metric_name: string | null
  metric_unit: string | null
  metric_target: number | null
  metric_current: number
  completed_at: Timestamp | null
  archived_at: Timestamp | null
  created_at: Timestamp
  updated_at: Timestamp
}

export type PauseRow = {
  id: string
  user_id: string
  start_date: DateString
  end_date: DateString | null
  created_at: Timestamp
}
export type GoalPauseRow = PauseRow & {
  goal_id: string
}
export type HabitPauseRow = PauseRow & {
  habit_id: string
}

export type HabitRow = {
  id: string
  user_id: string
  goal_id: string
  name: string
  description: string | null
  start_date: DateString
  end_date: DateString | null
  time_of_day: string | null
  duration_minutes: number | null
  icon: string | null
  color: string | null
  status: HabitStatus
  archived_at: Timestamp | null
  created_at: Timestamp
  updated_at: Timestamp
}

export type HabitScheduleVersionRow = {
  id: string
  habit_id: string
  user_id: string
  effective_from: DateString
  frequency_type: FrequencyType
  /** Días ISO: 1 = lunes … 7 = domingo. */
  weekdays: number[] | null
  interval_days: number | null
  created_at: Timestamp
}

export type HabitCompletionRow = {
  id: string
  habit_id: string
  user_id: string
  date: DateString
  completed_at: Timestamp
}

export type VisionBoardEntryRow = {
  id: string
  user_id: string
  question_key: VisionQuestionKey
  answer: string
  created_at: Timestamp
  updated_at: Timestamp
}

export type VisionBoardImageRow = {
  id: string
  user_id: string
  goal_id: string | null
  storage_path: string
  caption: string | null
  width: number | null
  height: number | null
  position: number
  created_at: Timestamp
}

/** Columnas con valor por defecto en la base de datos: opcionales al insertar. */
type WithDefaults<Row, Keys extends string> = Omit<Row, Keys> & Partial<Pick<Row, Extract<keyof Row, Keys>>>
type Auto = 'id' | 'user_id' | 'created_at'

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, WithDefaults<ProfileRow, 'created_at' | 'updated_at' | 'display_name'>>
      goals: Table<
        GoalRow,
        WithDefaults<
          GoalRow,
          | Auto
          | 'updated_at'
          | 'description'
          | 'category'
          | 'color'
          | 'status'
          | 'specific'
          | 'measurable'
          | 'achievable'
          | 'relevant'
          | 'metric_name'
          | 'metric_unit'
          | 'metric_target'
          | 'metric_current'
          | 'completed_at'
          | 'archived_at'
        >
      >
      goal_pauses: Table<GoalPauseRow, WithDefaults<GoalPauseRow, Auto | 'end_date'>>
      habits: Table<
        HabitRow,
        WithDefaults<
          HabitRow,
          | Auto
          | 'updated_at'
          | 'description'
          | 'end_date'
          | 'time_of_day'
          | 'duration_minutes'
          | 'icon'
          | 'color'
          | 'status'
          | 'archived_at'
        >
      >
      habit_schedule_versions: Table<
        HabitScheduleVersionRow,
        WithDefaults<HabitScheduleVersionRow, Auto | 'weekdays' | 'interval_days'>
      >
      habit_pauses: Table<HabitPauseRow, WithDefaults<HabitPauseRow, Auto | 'end_date'>>
      habit_completions: Table<HabitCompletionRow, WithDefaults<HabitCompletionRow, Auto | 'completed_at'>>
      vision_board_entries: Table<
        VisionBoardEntryRow,
        WithDefaults<VisionBoardEntryRow, Auto | 'updated_at' | 'answer'>
      >
      vision_board_images: Table<
        VisionBoardImageRow,
        WithDefaults<VisionBoardImageRow, Auto | 'goal_id' | 'caption' | 'width' | 'height' | 'position'>
      >
    }
    Views: { [_ in never]: never }
    Functions: {
      set_goal_status: {
        Args: { p_goal_id: string; p_status: GoalStatus; p_today: DateString }
        Returns: GoalRow
      }
      set_habit_status: {
        Args: { p_habit_id: string; p_status: HabitStatus; p_today: DateString }
        Returns: HabitRow
      }
      create_habit: {
        Args: {
          p_goal_id: string
          p_name: string
          p_start_date: DateString
          p_frequency_type: FrequencyType
          p_weekdays?: number[] | null
          p_interval_days?: number | null
          p_end_date?: DateString | null
          p_description?: string | null
          p_time_of_day?: string | null
          p_duration_minutes?: number | null
          p_icon?: string | null
          p_color?: string | null
        }
        Returns: HabitRow
      }
      change_habit_schedule: {
        Args: {
          p_habit_id: string
          p_effective_from: DateString
          p_frequency_type: FrequencyType
          p_weekdays?: number[] | null
          p_interval_days?: number | null
        }
        Returns: undefined
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
