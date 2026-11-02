import { useRouter } from "next/navigation";

export function useGoBack(fallback = "/") {
  const router = useRouter();
  return () => (window.history.length > 1 ? router.back() : router.push(fallback));
}
