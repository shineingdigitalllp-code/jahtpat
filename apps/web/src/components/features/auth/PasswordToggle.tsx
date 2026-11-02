import { Eye, EyeOff } from "lucide-react";

export function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
      className="grid size-12 shrink-0 place-items-center rounded-r-2xl text-ink/70 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary"
    >
      {visible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
    </button>
  );
}
