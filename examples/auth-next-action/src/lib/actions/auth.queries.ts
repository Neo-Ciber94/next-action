import { cookies } from "next/headers";
import { cache } from "react";
import { COOKIE_JWT_TOKEN } from "../constants";
import { decodeJwt } from "../jwt";
import { z } from "zod";
import { prisma } from "../db";

const SessionSchema = z.object({
  userId: z.coerce.number(),
});

export type Session = z.infer<typeof SessionSchema>;

export type User = NonNullable<Awaited<ReturnType<typeof getUser>>>;

export const getSession = cache(async () => {
  const jwt = cookies().get(COOKIE_JWT_TOKEN)?.value;

  if (!jwt) {
    return null;
  }

  const payload = await decodeJwt(jwt);
  const result = SessionSchema.safeParse(payload);
  return result.success ? result.data : null;
});

export const getUser = cache(async () => {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      username: true,
    },
  });

  if (!user) {
    return null;
  }

  return user;
});
