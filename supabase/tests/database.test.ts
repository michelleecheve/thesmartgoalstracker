// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestDatabase, USER_A as A, USER_B as B } from './harness'

type Db = Awaited<ReturnType<typeof createTestDatabase>>
let t: Db
let goalId: string
let habitId: string

const iso = (col: string) => `to_char(${col}, 'YYYY-MM-DD')`

beforeAll(async () => {
  t = await createTestDatabase()
  await t.createUser(A, '  Ana  ')
  await t.createUser(B)
  goalId = (
    await t.as<{ id: string }>(A, `insert into public.goals (name, start_date, deadline, metric_name, metric_target)
      values ('Curso Coursera', '2026-11-01', '2027-03-31', 'Módulos', 12) returning id`)
  ).rows[0]!.id
  habitId = (
    await t.as<{ id: string }>(A, `select id from public.create_habit($1, 'Estudiar', '2026-11-01', 'weekly', '{1,3,5}')`, [goalId])
  ).rows[0]!.id
  await t.as(A, `insert into public.habit_completions (habit_id, date) values ($1, '2026-10-15')`, [habitId])
}, 30_000)

describe('perfiles', () => {
  it('se crean al registrarse, con el nombre limpio', async () => {
    const rows = (await t.db.query<{ display_name: string | null }>(`select display_name from public.profiles order by id`)).rows
    expect(rows.map((r) => r.display_name)).toEqual(['Ana', null])
  })
})

describe('privacidad entre usuarios (RLS)', () => {
  it('B no ve metas, hábitos, cumplimientos ni el perfil de A', async () => {
    for (const table of ['goals', 'habits', 'habit_completions', 'habit_schedule_versions']) {
      expect((await t.as(B, `select * from public.${table}`)).rows).toHaveLength(0)
    }
    expect((await t.as(B, `select * from public.profiles where id = '${A}'`)).rows).toHaveLength(0)
  })

  it('B no puede editar ni borrar datos de A', async () => {
    expect((await t.as(B, `update public.goals set name = 'x' where id = $1`, [goalId])).affectedRows).toBe(0)
    expect((await t.as(B, `delete from public.goals where id = $1`, [goalId])).affectedRows).toBe(0)
  })

  it('B no puede crear datos a nombre de A ni dentro de sus metas', async () => {
    await expect(
      t.as(B, `insert into public.goals (user_id, name, start_date, deadline) values ('${A}', 'x', '2026-11-01', '2026-12-01')`),
    ).rejects.toThrow(/row-level security/)
    await expect(
      t.as(B, `insert into public.habits (goal_id, name, start_date) values ($1, 'x', '2026-11-01')`, [goalId]),
    ).rejects.toThrow(/foreign key/)
  })

  it('un visitante sin sesión no puede leer nada', async () => {
    await expect(t.as(null, `select * from public.goals`)).rejects.toThrow(/permission denied/)
  })

  it('las funciones respetan la privacidad', async () => {
    await expect(t.as(B, `select * from public.set_goal_status($1, 'completed', '2026-11-20')`, [goalId])).rejects.toThrow(
      'No encontramos esta meta',
    )
    await expect(t.as(B, `select public.change_habit_schedule($1, '2026-12-01', 'daily')`, [habitId])).rejects.toThrow(
      'No encontramos este hábito',
    )
    await expect(t.as(null, `select * from public.set_goal_status($1, 'paused', '2026-11-20')`, [goalId])).rejects.toThrow(
      /permission denied/,
    )
  })
})

describe('integridad', () => {
  it('no permite registrar dos veces el mismo hábito el mismo día', async () => {
    await expect(t.as(A, `insert into public.habit_completions (habit_id, date) values ($1, '2026-10-15')`, [habitId])).rejects.toThrow(
      /completions_unique_day/,
    )
  })

  it('no permite marcar fechas futuras', async () => {
    await expect(
      t.as(A, `insert into public.habit_completions (habit_id, date) values ($1, current_date + 5)`, [habitId]),
    ).rejects.toThrow('No puedes marcar un hábito en una fecha futura')
  })

  it('valida fechas y frecuencias', async () => {
    await expect(t.as(A, `insert into public.goals (name, start_date, deadline) values ('x', '2026-11-01', '2026-10-01')`)).rejects.toThrow(
      /goals_deadline_after_start/,
    )
    await expect(
      t.as(A, `insert into public.habit_schedule_versions (habit_id, effective_from, frequency_type, weekdays) values ($1, '2027-01-01', 'weekly', '{8}')`, [habitId]),
    ).rejects.toThrow(/schedule_shape/)
  })

  it('crear un hábito con frecuencia inválida no deja un hábito huérfano', async () => {
    await expect(t.as(A, `select * from public.create_habit($1, 'Malo', '2026-11-01', 'weekly', '{}')`, [goalId])).rejects.toThrow()
    expect((await t.as(A, `select * from public.habits where name = 'Malo'`)).rows).toHaveLength(0)
  })
})

describe('historial de frecuencias', () => {
  it('cambiar la frecuencia agrega una versión y conserva la anterior', async () => {
    await t.as(A, `select public.change_habit_schedule($1, '2026-12-01', 'weekly', '{2,4}')`, [habitId])
    const rows = (await t.as<{ f: string }>(A, `select ${iso('effective_from')} f from public.habit_schedule_versions where habit_id = $1 order by 1`, [habitId])).rows
    expect(rows.map((r) => r.f)).toEqual(['2026-11-01', '2026-12-01'])
  })

  it('cambiarla dos veces el mismo día reemplaza la versión de ese día', async () => {
    await t.as(A, `select public.change_habit_schedule($1, '2026-12-01', 'daily')`, [habitId])
    const rows = (await t.as<{ t: string }>(A, `select frequency_type t from public.habit_schedule_versions where habit_id = $1 order by effective_from`, [habitId])).rows
    expect(rows.map((r) => r.t)).toEqual(['weekly', 'daily'])
  })
})

