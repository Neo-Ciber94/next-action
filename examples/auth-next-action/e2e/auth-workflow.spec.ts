import { test, expect } from "@playwright/test";
import { createServerActionClient } from "next-action/testing/client";
import { E2E_BASE_URL } from "../playwright.config";
import { type TestActions } from "@/app/api/testactions/[...testactions]/route";

test.describe("Auth server actions", () => {
  test("Should perform auth workflow with server actions", async ({ page }) => {
    const client = createServerActionClient<TestActions>(`${E2E_BASE_URL}/api/testactions`);

    await client.registerUser(
      createFormData({
        username: "Ayaka",
        email: "ayaka@test.com",
        password: "pass123",
        likesCoffee: "on",
        secretNumber: "99",
      }),
    );

    await client.loginUser(
      createFormData({
        email: "ayaka@test.com",
        password: "pass123",
      }),
    );

    await page.goto("/");
    await expect(page).toHaveURL("/");
  });
});

function createFormData(obj: Record<string, string>) {
  const formData = new FormData();

  for (const [name, value] of Object.entries(obj)) {
    formData.set(name, value);
  }

  return formData;
}
