import { expect, test } from "@playwright/test";
import { mockElsaiApi } from "./fixtures/api-mock";

test.describe("Chat anonyme — envoi et réception", () => {
  test("envoi message, réception réponse, pas de cookie identifiant", async ({ page, context }) => {
    await mockElsaiApi(page, [
      { reply: "Bonjour, comment puis-je vous aider ?", danger_detected: false },
    ]);

    await page.goto("/chat");
    await page.getByPlaceholder(/Décrivez votre situation/i).fill("bonjour");
    await page.getByRole("button", { name: "Envoyer" }).click();

    await expect(page.getByText("Bonjour, comment puis-je vous aider ?")).toBeVisible();

    const cookies = await context.cookies();
    const identifying = cookies.filter((c) => /user|email|name|identity/i.test(c.name));
    expect(identifying).toHaveLength(0);
  });

  test("bouton Oubli purge sessionStorage", async ({ page }) => {
    await mockElsaiApi(page, [{ reply: "Réponse test" }]);

    await page.goto("/chat");
    await page.getByPlaceholder(/Décrivez/i).fill("test");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByText("Réponse test")).toBeVisible();

    const tokenBefore = await page.evaluate(() => sessionStorage.getItem("elsai_token"));
    expect(tokenBefore).toBe("test-token");

    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Droit à l'oubli/i }).click();

    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem("elsai_token")))
      .toBeNull();
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem("elsai_conversation_id")))
      .toBeNull();
  });
});
