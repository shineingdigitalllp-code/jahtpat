"use client";

import { useState } from "react";

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5 shrink-0">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5 shrink-0 fill-ink">
      <path d="M16.4 12.7c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.7-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.5 1.3 0 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4ZM13.9 5.1c.7-.9 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4Z" />
    </svg>
  );
}

const PROVIDERS = [
  { name: "Google", icon: GoogleIcon },
  { name: "Apple", icon: AppleIcon },
];

export function SocialAuthButtons() {
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center gap-4 text-xs font-medium text-muted">
        <span className="h-px flex-1 bg-ink/15" />
        OR
        <span className="h-px flex-1 bg-ink/15" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {PROVIDERS.map(({ name, icon: Icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => setNotice(`${name} sign-in is coming soon. Please use your mobile number for now.`)}
            aria-label={`Continue with ${name}`}
            className="@container h-13 min-w-0 rounded-2xl border border-white/70 bg-surface/80 px-2 shadow-card backdrop-blur-md transition duration-200 hover:border-ink/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2 text-[0.8125rem] font-semibold whitespace-nowrap">
              <Icon />
              <span>
                <span className="hidden @[10.25rem]:inline">Continue with </span>
                {name}
              </span>
            </span>
          </button>
        ))}
      </div>
      {notice && (
        <p role="status" className="mt-3 text-center text-xs text-muted">
          {notice}
        </p>
      )}
    </div>
  );
}
