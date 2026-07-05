// Registre des dictionnaires par locale.
import { en } from "./en";
import { fr } from "./fr";

export const messages = { en, fr } as const;
export type Messages = typeof en;
