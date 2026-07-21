import { httpBatchLink, httpSubscriptionLink, splitLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/api";

export const trpc = createTRPCReact<AppRouter>();

export function createClient() {
  return trpc.createClient({
    links: [
      splitLink({
        condition: (op) => op.type === "subscription",
        true: httpSubscriptionLink({ url: "/api/trpc" }),
        false: httpBatchLink({ url: "/api/trpc" }),
      }),
    ],
  });
}
