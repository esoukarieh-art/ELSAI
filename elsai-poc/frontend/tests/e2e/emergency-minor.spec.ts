import { expect, test } from "@playwright/test";
import { mockElsaiApi, setProfile } from "./fixtures/api-mock";

test.describe("Flux danger mineur → 119", () => {
  test("affiche EmergencyBanner avec numéro 119 quand danger_detected=true", async ({ page }) => {
    await setProfile(page, "minor");
    await mockElsaiApi(page, [
      {
        reply: "Je t'entends. Ce que tu vis est grave, un professionnel peut t'aider.",
        danger_detected: true,
        emergency_cta: { label: "Appeler le 119", phone: "119" },
      },
    ]);

    await page.goto("/chat");
    await page.getByPlaceholder(/question librement/i).fill("je veux en finir");
    await page.getByRole("button", { name: "Envoyer" }).click();

    const banner = page.getByRole("alert");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Tu n'es pas seul·e");

    const callLink = banner.getByRole("link", { name: /119/ });
    await expect(callLink).toHaveAttribute("href", "tel:119");
  });

  test("banner peut être fermé via bouton Continuer à discuter", async ({ page }) => {
    await setProfile(page, "minor");
    await mockElsaiApi(page, [
      {
        reply: "…",
        danger_detected: true,
        emergency_cta: { label: "Appeler le 119", phone: "119" },
      },
    ]);

    await page.goto("/chat");
    await page.getByPlaceholder(/question librement/i).fill("message test");
    await page.getByRole("button", { name: "Envoyer" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await page.getByRole("button", { name: /Fermer le bandeau/i }).click();
    await expect(page.getByRole("alert")).not.toBeVisible();
  });
});

test.describe("Flux danger majeur → 3114", () => {
  test("adulte en détresse voit le 3114", async ({ page }) => {
    await setProfile(page, "adult");
    await mockElsaiApi(page, [
      {
        reply: "Je vous entends. Un professionnel peut vous accompagner.",
        danger_detected: true,
        emergency_cta: { label: "Appeler le 3114", phone: "3114" },
      },
    ]);

    await page.goto("/chat");
    await page.getByPlaceholder(/Décrivez votre situation/i).fill("je n'en peux plus");
    await page.getByRole("button", { name: "Envoyer" }).click();

    const banner = page.getByRole("alert");
    await expect(banner).toBeVisible();
    await expect(banner.getByRole("link", { name: /3114/ })).toHaveAttribute("href", "tel:3114");
  });
});
