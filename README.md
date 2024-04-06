# next-action (beta)

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

## Why?

Server actions are great but have some caveats on NextJS:

- Cannot be intercepted by middlewares
- Cannot throw errors

And as any other API endpoint the user input needs to be validated.

## Usage

```ts
// lib/actions.ts
import { createServerActionProvider } "next-action/server";

export const publicAction = createServerActionProvider({
  mapError,
});

export const authAction = createServerActionProvider({
  mapError,
  async onBeforeExecute() {
    const session = await getSession();

    if (!session) {
        redirect("/login")
    }

    return userSession;
  },
});
```

```ts
// lib/actions/users.tsx
'use server';

export const createUser = authAction(
  async ({ input }) => {
    await db.insert(users).values(input);
    return { id: Math.ceil(Math.ramdom() * 10000), ...input };
  },
  {
    // Validate takes any function with a `parse` method,
    // so you can bring any validation library or do your own validation
    validate: z.object({
      email: z.string(),
      username: z.string(),
    }),
  }
);
```

```ts
// app/users.tsx
'use client';
function CreateUser() {
  const { execute, isExecuting, isError, isSuccess, data, error } = useAction(
    createUser,
    {
      onSuccess(data) {
        //
      },
      onError(err) {
        //
      },
      onSettled(result) {},
    }
  );

  //
}
```

`next-action` Can also be used with forms

```ts
'use server';

export const updateUser = authAction.formAction(
  async ({ input }) => {
    await db.update(users).set(input).where(eq(users.id, input.id));
  },
  {
    validate: z.object({
      id: z.nunmber(),
      email: z.string(),
      username: z.string(),
    }),
  }
);
```

```ts
// app/update-user.tsx
export function UpdateUserPage() {
    return <form action={updateUser}>
        <input type="hidden" value={user.id}/>
        <input type="email" value={user.email}/>
        <input type="username" value={user.username}/>
        <button>Update</button>
    </form>
}
```

If you want to get feedback from your `formAction` use the `useFormAction` hook.
```ts
const [action, { isExecuting, isSuccess, isError, error, data, status }] = useFormAction(updateUser, {
    onSuccess(data) {
        //
    },
    onError(error) {
        //
    },
    onSettled(result) {

    }
});
```

In case is needed you can call your formAction in a typed manner using the `action` method, `updateUser.action(...)`.

## Testing

Currently for test server actions is neccesary to expose them in an API endpoint, we serialize and deserialize the values
in a similar way react does to ensure the same behavior.

```ts
// api/testactions/[[...testaction]]/route.ts
import { exposeServerActions } from "next-action/testing/server";

const handler = exposeServerActions({ createUser, updateUser });
export type TestActions = typeof handler.actions;
export const POST = handler;
```

> You should set the `EXPOSE_SERVER_ACTIONS` environment variable to expose the endpoint.

And on your testing side
```ts
import { createServerActionClient } from "next-action/testing/client";

beforeAll(() => {
    // Start your nextjs serer
})

test("Should create user", async () => {
    const client = createServerActionClient<TestActions>("http://localhost:3000/api/testactions");
    const result = await client.createUser({ email: "test@test.com", username: "test" });
    expect(result.success).toBeTruthy();
})
```

## See also these libraries that inspired `next-action`

- https://github.com/TheEdoRan/next-safe-action
