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
    source_file: ($) => repeat(choice($._line, /\n/)),

    _line: ($) =>
      choice(
        $.comment,
        $.directive,
        $.module_reference,
      ),

    comment: ($) => token(seq("#", /[^\n]*/)),

    directive: ($) =>
      seq(
        field("name", $.directive_name),
        optional(field("arguments", $.arguments)),
        /\n/,
      ),

    directive_name: ($) =>
      choice(...DIRECTIVE_NAMES),

    arguments: ($) => repeat1($._word),

    // Module references (bare names after the directives section)
    module_reference: ($) => seq($._word, /\n/),

    // Single token for any non-whitespace word on a line.
    // Directive names are extracted as keywords from this pattern.
    _word: ($) => /[^ \t\n#]+/,
  },
});
