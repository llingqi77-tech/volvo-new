import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import {
  RADAR_TIER_MAX,
  radarChartLabels,
  radarValuesToTiers,
  sumRadarTiers,
} from '../utils/personaDisplay';

type RadarRow = { subject: string; value: number; fullMark: number };
const PRIMARY_HEX = '#1bff1b';
const RADAR_LABEL_COLOR = 'var(--radar-axis-label-color, #d1d5db)';
const RADAR_RADIUS_TICK_COLOR = 'var(--radar-radius-tick-color, #e5e7eb)';

function RadarAngleTick(props: {
  x?: number;
  y?: number;
  textAnchor?: string;
  index?: number;
  radarData: RadarRow[];
}) {
  const { x = 0, y = 0, textAnchor = 'middle', index = 0, radarData } = props;
  const row = radarData[index];
  const label = row?.subject ?? '';
  const tier = row?.value ?? 0;
  return (
    <text x={x} y={y} textAnchor={textAnchor} className="recharts-text recharts-polar-angle-axis-tick-value">
      <tspan x={x} dy="-0.45em" fill={RADAR_LABEL_COLOR} fontSize={11}>
        {label}
      </tspan>
      <tspan x={x} dy="1.15em" fill={PRIMARY_HEX} fontSize={12} fontWeight={700}>
        {tier} 分
      </tspan>
    </text>
  );
}

export function PersonaRadarChart({
  radar,
  className = '',
  chartHeightClass = 'h-[420px] min-h-[320px]',
}: {
  radar: number[];
  className?: string;
  chartHeightClass?: string;
}) {
  const tiers = radarValuesToTiers(radar);
  const radarData: RadarRow[] = radarChartLabels.map((subject, idx) => ({
    subject,
    value: tiers[idx] ?? 0,
    fullMark: RADAR_TIER_MAX,
  }));
  const total = sumRadarTiers(tiers);

  return (
    <div className={className}>
      <p className="mb-2 text-xs leading-relaxed text-gray-400">
        七维合计{' '}
        <span className="font-bold text-primary tabular-nums">
          {total} / {radarChartLabels.length * RADAR_TIER_MAX}
        </span>
      </p>
      <div className={`min-w-0 ${chartHeightClass}`}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
          <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData} startAngle={90} endAngle={-270}>
            <PolarGrid stroke="rgba(27, 255, 27, 0.35)" />
            <PolarAngleAxis
              dataKey="subject"
              tickLine={false}
              tick={(tickProps) => <RadarAngleTick {...tickProps} radarData={radarData} />}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, RADAR_TIER_MAX]}
              ticks={[0, 1, 2, 3]}
              tick={{ fill: RADAR_RADIUS_TICK_COLOR, fontSize: 10 }}
              axisLine={false}
            />
            <Radar
              name="维度分"
              dataKey="value"
              stroke={PRIMARY_HEX}
              fill="rgba(27, 255, 27, 0.34)"
              fillOpacity={1}
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#d9ffe0', stroke: PRIMARY_HEX, strokeWidth: 1.2 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
