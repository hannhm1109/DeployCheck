import type { z } from "zod";
import type { AppLocale } from "./routing";

const frenchMessages: Record<string, string> = {
  "Enter at least 2 characters.": "Saisissez au moins 2 caractères.",
  "Use letters, numbers, and single hyphens.": "Utilisez des lettres, des chiffres et des tirets simples.",
  "This slug is reserved.": "Cet identifiant URL est réservé.",
  "Choose a project.": "Choisissez un projet.",
  "Enter a version.": "Saisissez une version.",
  "Use letters, numbers, dots, hyphens, or plus signs.": "Utilisez des lettres, des chiffres, des points, des tirets ou le signe plus.",
  "Enter a ticket reference.": "Saisissez une référence de ticket.",
  "Use letters, numbers, and hyphens.": "Utilisez des lettres, des chiffres et des tirets.",
  "This check does not need a change decision.": "Ce contrôle ne nécessite pas de décision de changement.",
  "This check is not recognized.": "Ce contrôle n'est pas reconnu.",
  "Keep the rollback plan under 2,000 characters.": "Limitez le plan de retour arrière à 2 000 caractères.",
  "Choose a valid status and keep notes under 1,000 characters.": "Choisissez un statut valide et limitez les notes à 1 000 caractères.",
  "A project with this slug already exists.": "Un projet avec cet identifiant URL existe déjà.",
  "This version already exists in the selected project.": "Cette version existe déjà dans le projet sélectionné.",
  "The selected project no longer exists.": "Le projet sélectionné n'existe plus.",
  "This public demo is read-only. Run the app locally to try editing releases.": "Cette démo publique est en lecture seule. Lancez l'application en local pour modifier les versions.",
  "The release changed while saving. Try again.": "La version a changé pendant l'enregistrement. Réessayez.",
  "Items can only be changed while the release is Draft or In review.": "Les tickets ne peuvent être modifiés que si la version est en brouillon ou en revue.",
  "This item no longer exists in the release.": "Ce ticket n'existe plus dans la version.",
  "This reference already exists in the release.": "Cette référence existe déjà dans la version.",
  "This release no longer exists.": "Cette version n'existe plus.",
  "Checks can only be changed while the release is Draft or In review.": "Les contrôles ne peuvent être modifiés que si la version est en brouillon ou en revue.",
  "That status change is not allowed from the current state.": "Ce changement de statut n'est pas autorisé depuis l'état actuel.",
  "Resolve all readiness blockers before this transition.": "Résolvez tous les points bloquants avant ce changement de statut.",
  "A deployment timestamp is required before marking a release deployed.": "Une date de déploiement est nécessaire avant de marquer la version comme déployée.",
  "The release changed. Refresh and try again.": "La version a changé. Actualisez la page et réessayez.",
};

export function localizeMessage(message: string, locale: AppLocale): string {
  return locale === "fr" ? frenchMessages[message] ?? message : message;
}

export function localizeIssue(issue: z.core.$ZodIssue, locale: AppLocale): string {
  if (locale === "en") return issue.message;
  if (issue.code === "too_big" && typeof issue.maximum === "number") {
    return `Saisissez au plus ${issue.maximum} caractères.`;
  }
  if (issue.code === "invalid_format" && issue.format === "date") {
    return "Saisissez une date valide.";
  }
  if (issue.code === "invalid_union" || issue.code === "invalid_value") {
    return "Choisissez une valeur valide.";
  }
  return frenchMessages[issue.message] ?? "Valeur invalide.";
}
