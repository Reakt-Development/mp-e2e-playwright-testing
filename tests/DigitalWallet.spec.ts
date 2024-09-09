import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/buyer");

  // navigate to Digital Wallet
  await page.getByTestId("wallet").click();
  await page.getByTestId("Digital Wallet").click();
});

test.describe("Digital Wallet", () => {
  test("1 Allow users to add funds using different payment methods", async ({
    page,
  }) => {
    // add funds using bank transfer
    await page.getByTestId("savingaddfunds").click();
    await page.getByTestId("localbanktransfer").click();
    await page.getByTestId("addfundamount").fill("10");
    await page.getByTestId("addfundcontinue").click();

    await expect(
      page.getByTestId("addfundtransactionsuccessmessage")
    ).toBeVisible();

    await expect(
      page.getByTestId("addfundtransactionsuccessmessage")
    ).toHaveText("Your transaction has been submitted.");
  });

  test("2 Prevents adding negative funds", async ({ page }) => {
    // add negative funds using bank transfer
    await page.getByTestId("savingaddfunds").click();
    await page.getByTestId("localbanktransfer").click();
    await page.getByTestId("addfundamount").fill("-1");
    await page.getByTestId("addfundcontinue").click();

    // Listen for the dialog event to check failed transaction
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toBe("The amount should not be less than 0");
      dialog.accept();
    });
  });

  test("3. Prevents adding funds greater than 10,000,000", async ({ page }) => {
    // add funds greater than 10,000,000
    await page.getByTestId("savingaddfunds").click();
    await page.getByTestId("localbanktransfer").click();
    await page.getByTestId("addfundamount").fill("10000001");
    await expect(page.getByTestId("addfundamount")).toHaveValue("10000000");
  });

  test("4. Process transactions and update transaction history", async ({
    page,
  }) => {
    const amount = "1";
    let lastRefId;
    let newRefId;
    // navigate to Activity
    await page.getByTestId("savingsactionActivity").click();

    // wait for API response to ge`t the last ref ID
    const responsePromiseLastRef = page.waitForResponse(
      `${process.env.STAGING_WALLET_API_URL}/v1/buyer-transactions?page=1&search=`
    );

    const responseLastRef = await responsePromiseLastRef;
    await responseLastRef.body().then(async (body) => {
      lastRefId = await JSON.parse(body.toString()).data[0].id;
      console.log({ lastRefId: lastRefId });
    });

    // add funds using bank transfer
    await page.locator(".bg-black").click();
    await page.getByTestId("wallet").click();
    await page.getByTestId("Digital Wallet").click();
    await page.getByTestId("savingaddfunds").click();
    await page.getByTestId("localbanktransfer").click();
    await page.getByTestId("addfundamount").fill(amount);
    await page.getByTestId("addfundcontinue").click();

    await page.waitForTimeout(5000);

    // navigate to Activity
    await page.getByTestId("sidebarback").click();
    await page.getByTestId("savingsactionActivity").click();
    await page.getByTestId(`activityreference${lastRefId}`).click();

    // wait for API response to ge`t the new ref ID
    const responsePromiseNewRef = page.waitForResponse(
      `${process.env.STAGING_WALLET_API_URL}/v1/buyer-transactions?page=1&search=`,
      { timeout: 60000 }
    );

    const responseNewRef = await responsePromiseNewRef;
    await responseNewRef.body().then(async (body) => {
      newRefId = await JSON.parse(body.toString()).data[0].id;
      console.log({ newRefId: newRefId });
    });

    await page.getByTestId(`activityreference${newRefId}`).isVisible();

    await page.getByTestId(`activityreference${lastRefId}`).isVisible();

    await expect(
      page.getByTestId(`activityreference${newRefId}`)
    ).not.toContainText(lastRefId);

    expect(lastRefId).not.toEqual(newRefId);
  });
});
