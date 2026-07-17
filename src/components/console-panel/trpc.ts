import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/api";

export const trpc = createTRPCReact<AppRouter>();

export function createClient() {
  return trpc.createClient({ links: [httpBatchLink({ url: "/api/trpc" })] });
}
