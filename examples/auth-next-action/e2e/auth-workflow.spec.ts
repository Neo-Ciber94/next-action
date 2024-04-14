import { test, expect, type Page } from "@playwright/test";
import { createServerActionClient } from "next-action/testing/client";
import { E2E_BASE_URL } from "../playwright.config";
import { type TestActions } from "@/app/api/testactions/[...testactions]/route";
import cookie from "cookie";
import { COOKIE_JWT_TOKEN } from "@/lib/constants";

function randomUser() {
  const username = btoa(crypto.randomUUID()) + "-test";
  const email = `${username}@test.com`;
  return { username, email };
}

test.describe("Auth server actions", () => {
  test("Should call login server action", async ({ page }) => {
    await page.goto("/");

    const client = createServerActionClient<TestActions>(`${E2E_BASE_URL}/api/testactions`);
    const { username, email } = randomUser();
    const registerRes = await client.registerUser(
      createFormData({
        username,
        email,
        password: "pass123",
        likesCoffee: "on",
        secretNumber: "99",
      }),
    );

    expect(registerRes.redirected).toBeTruthy();

    const loginUserRes = await client.loginUser(
      createFormData({
        email,
        password: "pass123",
      }),
    );

    expect(loginUserRes.redirected).toBeTruthy();
    await expectCanGoToProfile(page, loginUserRes.headers);
  });

  test("Should call update server action", async ({ page }) => {
    await page.goto("/");

    const requestCookies: Record<string, string> = {};

    const client = createServerActionClient<TestActions>(`${E2E_BASE_URL}/api/testactions`, {
      cookies() {
        return requestCookies;
      },
    });

    const { username, email } = randomUser();
    const registerRes = await client.registerUser(
      createFormData({
        username,
        email,
        password: "pass123",
        likesCoffee: "on",
        secretNumber: "60",
      }),
    );

    expect(registerRes.redirected).toBeTruthy();
    const responseCookies = parseSetCookie(registerRes.headers);
    const authSessionCookie = responseCookies.find((x) => x.name === COOKIE_JWT_TOKEN);

    expect(authSessionCookie).toBeDefined();
    requestCookies[COOKIE_JWT_TOKEN] = authSessionCookie!.value;

    const updateRes = await client.updateUser(
      createFormData({
        username,
        likesCoffe: "",
        secretNumber: "20",
      }),
    );

    expect(updateRes.redirected).toBeTruthy();

    const user = await client.getUser().then((x) => x.json());
    expect(user).toEqual(
      expect.objectContaining({
        email,
        username,
        likesCoffee: false,
        secretNumber: 20,
      }),
    );
  });

  test("Should call logout server action", async ({ page }) => {
    await page.goto("/");

    const client = createServerActionClient<TestActions>(`${E2E_BASE_URL}/api/testactions`);
    const { username, email } = randomUser();
    const registerRes = await client.registerUser(
      createFormData({
        username,
        email,
        password: "pass123",
        likesCoffee: "on",
        secretNumber: "60",
      }),
    );

    expect(registerRes.redirected).toBeTruthy();

    const logoutRes = await client.logoutUser();
    expect(logoutRes.redirected).toBeTruthy();
  });
});

async function expectCanGoToProfile(page: Page, headers: Headers) {
  await test.step("Ensure is authenticated", async () => {
    const responseCookies = parseSetCookie(headers);
    const authSessionCookie = responseCookies.find((x) => x.name === COOKIE_JWT_TOKEN);
    expect(authSessionCookie).toBeDefined();
    await page.context().addCookies([authSessionCookie!]);
    await page.goto("/");
    await expect(page).toHaveURL("/");
  });
}

function createFormData(obj: Record<string, string>) {
  const formData = new FormData();

  for (const [name, value] of Object.entries(obj)) {
    formData.set(name, value);
  }

  return formData;
}

function parseSetCookie(headers: Headers) {
  return headers
    .getSetCookie()
    .map((c) => cookie.parse(c))
    .flatMap((c) => Object.entries(c))
    .map(([name, value]) => ({ name, value, path: "/", domain: "localhost" }));
}
