// The functions listed in the formula editor's help panel.
//
// Only functions the evaluator really runs are here (formula-evaluator.ts
// and the mathjs built-ins it uses), each with an example that works as
// written. Descriptions live in i18n under database.formulaHelp.fn.<name>.
// Examples with a fixed answer carry it in `result`; formula-help checks in
// the browser run each one through evaluateFormula.

export type FormulaFunctionCategory =
  "logic" | "text" | "math" | "date" | "list";

export interface FormulaFunctionHelp {
  name: string;
  category: FormulaFunctionCategory;
  /** How to call it, e.g. `round(number, decimals?)`. */
  signature: string;
  example: string;
  /** What `example` gives, as the formula cell shows it. Left out when it
   *  depends on the day (now, today). */
  result?: string;
  /** Inserted when the function is picked: a call with the cursor between
   *  the parentheses, or a bare name for constants. */
  insert?: { text: string; cursor: number };
}

export const FORMULA_CATEGORIES: FormulaFunctionCategory[] = [
  "logic",
  "text",
  "math",
  "date",
  "list",
];

const fn = (
  name: string,
  category: FormulaFunctionCategory,
  signature: string,
  example: string,
  result?: string,
): FormulaFunctionHelp => ({ name, category, signature, example, result });

const constant = (
  name: string,
  example: string,
  result: string,
): FormulaFunctionHelp => ({
  name,
  category: "math",
  signature: name,
  example,
  result,
  insert: { text: name, cursor: name.length },
});

