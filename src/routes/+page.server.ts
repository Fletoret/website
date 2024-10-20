import { getAuthorsIndex, getFAQ } from '$lib/db'

export function load() {
  return {
    faqEntries: getFAQ(),
    authorsIndex: getAuthorsIndex(),
  }
}
