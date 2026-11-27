import { parse, toSql } from "pgsql-ast-parser";

export class QueryIssue extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

const guard = (message) => {
  throw new QueryIssue("restricted", message);
};
const operators = new Set([
  "=",
  "!=",
  "<>",
  ">",
  "<",
  ">=",
  "<=",
  "AND",
  "OR",
  "IN",
  "NOT IN",
  "NOT",
  "IS TRUE",
  "IS FALSE",
  "IS NOT TRUE",
  "IS NOT FALSE",
  "IS NULL",
  "IS NOT NULL",
  "BETWEEN",
  "NOT BETWEEN",
]);

function checkExpression(expr, depth = 0) {
  if (depth > 20)
    guard("Simplify this expression to fewer than 20 nested conditions.");
  const children = [];
  switch (expr.type) {
    case "ref":
    case "integer":
    case "numeric":
    case "string":
    case "boolean":
    case "null":
      return;
    case "list":
      children.push(...expr.expressions);
      break;
    case "binary":
      children.push(expr.left, expr.right);
      break;
    case "unary":
      children.push(expr.operand);
      break;
    case "ternary":
      children.push(expr.value, expr.lo, expr.hi);
      break;
    default:
      guard("For this chapter, use roster columns, values and comparisons.");
  }
  if (expr.op && !operators.has(expr.op))
    guard("This operator is outside the flight roster lesson.");
  for (const child of children) checkExpression(child, depth + 1);
}

export function analyse(input) {
  if (typeof input !== "string" || !input.trim())
    throw new QueryIssue(
      "empty",
      "Write a SELECT statement before running the query.",
    );
  if (input.length > 1800)
    guard("Keep this chapter’s query below 1,801 characters.");
  let statements;
  try {
    statements = parse(input);
  } catch (error) {
    const location = error.message.match(/line (\d+) col (\d+)/);
    const near = location
      ? " at line " + location[1] + ", column " + location[2]
      : "";
    throw new QueryIssue(
      "syntax",
      "SQL could not be parsed" +
        near +
        ". Check commas, quotes and the spelling of SELECT and FROM.",
    );
  }
  if (statements.length !== 1 || statements[0].type !== "select")
    guard("The roster accepts one read-only SELECT at a time.");
  const s = statements[0];
  const allowed = new Set([
    "type",
    "from",
    "columns",
    "where",
    "distinct",
    "orderBy",
  ]);
  if (
    Object.keys(s).some((key) => !allowed.has(key)) ||
    (s.distinct && s.distinct !== "distinct" && s.distinct !== "all")
  )
    guard(
      "Use a single SELECT on astronauts. This chapter supports filtering, DISTINCT and sorting.",
    );
  const source = s.from?.[0];
  if (
    s.from?.length !== 1 ||
    source.type !== "table" ||
    source.name.name !== "astronauts" ||
    source.name.schema ||
    source.join ||
    Object.keys(source).some((k) => !["type", "name"].includes(k))
  )
    guard(
      "Read from the astronauts table. Other tables and joins are locked in this chapter.",
    );
  if (!s.columns?.length || s.columns.length > 12)
    guard("Select between one and twelve roster fields.");
  for (const { expr } of s.columns) {
    if (expr.type !== "ref")
      guard(
        "Select actual fields from the roster so the result follows the data.",
      );
  }
  if (s.where) checkExpression(s.where);
  for (const item of s.orderBy ?? []) checkExpression(item.by);
  // Execute the checked tree. SQL comments or extra input cannot change its meaning.
  return {
    sql: toSql.statement(s),
    distinct: s.distinct === "distinct",
    projected: s.columns.map((c) => c.expr.name),
  };
}
