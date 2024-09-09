import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("Authenticate User", async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto("/buyer/login");

  // fill login form
  await page.getByTestId("loginemail").fill(process.env.BUYER_USERNAME ?? "");
  await page
    .getByTestId("loginpassword")
    .fill(process.env.BUYER_PASSWORD ?? "");
  await page.getByTestId("signinbutton").click();
  await page.getByTestId("2facodefield").fill(process.env.BUYER_OTP ?? "");
  await page.getByTestId("signinbutton").click();
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL("/buyer");
  // Alternatively, you can wait until the page reaches a state where all cookies are set.
  await expect(page.getByTestId("wallet")).toBeVisible();

  // End of authentication steps.

  await page.context().storageState({ path: authFile });
});