describe('pausas, completar, archivar y restaurar', () => {
  const pauses = async (table: string, col: string, id: string) =>
    (await t.as<{ s: string; e: string | null }>(A, `select ${iso('start_date')} s, ${iso('end_date')} e from public.${table} where ${col} = $1 order by start_date`, [id])).rows

  it('pausar el 10 y reanudar el 15 deja la pausa del 10 al 14', async () => {
    await t.as(A, `select * from public.set_habit_status($1, 'paused', '2026-11-10')`, [habitId])
    await t.as(A, `select * from public.set_habit_status($1, 'active', '2026-11-15')`, [habitId])
    expect(await pauses('habit_pauses', 'habit_id', habitId)).toEqual([{ s: '2026-11-10', e: '2026-11-14' }])
  })

  it('pausar y reanudar el mismo día no deja días en pausa', async () => {
    await t.as(A, `select * from public.set_habit_status($1, 'paused', '2026-11-20')`, [habitId])
    await t.as(A, `select * from public.set_habit_status($1, 'active', '2026-11-20')`, [habitId])
    expect(await pauses('habit_pauses', 'habit_id', habitId)).toHaveLength(1)
  })

  it('una meta completada y archivada conserva su historial y se puede restaurar', async () => {
    await t.as(A, `select * from public.set_goal_status($1, 'completed', '2026-11-12')`, [goalId])
    const archived = (await t.as<{ completed_at: string | null; archived_at: string | null }>(A, `select * from public.set_goal_status($1, 'archived', '2026-11-14')`, [goalId])).rows[0]!
    expect(archived.completed_at).not.toBeNull()
    expect(archived.archived_at).not.toBeNull()
    expect((await t.as(A, `select * from public.habit_completions where habit_id = $1`, [habitId])).rows).toHaveLength(1)

    const restored = (await t.as<{ status: string; completed_at: string | null }>(A, `select * from public.set_goal_status($1, 'active', '2026-11-20')`, [goalId])).rows[0]!
    expect(restored).toMatchObject({ status: 'active', completed_at: null })
    expect(await pauses('goal_pauses', 'goal_id', goalId)).toEqual([{ s: '2026-11-12', e: '2026-11-19' }])
  })
})

describe('tablero de visión e imágenes', () => {
  it('cada usuario solo accede a su carpeta privada', async () => {
    await t.as(A, `insert into storage.objects (bucket_id, name) values ('vision-board', '${A}/foto.jpg')`)
    await expect(t.as(A, `insert into storage.objects (bucket_id, name) values ('vision-board', '${B}/foto.jpg')`)).rejects.toThrow(
      /row-level security/,
    )
    expect((await t.as(B, `select * from storage.objects`)).rows).toHaveLength(0)
  })

  it('el bucket es privado y limita el tamaño y el tipo de archivo', async () => {
    const bucket = (await t.db.query<{ public: boolean; file_size_limit: number; allowed_mime_types: string[] }>(
      `select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'vision-board'`,
    )).rows[0]!
    expect(bucket.public).toBe(false)
    expect(Number(bucket.file_size_limit)).toBe(10 * 1024 * 1024)
    expect(bucket.allowed_mime_types).toEqual(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  })

  it('una reflexión por pregunta y usuario', async () => {
    await t.as(A, `insert into public.vision_board_entries (question_key, answer) values ('persona', 'Alguien constante')`)
    await t.as(A, `insert into public.vision_board_entries (user_id, question_key, answer) values ('${A}', 'persona', 'Actualizada')
      on conflict (user_id, question_key) do update set answer = excluded.answer`)
    const rows = (await t.as<{ answer: string }>(A, `select answer from public.vision_board_entries`)).rows
    expect(rows).toEqual([{ answer: 'Actualizada' }])
    expect((await t.as(B, `select * from public.vision_board_entries`)).rows).toHaveLength(0)
  })

  it('al borrar una meta, la imagen asociada se conserva sin asociación', async () => {
    const img = (await t.as<{ id: string }>(A, `insert into public.vision_board_images (storage_path, goal_id) values ('${A}/foto.jpg', $1) returning id`, [goalId])).rows[0]!
    await t.as(A, `delete from public.goals where id = $1`, [goalId])
    const row = (await t.as<{ goal_id: string | null }>(A, `select goal_id from public.vision_board_images where id = $1`, [img.id])).rows[0]!
    expect(row.goal_id).toBeNull()
    expect((await t.as(A, `select * from public.habits`)).rows).toHaveLength(0) // hábitos borrados en cascada
  })

  it('no permite registrar imágenes fuera de la carpeta propia', async () => {
    await expect(t.as(A, `insert into public.vision_board_images (storage_path) values ('${B}/x.jpg')`)).rejects.toThrow(
      /vision_images_path_owner/,
    )
  })
})

describe('eliminación de cuenta', () => {
  it('borrar el usuario elimina todos sus datos', async () => {
    await t.db.query(`delete from auth.users where id = $1`, [A])
    for (const table of ['profiles', 'goals', 'vision_board_images', 'vision_board_entries']) {
      expect((await t.db.query(`select * from public.${table} where ${table === 'profiles' ? 'id' : 'user_id'} = $1`, [A])).rows).toHaveLength(0)
    }
  })
})
