interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  ariaLabel?: string;
}

export default function Sparkline({
  values,
  width = 120,
  height = 28,
  color = "#5A7E6B",
  ariaLabel = "tendance",
}: SparklineProps) {
  if (!values.length) {
    return <span className="text-elsai-ink/40 text-xs">—</span>;
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const d = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={ariaLabel}
      className="inline-block align-middle"
    >
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
