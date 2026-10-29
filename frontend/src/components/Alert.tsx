
interface AlertProps {
  message: string;
  type?: "error" | "success" | "info";
}

const styles = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-green-200 bg-green-50 text-green-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export default function Alert({
  message,
  type = "info",
}: AlertProps) {
  return (
    <div
      className={`rounded-xl border p-4 text-sm ${styles[type]}`}
      role={type === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}
