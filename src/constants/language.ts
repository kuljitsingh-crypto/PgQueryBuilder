export const supportedLang = {
  plpgsql: "plpgsql", // PostgreSQL's native procedural language; supports variables, loops, conditionals, exceptions
  sql: "sql", // Standard SQL language; no procedural features
  internal: "internal", // Built-in functions written in C, used internally
  c: "c", // Functions written in C; high-performance, needs superuser privileges
  plpythonu: "plpythonu", // Untrusted Python 2 language; requires extension
  plpython3u: "plpython3u", // Untrusted Python 3 language; requires extension
  plperl: "plperl", // Trusted Perl language; requires extension
  plperlu: "plperlu", // Untrusted Perl language; can access system resources; requires extension
  plv8: "plv8", // JavaScript via V8 engine; requires extension
  plr: "plr", // R language; statistical computing; requires extension
  pljava: "pljava", // Java language; requires extension
  plsh: "plsh", // Shell script language; requires extension; can execute OS commands
} as const;
