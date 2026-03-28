import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { webSearchProcedure } from "./routes/search/web/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  search: createTRPCRouter({
    web: webSearchProcedure,
  }),
});

export type AppRouter = typeof appRouter;
