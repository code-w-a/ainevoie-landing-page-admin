export function formatDate(date: string) {
  const formatter = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  return formatter.format(new Date(date));
}
