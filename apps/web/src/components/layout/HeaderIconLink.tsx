import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";

type HeaderIconLinkProps = { href: string; label: string; icon: LucideIcon; count?: number };

export function HeaderIconLink({ href, label, icon: Icon, count = 0 }: HeaderIconLinkProps) {
  return (
    <Link
      href={href}
      aria-label={count > 0 ? `${label}, ${count}` : label}
      className={buttonClass({ variant: "glass", size: "icon", className: "relative" })}
    >
      <Icon aria-hidden className="size-5" />
      {count > 0 && (
        <Badge variant="count" className="absolute top-1 right-1">
          {count > 9 ? "9+" : count}
        </Badge>
      )}
    </Link>
  );
}
