import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { searchRestaurants, getWeather, requestConfirmation } from "./flowvoice/tools";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  tools: router({
    restaurants: publicProcedure.input(z.object({ location: z.string().min(1), dietary: z.string().optional(), budget: z.string().optional(), rating: z.string().optional(), openNow: z.boolean().optional() })).query(({ input }) => searchRestaurants(input)),
    weather: publicProcedure.input(z.object({ location: z.string().min(1) })).query(({ input }) => getWeather(input.location)),
    requestConfirmation: publicProcedure.input(z.object({ action: z.string().min(1), summary: z.string().min(1) })).mutation(({ input }) => requestConfirmation(input.action, input.summary)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
