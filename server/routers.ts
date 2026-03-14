import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { verifyLineSignature, handleLineWebhook } from "./line-bot";

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

  lineBot: router({
    webhook: publicProcedure
      .input(
        z.object({
          body: z.object({
            events: z.array(z.record(z.string(), z.any())),
          }),
          signature: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // ตรวจสอบ signature
        const bodyString = JSON.stringify(input.body);
        if (!verifyLineSignature(bodyString, input.signature)) {
          return { success: false, error: "Invalid signature" };
        }

        // จัดการ webhook events
        try {
          await handleLineWebhook(input.body as any);
          return { success: true };
        } catch (error) {
          console.error("[LINE] Error handling webhook:", error);
          return { success: false, error: "Internal server error" };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
