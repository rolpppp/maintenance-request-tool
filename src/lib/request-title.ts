import { CATEGORY_BY_ID, type CategoryId } from '@/config/categories';

/** There is no title column: use the category and the first follow-up answer, or the start of the description. */
export function requestTitle(request: { category: CategoryId; answers: Record<string, string>; description: string }): string {
  const category = CATEGORY_BY_ID[request.category];
  const firstAnswer = category.questions.map((q) => request.answers[q.key]).find(Boolean);
  if (firstAnswer) return `${category.label} · ${firstAnswer}`;
  const text = request.description.trim().replace(/\s+/g, ' ');
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
}
