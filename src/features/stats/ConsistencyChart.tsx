import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { Table2, LineChart as LineChartIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Granularity, SeriesPoint } from '@/domain/stats'
import { formatPercent } from '@/domain/progress'
import { capitalize, formatEs } from '@/lib/dates'
import { useTheme } from '@/lib/theme'

/**
 * Lee un token de color del sistema de diseño (los atributos SVG no siempre aceptan var()).
 * Se vuelve a leer al cambiar entre modo claro y oscuro.
 */
function useCssVar(name: string, fallback: string): string {
  const { resolved } = useTheme()
  const [value, setValue] = useState(fallback)
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    if (v) setValue(v)
  }, [name, resolved])
  return value
}

interface ChartDatum extends SeriesPoint {
  label: string
}

function pointLabel(p: SeriesPoint, granularity: Granularity, compact: boolean): string {
  if (granularity === 'semana') return formatEs(p.date, 'd MMM').replace('.', '')
  return compact ? formatEs(p.date, 'EEEEE d') : formatEs(p.date, 'd')
}

function pointTitle(p: SeriesPoint, granularity: Granularity): string {
  if (granularity === 'semana') {
    return p.date === p.end
      ? capitalize(formatEs(p.date, "EEEE d 'de' MMMM"))
      : `${formatEs(p.date, "d 'de' MMM")} – ${formatEs(p.end, "d 'de' MMM")}`.replace(/\./g, '')
  }
  return capitalize(formatEs(p.date, "EEEE d 'de' MMMM"))
}

function pointValue(p: SeriesPoint): string {
  if (p.rate === null) return 'Sin hábitos que evaluar'
  return `${p.completed} de ${p.scheduled} (${formatPercent(p.rate)})`
}

function ChartTooltip({ active, payload, granularity }: TooltipContentProps<number, string> & { granularity: Granularity }) {
  const datum = payload?.[0]?.payload as ChartDatum | undefined
  if (!active || !datum) return null
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lifted">
      <p className="font-semibold">{pointTitle(datum, granularity)}</p>
      <p className="mt-0.5 text-muted-foreground">{pointValue(datum)}</p>
    </div>
  )
}

export function ConsistencyChart({ series, granularity }: { series: SeriesPoint[]; granularity: Granularity }) {
  const [asTable, setAsTable] = useState(false)
  const line = useCssVar('--chart-line', '#5670ff')
  const grid = useCssVar('--chart-grid', '#e8ebf5')
  const muted = useCssVar('--muted-foreground', '#646a80')
  const surface = useCssVar('--card', '#ffffff')

  const compact = granularity === 'dia' && series.length <= 7
  const data: ChartDatum[] = series.map((p) => ({ ...p, label: pointLabel(p, granularity, compact) }))
  const showDots = data.length <= 14
  const evaluated = data.filter((d) => d.rate !== null)
  const summary = evaluated.length
    ? `Constancia ${granularity === 'dia' ? 'diaria' : 'semanal'}: ${evaluated.map((d) => `${pointTitle(d, granularity)} ${Math.round(d.rate!)}%`).join('; ')}`
    : 'Sin datos'

  return (
    <div>
      <div className="mb-1 flex justify-end">
        <Button variant="ghost" size="sm" className="min-h-11 text-muted-foreground" onClick={() => setAsTable((v) => !v)}>
          {asTable ? <LineChartIcon className="size-4" /> : <Table2 className="size-4" />}
          {asTable ? 'Ver gráfico' : 'Ver tabla'}
        </Button>
      </div>

      {asTable ? (
        <div className="max-h-72 overflow-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">{granularity === 'dia' ? 'Día' : 'Semana'}</th>
                <th className="px-3 py-2 text-right font-medium">Completados</th>
                <th className="px-3 py-2 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.date} className="border-t border-border">
                  <td className="px-3 py-2">{pointTitle(d, granularity)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.rate === null ? '—' : `${d.completed} de ${d.scheduled}`}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.rate === null ? '—' : formatPercent(d.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div role="img" aria-label={summary} className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke={grid} strokeWidth={1} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: muted, fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={12}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 50, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tickLine={false}
                axisLine={false}
                tick={{ fill: muted, fontSize: 11 }}
                width={44}
              />
              <Tooltip
                cursor={{ stroke: muted, strokeWidth: 1 }}
                content={(props) => <ChartTooltip {...(props as TooltipContentProps<number, string>)} granularity={granularity} />}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke={line}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={line}
                fillOpacity={0.1}
                connectNulls={false}
                isAnimationActive={false}
                dot={showDots ? { r: 4, fill: line, stroke: surface, strokeWidth: 2 } : false}
                activeDot={{ r: 5, fill: line, stroke: surface, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
