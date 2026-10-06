export default function AgentOwnerBadge({ name, studentId, color = "blue" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    amber: "bg-amber-100 text-amber-800 border-amber-300",
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-300",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-300"
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-3 py-1 rounded-full border ${colors[color]}`}>
      👤 Owner: {name} · {studentId}
    </span>
  );
}
