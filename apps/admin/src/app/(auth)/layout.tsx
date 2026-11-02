import { Suspense, type ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-canvas p-4 sm:p-6">
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  );
}

