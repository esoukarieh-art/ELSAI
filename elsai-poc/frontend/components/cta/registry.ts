/**
 * Registre central des composants CTA (17 clés).
 * Utilisé par CTABlockRender pour résoudre component → React.ComponentType.
 */
import type { ComponentType } from "react";

// Conversationnel / PWA (Agent A)
import { CTAChatAnonyme } from "./CTAChatAnonyme";
import { CTAScanDocument } from "./CTAScanDocument";
import { CTACourrierType } from "./CTACourrierType";

// B2B (Agent B)
import { CTADemoEntreprise } from "./CTADemoEntreprise";
import { CTAPlaquetteB2B } from "./CTAPlaquetteB2B";
import { CTABookingRDV } from "./CTABookingRDV";

// Email / capture (Agent C)
import { CTANewsletterInline } from "./CTANewsletterInline";
import { CTALeadMagnet } from "./CTALeadMagnet";
import { CTAAlertMiseAJour } from "./CTAAlertMiseAJour";

// Urgences (Agent C — stubs fournis ici, surchargés ensuite)
import { CTAUrgence119 } from "./CTAUrgence119";
import { CTAUrgence3919 } from "./CTAUrgence3919";
import { CTAUrgence115 } from "./CTAUrgence115";
import { CTAUrgence3114 } from "./CTAUrgence3114";

// Maillage + Action (Agent D — ce lot)
import { CTAArticleLie } from "./CTAArticleLie";
import { CTAPillarHub } from "./CTAPillarHub";
import { CTAFAQInline } from "./CTAFAQInline";
import { CTAAnnuaireGeo } from "./CTAAnnuaireGeo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CTA_REGISTRY: Record<string, ComponentType<any>> = {
  CTAChatAnonyme,
  CTAScanDocument,
  CTACourrierType,
  CTADemoEntreprise,
  CTAPlaquetteB2B,
  CTABookingRDV,
  CTANewsletterInline,
  CTALeadMagnet,
  CTAAlertMiseAJour,
  CTAUrgence119,
  CTAUrgence3919,
  CTAUrgence115,
  CTAUrgence3114,
  CTAArticleLie,
  CTAPillarHub,
  CTAFAQInline,
  CTAAnnuaireGeo,
};

export const CTA_COMPONENT_NAMES = Object.keys(CTA_REGISTRY);
