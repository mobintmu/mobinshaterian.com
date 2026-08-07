import assert from "node:assert/strict";
import test from "node:test";

import { formatReaderCode } from "./reader-code-formatter.mjs";

test("formats a complete Go file", () => {
  assert.equal(
    formatReaderCode("package main\nfunc main(){println(\"ok\")}", "go"),
    'package main\n\nfunc main() { println("ok") }',
  );
});

test("formats a Go declaration fragment", () => {
  assert.equal(
    formatReaderCode("type item struct{name string\ncount int}", "go"),
    "type item struct {\n\tname  string\n\tcount int\n}",
  );
});

test("formats a Go statement fragment", () => {
  assert.equal(formatReaderCode("value:=make([]string,0)", "go"), "value := make([]string, 0)");
});

test("preserves illustrative Go that cannot be parsed", () => {
  const source = "result := buildThing(...)";
  assert.equal(formatReaderCode(source, "go"), source);
});
