import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Indique ton nom (2 caractères minimum).").max(80, "Nom trop long."),
  email: z.string().trim().max(160, "Adresse trop longue.").email("Adresse e-mail invalide."),
  subject: z.enum(["question", "bug", "suggestion", "autre"]),
  message: z.string().trim().min(10, "Ton message doit contenir au moins 10 caractères.").max(4000, "Message trop long (4 000 caractères maximum)."),
  /** Champ piège anti-robots : doit rester vide. */
  website: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const subjectLabels: Record<ContactInput["subject"], string> = {
  question: "Question", bug: "Signaler un bug", suggestion: "Suggestion d'outil", autre: "Autre",
};
