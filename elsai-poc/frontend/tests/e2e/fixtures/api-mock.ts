import { Page } from "@playwright/test";

export interface MockChatScenario {
  reply: string;
  danger_detected?: boolean;
  emergency_cta?: { label: string; phone: string } | null;
}

export async function mockElsaiApi(page: Page, scenarios: MockChatScenario[] = []) {
  let callCount = 0;

  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: "test-token",
        session_id: "test-session-id",
        profile: "adult",
      }),
    })
  );

  await page.route("**/api/chat", (route) => {
    const scenario = scenarios[callCount] ?? {
      reply: "Réponse de test par défaut.",
      danger_detected: false,
      emergency_cta: null,
    };
    callCount++;
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        conversation_id: "conv-test-1",
        reply: scenario.reply,
        danger_detected: scenario.danger_detected ?? false,
        emergency_cta: scenario.emergency_cta ?? null,
      }),
    });
  });

  await page.route("**/api/auth/forget", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ deleted_conversations: 1, deleted_messages: 4 }),
    })
  );
}

export async function setProfile(page: Page, profile: "adult" | "minor") {
  await page.addInitScript((p) => {
    window.sessionStorage.setItem("elsai_profile", p);
  }, profile);
}
