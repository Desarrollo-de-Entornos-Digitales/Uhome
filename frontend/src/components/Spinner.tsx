
interface SpinnerProps {
  message?: string;
}

export default function Spinner({
  message = "Cargando información...",
}: SpinnerProps) {
  return (
    <div
      className="flex items-center justify-center gap-3 py-10 text-gray-600"
      role="status"
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
      <span>{message}</span>
    </div>
  );
}
