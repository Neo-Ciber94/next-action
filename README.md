# next-action

[![CI][ci-badge]][ci-link] [![npm version][npm-badge]][npm-link] [![Bundle Size][size-badge]][size-link] <a href="https://neo-ciber94.github.io/next-action/" target="_blank"><img src="https://img.shields.io/badge/next_action-docs-blue"/></a>

[ci-badge]: https://github.com/Neo-Ciber94/next-action/actions/workflows/ci.yml/badge.svg
[ci-link]: https://github.com/Neo-Ciber94/next-action/actions/workflows/ci.yml
[npm-badge]: https://badge.fury.io/js/next-action.svg
[npm-link]: https://badge.fury.io/js/next-action
[size-badge]: https://pkg-size.dev/badge/bundle/54
[size-link]: https://pkg-size.dev/next-action
<!-- [docs-badge]: https://img.shields.io/badge/next_action-docs-blue
[docs-link]: https://neo-ciber94.github.io/next-action/ -->

Provides a centralized way to call your server actions.

## Installation

```bash
npm install next-action
```

```bash
yarn add next-action
```

```bash
pnpm add next-action
```

## API Docs

https://neo-ciber94.github.io/next-action

## Why?

Server actions are great but have some caveats on NextJS:

- Cannot be intercepted by middlewares
- Cannot throw errors

And as any other API endpoint the user input needs to be validated.

`next-action` provide an API to easily validate, throw errors and add middlewares to your server actions.

## Table of contents

- [Usage](#usage)
- [Using Form Actions](#using-form-actions)
- [Throwing Errors](#throwing-errors)
- [Map errors](#map-errors)
- [Context](#context)
- [Middleware](#middlewares)
  - [Before server action](#before-server-action)
  - [After server action](#after-server-action)
- [Testing Server Actions](#testing)

## Usage

```ts
// lib/action.ts
import { createServerActionProvider } "next-action/server";

export const publicAction = createServerActionProvider();
```

```ts
// lib/actions/api.ts
"use server";

// Any object that have a `parse` method can be used as validator
const schema = z.object({
  title: z.string(),
  content: z.string(),
});

export const createPost = publicAction(
  async ({ input }) => {
    const postId = crypto.randomUUID();
    await db.insert(posts).values({ postId, ...input });
    return { postId };
  },
  {
    validate: schema,
  },
);
```

You can call the `createPost` directly client and server side as any other server action.
Client side you can also use `useAction` or `useFormAction` which allow you to track the `loading`, `error` and `success` state
of the server action.

```tsx
// app/create-post/page.tsx
"use client";

import { useAction } from "next-action/react";

export default function CreatePostPage() {
  const { execute, data, error, status, isExecuting, isError, isSuccess } = useAction(createPost, {
    onSuccess(data) {
      //
    },
    onError(error) {
      //
    },
    onSettled(result) {
      //
    },
  });

  return <>{/* Create post form */}</>;
}
```

## Using form actions

You can also define and call server actions that accept a form, you define the actions using `formAction` on your action provider.

```ts
'use server';

const schema = z.object({
  postId: z.string()
  title: z.string(),
  content: z.string(),
});

export const updatePost = publicAction.formAction(
  async ({ input }) => {
    await db.update(posts)
      .values({ postId, ...input })
      .where(eq(input.postId, posts.id))

    return { postId };
  },
  {
    validate: schema,
  },
);
```

`updatePost` will have the form: `(input: FormData) => ActionResult<T>`, so you can use it in any form.

```tsx
// app/update-post/page.tsx
"use client";

export default function UpdatePostPage() {
  return (
    <form action={updatePost}>
      <input name="postId" />
      <input name="title" />
      <input name="content" />
    </form>
  );
}
```

To track the progress of a form action client side you use the `useFormAction` hook.

```ts
const { action, data, error, status, isExecuting, isError, isSuccess } = useFormAction(updatePost, {
  onSuccess(data) {
    //
  },
  onError(error) {
    //
  },
  onSettled(result) {
    //
  },
});
```

Then you can use the returned `action` on your `<form action={...}>`.

## Throwing errors

You can throw any error in your server actions, those errors will be send to the client on the result.

```ts
// lib/actions/api.ts
"use server";

import { ActionError } from "next-action";

export const deletePost = publicAction(async ({ input }) => {
  throw new ActionError("Failed to delete post");
});
```

We recommend using `ActionError` for errors you want the client to receive.

## Map errors

For sending the errors to the client you need to map the error to other type, by default we map it to `string`,
you map your errors in the `createServerActionProvider`.

```ts
import { defaultErrorMapper } from "next-action/utils";

export const publicAction = createServerActionProvider({
  mapError(err: any) {
    // You need to manage manually your validation errors
    if (err instanceof ZodError) {
      return err.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");
    }

    // Use the default mappinh to string
    return defaultErrorMapper(err);
  },
});
```

## Context

You can also set a context that all your server actions will have access to.

```ts
// lib/action.ts
import { createServerActionProvider } "next-action/server";

export const action = createServerActionProvider({
  context() {
    return { db }
  }
});
```

The context will be created each time the server action is called, after that you can access the context values on your server actions.

```ts
// lib/actions/api.ts
const schema = z.object({ postId: z.string() });

export const deletePost = action(
  async ({ input, context }) => {
    return context.db.delete(posts).where(eq(input.postId, posts.id));
  },
  {
    validator: schema,
  },
);
```

## Middlewares

You can run a middleware before and after running your server actions.

### Before server action

```ts
import { createServerActionProvider } "next-action/server";

export const authAction = createServerActionProvider({
  async onBeforeExecute({ input, context  }) {
    const session = await getSession();

    if (!session) {
      throw new ActionError("Unauthorized")
    }

    return { ...context, session }
  }
});
```

You can access the new context on all your actions.

```ts
// lib/actions/api.ts
const schema = z.object({
  postId: z.string(),
  title: z.string(),
  content: z.string(),
});

export const createPost = authAction(async ({ input, context }) => {
  await db.insert(users).values({ ...input, userId: context.session.userId });
}, {
  validator:
})
```

### After server action

```ts
import { createServerActionProvider } "next-action/server";

export const authAction = createServerActionProvider({
  onBeforeExecute({ input }) {
    return { startTime: Date.now() }
  },
  onAfterExecute({ context }) {
    const elapsed = Date.now() - context.startTime;
    console.log(`Server action took ${elapsed}ms`);
  }
});
```

## Testing Server Actions

Currently for test server actions is necessary to expose them as API endpoints, we serialize and deserialize the values
in a similar way react does to ensure the same behavior.

```ts
// api/testactions/[[...testaction]]/route.ts
import { exposeServerActions } from "next-action/testing/server";

const handler = exposeServerActions({ createPost });
export type TestActions = typeof handler.actions;
export const POST = handler;
```

> You should set the `EXPOSE_SERVER_ACTIONS` environment variable to expose the endpoints.

And on your testing side

```ts
import { createServerActionClient } from "next-action/testing/client";

beforeAll(() => {
  // Start your nextjs server
});

test("Should create post", async () => {
  const client = createServerActionClient<TestActions>("http://localhost:3000/api/testactions");
  const result = await client.createPost({ title: "Post 1", content: "This is my first post" });
  expect(result.success).toBeTruthy();
});
```

## See also these libraries that inspired `next-action`

- https://github.com/TheEdoRan/next-safe-action
- https://github.com/trpc/trpc