export const FORMULA_HELP: FormulaFunctionHelp[] = [
  // ── Logic ────────────────────────────────────────────────────────────────
  fn(
    "if",
    "logic",
    "if(condition, ifTrue, ifFalse)",
    'if(5 > 3, "Yes", "No")',
    "Yes",
  ),
  fn(
    "ifs",
    "logic",
    "ifs(condition, value, condition, value, …, otherwise)",
    'ifs(2 > 3, "A", 2 > 1, "B", "C")',
    "B",
  ),
  fn("and", "logic", "and(a, b)", "and(true, false)", "false"),
  fn("or", "logic", "or(a, b)", "or(true, false)", "true"),
  fn("not", "logic", "not(value)", "not(true)", "false"),
  fn("empty", "logic", "empty(value)", 'empty("")', "true"),

  // ── Text ─────────────────────────────────────────────────────────────────
  fn("length", "text", "length(text | list)", 'length("Folio")', "5"),
  fn(
    "substring",
    "text",
    "substring(text, start, end?)",
    'substring("Notebook", 0, 4)',
    "Note",
  ),
  fn(
    "contains",
    "text",
    "contains(text, search)",
    'contains("Folio is fun", "fun")',
    "true",
  ),
  fn(
    "test",
    "text",
    "test(text, pattern)",
    'test("Room 42", "[0-9]+")',
    "true",
  ),
  fn(
    "match",
    "text",
    "match(text, pattern)",
    'match("a1 b2 c3", "[0-9]")',
    "1, 2, 3",
  ),
  fn(
    "replace",
    "text",
    "replace(text, pattern, replacement)",
    'replace("2026-03-14", "-", "/")',
    "2026/03-14",
  ),
  fn(
    "replaceAll",
    "text",
    "replaceAll(text, pattern, replacement)",
    'replaceAll("2026-03-14", "-", "/")',
    "2026/03/14",
  ),
  fn("lower", "text", "lower(text)", 'lower("HELLO")', "hello"),
  fn("upper", "text", "upper(text)", 'upper("hello")', "HELLO"),
  fn("repeat", "text", "repeat(text, times)", 'repeat("ha", 3)', "hahaha"),
  fn("trim", "text", "trim(text)", 'trim("  hello  ")', "hello"),
  fn("format", "text", "format(value)", "format(42)", "42"),
  fn("toNumber", "text", "toNumber(text)", 'toNumber("42") + 1', "43"),

  // ── Math ─────────────────────────────────────────────────────────────────
  fn("add", "math", "add(a, b)", "add(2, 3)", "5"),
  fn("subtract", "math", "subtract(a, b)", "subtract(10, 4)", "6"),
  fn("multiply", "math", "multiply(a, b)", "multiply(3, 4)", "12"),
  fn("divide", "math", "divide(a, b)", "divide(10, 4)", "2.5"),
  fn("mod", "math", "mod(a, b)", "mod(7, 3)", "1"),
  fn("pow", "math", "pow(base, exponent)", "pow(2, 10)", "1024"),
  fn("min", "math", "min(a, b, …)", "min(4, 2, 8)", "2"),
  fn("max", "math", "max(a, b, …)", "max(4, 2, 8)", "8"),
  fn("sum", "math", "sum(a, b, …)", "sum(1, 2, 3)", "6"),
  fn("mean", "math", "mean(a, b, …)", "mean(2, 4, 6)", "4"),
  fn("median", "math", "median(a, b, …)", "median(3, 1, 2)", "2"),
  fn("abs", "math", "abs(number)", "abs(-5)", "5"),
  fn("round", "math", "round(number, decimals?)", "round(3.14159, 2)", "3.14"),
  fn("ceil", "math", "ceil(number)", "ceil(4.2)", "5"),
  fn("floor", "math", "floor(number)", "floor(4.8)", "4"),
  fn("sqrt", "math", "sqrt(number)", "sqrt(16)", "4"),
  fn("cbrt", "math", "cbrt(number)", "cbrt(27)", "3"),
  fn("exp", "math", "exp(number)", "round(exp(1), 3)", "2.718"),
  fn("log10", "math", "log10(number)", "log10(1000)", "3"),
  fn("log2", "math", "log2(number)", "log2(8)", "3"),
  fn("sign", "math", "sign(number)", "sign(-3)", "-1"),
  constant("pi", "round(pi * 2, 2)", "6.28"),
  constant("e", "round(e, 2)", "2.72"),

  // ── Dates ────────────────────────────────────────────────────────────────
  // Example dates carry a time of day so they read the same in every time
  // zone ("2026-03-14" alone is midnight UTC: March 13 in the Americas).
  fn("now", "date", "now()", 'formatDate(now(), "MMMM D, YYYY")'),
  fn("today", "date", "today()", "today()"),
  fn(
    "formatDate",
    "date",
    "formatDate(date, format)",
    'formatDate("2026-03-14T12:00", "dddd, MMMM D")',
    "Saturday, March 14",
  ),
  fn(
    "parseDate",
    "date",
    "parseDate(text)",
    'formatDate(parseDate("2026-03-14T12:00"), "MMM D, YYYY")',
    "Mar 14, 2026",
  ),
  fn(
    "dateAdd",
    "date",
    "dateAdd(date, amount, unit)",
    'formatDate(dateAdd("2026-03-01T12:00", 7, "days"), "MMM D")',
    "Mar 8",
  ),
  fn(
    "dateSubtract",
    "date",
    "dateSubtract(date, amount, unit)",
    'formatDate(dateSubtract("2026-03-01T12:00", 7, "days"), "MMM D")',
    "Feb 22",
  ),
  fn(
    "dateBetween",
    "date",
    "dateBetween(date1, date2, unit)",
    'dateBetween("2026-03-14T12:00", "2026-03-01T12:00", "days")',
    "13",
  ),
  fn("minute", "date", "minute(date)", 'minute("2026-03-14T09:30")', "30"),
  fn("hour", "date", "hour(date)", 'hour("2026-03-14T09:30")', "9"),
  fn("day", "date", "day(date)", 'day("2026-03-14T12:00")', "6"),
  fn("date", "date", "date(date)", 'date("2026-03-14T12:00")', "14"),
  fn("month", "date", "month(date)", 'month("2026-03-14T12:00")', "3"),
  fn("year", "date", "year(date)", 'year("2026-03-14T12:00")', "2026"),
  fn("week", "date", "week(date)", 'week("2026-03-14T12:00")', "11"),
  fn(
    "timestamp",
    "date",
    "timestamp(date)",
    'timestamp("1970-01-01T00:00:01Z")',
    "1000",
  ),
  fn(
    "fromTimestamp",
    "date",
    "fromTimestamp(milliseconds)",
    "year(fromTimestamp(1773489600000))",
    "2026",
  ),

  // ── Lists ────────────────────────────────────────────────────────────────
  fn(
    "split",
    "list",
    "split(text, separator)",
    'split("a,b,c", ",")',
    "a, b, c",
  ),
  fn(
    "join",
    "list",
    "join(list, separator)",
    'join(split("a b c", " "), " – ")',
    "a – b – c",
  ),
  fn("at", "list", "at(list, index)", 'at(split("a,b,c", ","), 1)', "b"),
  fn("first", "list", "first(list)", 'first(split("a,b,c", ","))', "a"),
  fn("last", "list", "last(list)", 'last(split("a,b,c", ","))', "c"),
  fn(
    "slice",
    "list",
    "slice(list, start, end?)",
    'slice(split("a,b,c,d", ","), 1, 3)',
    "b, c",
  ),
  fn(
    "concat",
    "list",
    "concat(list, list, …)",
    'concat(split("a,b", ","), split("c", ","))',
    "a, b, c",
  ),
  fn("sort", "list", "sort(list)", 'sort(split("c,a,b", ","))', "a, b, c"),
  fn(
    "reverse",
    "list",
    "reverse(list)",
    'reverse(split("a,b,c", ","))',
    "c, b, a",
  ),
  fn("unique", "list", "unique(list)", 'unique(split("a,b,a", ","))', "a, b"),
  fn(
    "includes",
    "list",
    "includes(list, value)",
    'includes(split("a,b,c", ","), "b")',
    "true",
  ),
];

/** What picking a function inserts into the formula. */
export function insertFor(f: FormulaFunctionHelp): {
  text: string;
  cursor: number;
} {
  return f.insert ?? { text: `${f.name}()`, cursor: f.name.length + 1 };
}
