"use server";
import { z } from "zod";
import { authAction, publicAction } from "../action";
import { prisma } from "../db";
import { type Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { encodeJwt } from "../jwt";
import { cookies } from "next/headers";
import { COOKIE_JWT_TOKEN } from "../constants";
import { type Session } from "./auth.queries";
import { ActionError } from "next-action";
import { revalidatePath } from "next/cache";

const RegisterUserSchema = z.object({
  username: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().trim().min(4),
  likesCoffee: z.coerce.boolean().default(false),
  secretNumber: z.coerce.number().min(-100).max(100),
});

export const registerUser = publicAction.formAction(
  async ({ input }) => {
    const userNameAlreadyExists = await prisma.user
      .count({ where: { username: input.username } })
      .then((x) => x > 0);

    if (userNameAlreadyExists) {
      throw new ActionError("Username taken");
    }

    const emailAlreadyExists = await prisma.user
      .count({ where: { email: input.email } })
      .then((x) => x > 0);

    if (emailAlreadyExists) {
      throw new ActionError("Email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const data: Prisma.UserCreateInput = {
      email: input.email,
      username: input.username,
      secretNumber: input.secretNumber,
      likesCoffee: input.likesCoffee,
      passwordHash,
    };

    const result = await prisma.user.create({ data });

    // Set auth token
    const jwt = await encodeJwt<Session>({ userId: result.id });
    cookies().set(COOKIE_JWT_TOKEN, jwt);

    // Redirect to profile
    redirect("/");
  },
  {
    validator: RegisterUserSchema,
  },
);

const UpdateUserSchema = RegisterUserSchema.pick({
  username: true,
  likesCoffee: true,
  secretNumber: true,
});

export const updateUser = authAction.formAction(
  async ({ input, context: { session } }) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const userNameAlreadyExists = await prisma.user
      .count({
        where: {
          username: input.username,
          NOT: { id: session.userId },
        },
      })
      .then((x) => x > 0);

    if (userNameAlreadyExists) {
      throw new ActionError("Username taken");
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        username: input.username,
        likesCoffee: input.likesCoffee,
        secretNumber: input.secretNumber,
      },
    });

    revalidatePath("/");
    redirect("/");
  },
  {
    validator: UpdateUserSchema,
  },
);

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const INVALID_CREDENTIALS_ERROR = "Invalid email or password";

export const loginUser = publicAction.formAction(
  async ({ input }) => {
    const user = await prisma.user.findFirst({ where: { email: input.email } });

    if (!user) {
      throw new ActionError(INVALID_CREDENTIALS_ERROR);
    }

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);

    if (!validPassword) {
      throw new ActionError(INVALID_CREDENTIALS_ERROR);
    }

    // Set auth token
    const jwt = await encodeJwt<Session>({ userId: user.id });
    cookies().set(COOKIE_JWT_TOKEN, jwt);

    // Redirect to profile
    redirect("/");
  },
  {
    validator: LoginSchema,
  },
);

export const logoutUser = authAction(async () => {
  cookies().delete(COOKIE_JWT_TOKEN);
  redirect("/login");
});
