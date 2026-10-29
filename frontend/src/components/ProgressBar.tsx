
interface ProgressBarProps {
  label: string;
  value: number;
}

export default function ProgressBar({
  label,
  value,
}: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">
          {percentage}%
        </span>
      </div>

      <div
        className="h-2.5 overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-red-600 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
