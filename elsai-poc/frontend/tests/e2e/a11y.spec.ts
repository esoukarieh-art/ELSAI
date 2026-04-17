import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mockElsaiApi } from "./fixtures/api-mock";

/**
 * Audit a11y automatisé — tags WCAG 2.0/2.1 AA (base RGAA 4.1).
 * Seuil : zéro violation `critical` ou `serious` sur chaque page critique.
 * Les violations `moderate` / `minor` sont loggées en console sans bloquer.
 */

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const BLOCKING = new Set(["critical", "serious"]);

function filterBlocking(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]) {
  return violations.filter((v) => BLOCKING.has(v.impact ?? ""));
}

/**
 * Pages vitrine à auditer. Chaque entrée = [URL, label].
 * Pas de page dashboard (admin, hors RGAA public).
 */
const VITRINE_PAGES: Array<[string, string]> = [
  ["/", "Accueil vitrine"],
  ["/comment-ca-marche", "Comment ça marche"],
  ["/ethique", "Éthique"],
  ["/confidentialite", "Confidentialité"],
  ["/faq", "FAQ"],
  ["/pour-qui", "Pour qui"],
  ["/exemples-concrets", "Exemples concrets"],
  ["/mentions-legales", "Mentions légales"],
  ["/cgu", "CGU"],
  ["/contact", "Contact"],
  ["/start", "Page de démarrage"],
];

for (const [url, label] of VITRINE_PAGES) {
  test(`a11y vitrine — ${label} (${url})`, async ({ page }) => {
    await page.goto(url);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const blocking = filterBlocking(results.violations);
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
}

test.describe("a11y pages interactives", () => {
  test("chat — sans bannière urgence", async ({ page }) => {
    await mockElsaiApi(page);
    await page.goto("/chat");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const blocking = filterBlocking(results.violations);
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test("chat — avec bannière urgence 119 visible", async ({ page }) => {
    await mockElsaiApi(page, [
      {
        reply: "Je t'entends.",
        danger_detected: true,
        emergency_cta: { label: "Appeler le 119", phone: "119" },
      },
    ]);
    await page.goto("/chat");
    await page.addInitScript(() => sessionStorage.setItem("elsai_profile", "minor"));
    await page.getByPlaceholder(/librement|situation/i).fill("test");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByRole("alert")).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const blocking = filterBlocking(results.violations);
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});

test.describe("Navigation clavier (RGAA 7.1)", () => {
  test("skip link focus au 1er Tab", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.textContent);
    expect(focused?.toLowerCase()).toMatch(/contenu|passer/i);
  });

  test("skip link cible l'ancre #contenu", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const href = await page.evaluate(
      () => (document.activeElement as HTMLAnchorElement | null)?.getAttribute("href")
    );
    expect(href).toBe("#contenu");
  });

  test("chat — input accessible au clavier", async ({ page }) => {
    await mockElsaiApi(page);
    await page.goto("/chat");
    // Tab jusqu'à l'input
    await page.keyboard.press("Tab");
    for (let i = 0; i < 10; i++) {
      const tag = await page.evaluate(() => document.activeElement?.tagName);
      if (tag === "INPUT") break;
      await page.keyboard.press("Tab");
    }
    const tag = await page.evaluate(() => document.activeElement?.tagName);
    expect(tag).toBe("INPUT");
  });
});

test.describe("Attributs langue + titre (RGAA 8.3, 8.5)", () => {
  test("document a lang='fr'", async ({ page }) => {
    await page.goto("/");
    const lang = await page.getAttribute("html", "lang");
    expect(lang).toBe("fr");
  });

  test("chaque page a un <title> non vide", async ({ page }) => {
    for (const [url] of VITRINE_PAGES) {
      await page.goto(url);
      const title = await page.title();
      expect(title.trim().length, `page ${url} sans titre`).toBeGreaterThan(0);
    }
  });
});
