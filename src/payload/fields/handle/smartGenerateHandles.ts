import { User } from "@/payload-types";
import { ADJECTIVES, NOUNS } from "@/utilities/names";
import { randomNumber } from "@/utilities/randomNumber";
import { DateTime } from "luxon";
import { formatUserHandle } from "./formatUserHandle";

export function generateSmartSlugCandidates({
  base,
  email,
  firstName,
  lastName,
  displayUsername,
  maxAttempts = 3
}: {
  base: string;
  maxAttempts?: number;
} & Partial<
  Pick<User, "email" | "firstName" | "lastName" | "displayUsername">
>) {
  const candidates = new Set<string>();
  const bases = [formatUserHandle(base)];

  const words: string[] = [];
  const chars = ["x", "_"];
  const nounLength = NOUNS.length;
  const adjLength = ADJECTIVES.length;

  [firstName, lastName, displayUsername]
    .filter((r) => typeof r === "string")
    .forEach((w) => {
      words.push(formatUserHandle(w));
    });
  if (email) {
    const emailName = email.split("@")[0];
    const emailClean =
      emailName.length > 3 ? formatUserHandle(emailName) : null;
    if (emailClean) {
      base !== emailClean && bases.push(emailClean);
    }
  }
  let f = 0;
  while (words.length < 3) {
    f += 1;
    const d = DateTime.now().toMillis() % (adjLength + f);
    const rr = randomNumber(1, d) % 2;
    const voc = rr
      ? ADJECTIVES[randomNumber(0, adjLength - 1)]
      : NOUNS[randomNumber(0, nounLength - 1)];
    words.push(voc);
  }

  while (candidates.size < maxAttempts) {
    const base = bases[randomNumber(0, bases.length - 1)];
    const word = words[randomNumber(0, words.length - 1)];
    const char = chars[randomNumber(0, chars.length - 1)];
    const times = randomNumber(1, 3);
    const s1 = base + char.repeat(times);
    const s2 =
      times < 2
        ? s1 + char + word
        : s1 + char + words[randomNumber(0, words.length - 1)];
    candidates.add(s2);
  }
  return Array.from(candidates);
}
