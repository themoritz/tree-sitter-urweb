/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Ur/Web project file (.urp) Tree-sitter grammar

const DIRECTIVE_NAMES = [
  "allow",
  "deny",
  "alwaysInline",
  "benignEffectful",
  "clientOnly",
  "clientToServer",
  "database",
  "debug",
  "effectful",
  "exe",
  "file",
  "filecache",
  "ffi",
  "html5",
  "include",
  "jsFile",
  "jsFunc",
  "jsModule",
  "library",
  "limit",
  "link",
  "linker",
  "mimeTypes",
  "minHeap",
  "memoInline",
  "neverInline",
  "neverEarlyInline",
  "coreInline",
  "monoInline",
  "noMangleSql",
  "noXsrfProtection",
  "onError",
  "path",
  "prefix",
  "profile",
  "rewrite",
  "safeGet",
  "safeGetDefault",
  "script",
  "serverOnly",
  "sigfile",
  "sql",
  "timeFormat",
  "timeout",
  "xhtml",
];

module.exports = grammar({
  name: "urweb_project",

  extras: ($) => [/[ \t]/],

  // Enable keyword extraction so directive names take priority over _word
  word: ($) => $._word,

  rules: {
    // Lines are newline-terminated, except the final line may omit its
    // trailing newline at end of file.
    source_file: ($) =>
      seq(
        repeat(choice($._line, /\n/)),
        optional(choice(
          alias($._directive_core, $.directive),
          alias($._word, $.module_reference),
        )),
      ),

    _line: ($) =>
      choice(
        $.comment,
        $.directive,
        $.module_reference,
      ),

    comment: ($) => token(seq("#", /[^\n]*/)),

    directive: ($) => seq($._directive_core, /\n/),

    _directive_core: ($) =>
      seq(
        field("name", $.directive_name),
        optional(field("arguments", $.arguments)),
        optional($.comment),
      ),

    directive_name: ($) =>
      choice(...DIRECTIVE_NAMES),

    arguments: ($) => repeat1($._word),

    // Module references (bare names after the directives section)
    module_reference: ($) => seq($._word, optional($.comment), /\n/),

    // Single token for any non-whitespace word on a line.
    // Directive names are extracted as keywords from this pattern.
    _word: ($) => /[^ \t\n#]+/,
  },
});
