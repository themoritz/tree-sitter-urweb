/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Ur/Web Tree-sitter grammar
// Derived from the urweb-lang VS Code extension's tmLanguage grammar.

const PREC = {
  SEMICOLON: 1,
  ARROW: 2,
  BIND: 2,
  OR: 4,
  AND: 5,
  COMPARE: 6,
  // |> <| <<< >>> and `f` bind tighter than comparisons (see urweb.grm)
  BACKTICK: 7,
  PIPE: 8,
  CONCAT: 9,
  ADD: 10,
  MULT: 11,
  UNARY: 12,
  APP: 13,
  DOT: 14,
  FIELD: 15,
};

const SQL_KEYWORDS = [
  "SELECT",
  "SELECT1",
  "DISTINCT",
  "FROM",
  "AS",
  "WHERE",
  "SQL",
  "GROUP",
  "ORDER",
  "BY",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "ALL",
  "UNION",
  "INTERSECT",
  "EXCEPT",
  "TRUE",
  "FALSE",
  "AND",
  "OR",
  "NOT",
  "COUNT",
  "AVG",
  "SUM",
  "MIN",
  "MAX",
  "STRING_AGG",
  "RANK",
  "PARTITION",
  "OVER",
  "IS",
  "CAST",
  "CURRENT_TIMESTAMP",
  "ASC",
  "DESC",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "PRIMARY",
  "KEY",
  "CONSTRAINT",
  "UNIQUE",
  "CHECK",
  "FOREIGN",
  "REFERENCES",
  "ON",
  "NO",
  "ACTION",
  "CASCADE",
  "RESTRICT",
  "NULL",
  "JOIN",
  "INNER",
  "OUTER",
  "LEFT",
  "RIGHT",
  "FULL",
  "CROSS",
  "IF",
  "THEN",
  "ELSE",
  "COALESCE",
  "LIKE",
  "RANDOM",
];

module.exports = grammar({
  name: "urweb",

  extras: ($) => [/\s/, $.comment],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.application_expression, $.infix_expression, $.at_expression],
    [$.application_expression, $.infix_expression, $.dollar_expression],
    [$.application_expression, $.infix_expression, $.double_at_expression],
    [$.tuple_type, $.type_annotation],
    [$.application_expression, $.infix_expression],
    [$.val_binding, $.typed_pattern],
    [$.val_binding],
    [$.type_declaration],
    [$.con_declaration],
    [$.class_declaration],
    [$.type_param, $._simple_type],
    [$.constructor_expression, $.record_field],
    [$.record_field, $._simple_expression],
    [$.application_expression, $.infix_expression, $.unary_expression],
    [$.table_declaration],
    [$.antiquote_expression, $.list_expression],
    [$.ensure_index_declaration, $.expression],
    [$.ensure_index_declaration],
    [$.open_declaration],
    [$._simple_expression, $._xml_tag_name],
    [$.module_expression, $.functor_app_expression],
    [$.match_arm, $.type_annotation],
  ],

  rules: {
    source_file: ($) => repeat($._declaration),

    // ========== Declarations ==========

    _declaration: ($) =>
      choice(
        $.val_declaration,
        $.fun_declaration,
        $.type_declaration,
        $.datatype_declaration,
        $.con_declaration,
        $.class_declaration,
        $.structure_declaration,
        $.signature_declaration,
        $.functor_declaration,
        $.open_declaration,
        $.table_declaration,
        $.view_declaration,
        $.sequence_declaration,
        $.cookie_declaration,
        $.style_declaration,
        $.task_declaration,
        $.policy_declaration,
        $.constraint_declaration,
        $.export_declaration,
        $.ffi_declaration,
        $.include_declaration,
        $.ensure_index_declaration,
        $.expression_declaration,
      ),

    val_declaration: ($) =>
      seq(
        "val",
        optional("rec"),
        $.val_binding,
        repeat(seq("and", $.val_binding)),
      ),

    val_binding: ($) =>
      seq(
        field("name", $._pattern),
        repeat($.type_param),
        optional(seq(":", $.type_expression)),
        optional(seq("=", $.expression)),
      ),

    fun_declaration: ($) =>
      seq(
        "fun",
        $.fun_binding,
        repeat(seq("and", $.fun_binding)),
      ),

    fun_binding: ($) =>
      seq(
        field("name", $.identifier),
        repeat($._fun_param),
        optional(seq(":", $.type_expression)),
        "=",
        $.expression,
      ),

    // A function parameter can be a type param [a] or a regular pattern
    _fun_param: ($) =>
      choice(
        $.type_param,
        $.constraint_param,
        $._simple_pattern,
      ),

    // Type variable parameter: [a], [a :: Type], [a ::: Type], [a ::_]
    type_param: ($) =>
      prec.dynamic(10, seq(
        "[",
        choice(
          // [a :: Kind] or [a ::: Kind] or [a ::_]
          seq(
            field("name", choice($.identifier, $.constructor_name)),
            choice("::", ":::"),
            $.type_expression,
          ),
          // Just [a] - implicit type variable
          field("name", choice($.identifier, $.constructor_name)),
        ),
        "]",
      )),

    // Constraint parameter: [[nm] ~ ts], [r ~ s], [[nm = t] ++ r ~ s]
    constraint_param: ($) =>
      prec.dynamic(2, seq(
        "[",
        $.type_expression,
        "~",
        $.type_expression,
        "]",
      )),

    type_declaration: ($) =>
      seq(
        "type",
        field("name", $.identifier),
        repeat(choice($.identifier, $.type_param)),
        optional(seq("=", $.type_expression)),
      ),

    datatype_declaration: ($) =>
      choice(
        // Datatype replication: datatype t = datatype M.u
        seq(
          "datatype",
          field("name", $.identifier),
          repeat(choice($.identifier, $.type_param)),
          "=",
          "datatype",
          choice($.module_qualified, $.identifier),
        ),
        seq(
        "datatype",
        field("name", $.identifier),
        repeat(choice($.identifier, $.type_param)),
        "=",
        optional("|"),
        $.constructor_def,
        repeat(seq("|", $.constructor_def)),
        repeat(seq(
          "and",
          field("name", $.identifier),
          repeat(choice($.identifier, $.type_param)),
          "=",
          optional("|"),
          $.constructor_def,
          repeat(seq("|", $.constructor_def)),
        )),
        ),
      ),

    constructor_def: ($) =>
      seq(
        field("constructor", $.constructor_name),
        optional(seq("of", $.type_expression)),
      ),

    con_declaration: ($) =>
      seq(
        "con",
        field("name", $.identifier),
        repeat(choice($.identifier, $.type_param)),
        optional(seq("::", $.type_expression)),
        optional(seq("=", $.type_expression)),
      ),

    class_declaration: ($) =>
      seq(
        "class",
        field("name", $.identifier),
        repeat(choice(
          $.identifier,
          $.type_param,
          seq("(", $.identifier, choice("::", ":::"), $.type_expression, ")"),
        )),
        optional(seq("::", $.type_expression)),
        optional(seq("=", $.type_expression)),
      ),

    structure_declaration: ($) =>
      seq(
        "structure",
        field("name", $.constructor_name),
        optional(seq(":", $.signature_expression)),
        optional(seq("=", $.module_expression)),
      ),

    signature_declaration: ($) =>
      seq("signature", field("name", $.constructor_name), "=", $.signature_expression),

    functor_declaration: ($) =>
      seq(
        "functor",
        field("name", $.constructor_name),
        "(",
        field("param_name", $.constructor_name),
        ":",
        $.signature_expression,
        ")",
        optional(seq(":", $.signature_expression)),
        optional(seq("=", $.module_expression)),
      ),

    // open M.N | open M.N (Str) | open constraints M.N
    open_declaration: ($) =>
      seq("open", choice(
        seq("constraints", $.module_path),
        seq($.module_path, optional(seq("(", $.module_expression, ")"))),
      )),

    table_declaration: ($) =>
      seq(
        "table",
        field("name", $.identifier),
        ":",
        $.type_expression,
        optional(seq("PRIMARY", "KEY", $.expression)),
        repeat(seq(",", $.expression)),
      ),

    view_declaration: ($) =>
      seq("view", field("name", $.identifier), "=", $.expression),

    sequence_declaration: ($) =>
      seq("sequence", field("name", $.identifier)),

    cookie_declaration: ($) =>
      seq("cookie", field("name", $.identifier), ":", $.type_expression),

    style_declaration: ($) =>
      seq("style", field("name", $.identifier)),

    task_declaration: ($) =>
      seq("task", $.expression, "=", $.expression),

    policy_declaration: ($) =>
      seq("policy", $.expression),

    constraint_declaration: ($) =>
      seq("constraint", $.expression),

    export_declaration: ($) =>
      seq("export", $.module_path),

    // ffi name [modes] : type, e.g. ffi alert jsFunc "alert" : string -> unit
    ffi_declaration: ($) =>
      seq(
        "ffi",
        field("name", $.identifier),
        repeat(choice($.identifier, $.string_literal)),
        ":",
        $.type_expression,
      ),

    include_declaration: ($) =>
      seq("include", $.module_path),

    // ensure_index <table> : <indexed-fields-record> [in <type>]
    // (INDEX eterm COLON eterm in the reference grammar)
    ensure_index_declaration: ($) =>
      prec.dynamic(1, seq(
        "ensure_index",
        $._simple_expression,
        ":",
        $._simple_expression,
        optional(seq("in", $.type_expression)),
      )),

    expression_declaration: ($) => $.expression,

    // ========== Module expressions ==========

    module_expression: ($) =>
      choice(
        $.module_path,
        $.struct_expression,
        $.functor_app_expression,
        $.functor_expression,
      ),

    // Anonymous functor: functor (X : SIG) [: SIG] => str
    functor_expression: ($) =>
      seq(
        "functor",
        "(",
        $.constructor_name,
        ":",
        $.signature_expression,
        ")",
        optional(seq(":", $.signature_expression)),
        "=>",
        $.module_expression,
      ),

    struct_expression: ($) =>
      seq("struct", repeat($._declaration), "end"),

    functor_app_expression: ($) =>
      seq($.module_path, "(", $.module_expression, ")"),

    module_path: ($) =>
      prec.left(
        seq($.constructor_name, repeat(seq(".", $.constructor_name))),
      ),

    // ========== Signature expressions ==========

    signature_expression: ($) =>
      choice(
        $.sig_expression,
        $.module_path,
        seq("(", $.signature_expression, ")"),
        // functor (X : SIG) : SIG
        prec.right(-1, seq(
          "functor",
          "(",
          $.constructor_name,
          ":",
          $.signature_expression,
          ")",
          ":",
          $.signature_expression,
        )),
        prec.left(seq($.signature_expression, "where", $.where_clause)),
      ),

    sig_expression: ($) =>
      seq("sig", repeat($._declaration), "end"),

    where_clause: ($) =>
      seq(
        choice("type", "con"),
        choice($.identifier, $.module_qualified),
        "=",
        $.type_expression,
      ),

    // ========== Type expressions ==========

    type_expression: ($) =>
      choice(
        $._simple_type,
        $.function_type,
        $.kind_type,
        $.constraint_arrow_type,
        $.type_application,
        $.record_type,
        $.tuple_type,
        $.dollar_type,
        $.variant_type,
        $.type_concat,
        $.type_disjointness,
        $.type_fn,
        $.type_projection,
      ),

    // Type-level lambda: fn t :: (K1 * K2) => t.1
    type_fn: ($) =>
      prec.right(seq(
        "fn",
        repeat1(choice(
          $.identifier,
          "_",
          $.type_param,
          $.kind_annotated_param,
          $.paren_type_param,
        )),
        "=>",
        $.type_expression,
      )),

    // Type-level tuple projection: t.1
    type_projection: ($) =>
      prec.left(PREC.DOT, seq($.type_expression, ".", alias(/[0-9]+/, $.integer_literal))),

    _simple_type: ($) =>
      choice(
        $.identifier,
        $.constructor_name,
        $.module_qualified,
        $.field_name,
        // Parenthesized type or type-level tuple: (t), (t, u)
        seq("(", $.type_expression, repeat(seq(",", $.type_expression)), ")"),
        // Type-level list/record literal: [a = b, c = d]
        seq("[", optional(seq($._type_row_entry, repeat(seq(",", $._type_row_entry)), optional(","))), "]"),
        // Type-level unit
        "()",
        "_",
      ),

    _type_row_entry: ($) =>
      choice(
        seq(choice($.identifier, $.constructor_name), "=", $.type_expression),
        $.type_expression,
      ),

    // -> for types, --> for kind functions, ==> for kind polymorphism
    function_type: ($) =>
      prec.right(PREC.ARROW, seq($.type_expression, choice("->", "-->", "==>"), $.type_expression)),

    // Kind annotation in type signatures: a ::: Type -> ..., ([]) :: {K}
    kind_type: ($) =>
      prec.right(PREC.ARROW, seq($._simple_type, choice("::", ":::"), $.type_expression)),

    // Constraint arrow in type signatures: [x ~ y] => type.
    // Binds looser than -> (DARROW is below ARROW in urweb.grm).
    constraint_arrow_type: ($) =>
      prec.right(1, seq($.type_expression, "=>", $.type_expression)),

    type_application: ($) =>
      prec.left(PREC.APP, seq($.type_expression, $.type_expression)),

    record_type: ($) =>
      seq("{", choice(
        // {Name : type, ...} - regular record type
        seq($.record_type_field, repeat(seq(",", $.record_type_field)), optional(",")),
        // {Type} - record kind (all fields have given kind/type)
        optional($.type_expression),
      ), "}"),

    record_type_field: ($) =>
      seq(field("name", choice($.identifier, $.constructor_name)), ":", $.type_expression),

    tuple_type: ($) =>
      prec.left(seq($.type_expression, "*", $.type_expression)),

    // Row type concatenation: [a = t] ++ [b = u]
    type_concat: ($) =>
      prec.left(PREC.ADD, seq($.type_expression, "++", $.type_expression)),

    // Type-level disjointness constraint: [a] ~ [b]
    type_disjointness: ($) =>
      prec.left(PREC.COMPARE, seq($.type_expression, "~", $.type_expression)),

    // $record - record type from row
    dollar_type: ($) =>
      prec(PREC.UNARY, seq("$", $.type_expression)),

    // Variant type using hash
    variant_type: ($) =>
      prec(PREC.UNARY, seq("#", $.type_expression)),

    // ========== Expressions ==========

    expression: ($) =>
      choice(
        $._simple_expression,
        $.application_expression,
        $.infix_expression,
        $.unary_expression,
        $.fn_expression,
        $.case_expression,
        $.if_expression,
        $.let_expression,
        $.type_annotation,
        $.sql_expression,
        $.xml_expression,
      ),

    _simple_expression: ($) =>
      choice(
        $.identifier,
        $.constructor_expression,
        $.module_qualified,
        $.integer_literal,
        $.float_literal,
        $.string_literal,
        $.char_literal,
        $.record_expression,
        $.list_expression,
        $.unit_expression,
        $.parenthesized_expression,
        $.tuple_expression,
        $.projection_expression,
        $.at_expression,
        $.double_at_expression,
        $.dollar_expression,
        $.field_name,
        $.wildcard_expression,
        $.bang_expression,
        $.antiquote_expression,
        $.braced_expression,
        $.sql_star_expression,
      ),

    constructor_expression: ($) => $.constructor_name,

    // Antiquote splice inside SQL/XML quotations: {[e]}
    antiquote_expression: ($) =>
      prec.dynamic(2, seq("{", "[", $.expression, "]", "}")),

    // Brace antiquote inside SQL quotations: {e}
    braced_expression: ($) =>
      prec.dynamic(-1, seq("{", $.expression, "}")),

    // The ( * ) in SQL's COUNT( * )
    sql_star_expression: ($) => seq("(", "*", ")"),

    unit_expression: ($) => "()",

    wildcard_expression: ($) => prec(-1, "_"),

    // ! - ask the compiler to infer a proof/witness argument
    bang_expression: ($) => "!",

    parenthesized_expression: ($) =>
      seq("(", $.expression, ")"),

    tuple_expression: ($) =>
      seq("(", $.expression, ",", $.expression, repeat(seq(",", $.expression)), ")"),

    application_expression: ($) =>
      prec.left(PREC.APP, seq($.expression, $.expression)),

    infix_expression: ($) =>
      choice(
        prec.left(PREC.OR, seq($.expression, "||", $.expression)),
        prec.left(PREC.AND, seq($.expression, "&&", $.expression)),
        prec.left(PREC.COMPARE, seq($.expression, choice("=", "<>", "<", ">", "<=", ">="), $.expression)),
        prec.left(PREC.CONCAT, seq($.expression, "^", $.expression)),
        prec.left(PREC.ADD, seq($.expression, choice("+", "-"), $.expression)),
        prec.left(PREC.MULT, seq($.expression, choice("*", "/", "%"), $.expression)),
        prec.right(PREC.PIPE, seq($.expression, choice("|>", "<|", ">>>", "<<<"), $.expression)),
        // Record operations: ++ (concat), -- (remove field)
        prec.left(PREC.ADD, seq($.expression, "++", $.expression)),
        prec.left(PREC.ADD, seq($.expression, "---", $.expression)),
        prec.left(PREC.ADD, seq($.expression, "--", $.expression)),
        // ->/--> plus =>/==> so type-level lambdas and constraint arrows
        // inside [type-argument] brackets parse in expression position
        prec.right(PREC.ARROW, seq($.expression, choice("->", "-->", "=>", "==>"), $.expression)),
        // Monadic bind: x <- e; ...
        prec.right(PREC.BIND, seq($.expression, "<-", $.expression)),
        prec.left(PREC.SEMICOLON, seq($.expression, ";", $.expression)),
        prec.right(PREC.ARROW, seq($.expression, choice("::", ":::"), $.expression)),
        // Disjointness constraint
        prec.left(PREC.COMPARE, seq($.expression, "~", $.expression)),
        // Backtick-quoted infix function: a `op` b
        prec.left(PREC.BACKTICK, seq($.expression, $.backtick_operator, $.expression)),
      ),

    // `f` or `Module.f` (see BACKTICK_PATH in urweb.lex)
    backtick_operator: ($) => /`([A-Z][A-Za-z0-9_']*\.)*[a-z_][A-Za-z0-9_']*`/,

    unary_expression: ($) =>
      prec(PREC.UNARY, seq("-", $.expression)),

    fn_expression: ($) =>
      prec.right(seq(
        "fn",
        repeat1(choice(
          $._simple_pattern,
          $.type_param,
          $.constraint_param,
          // Unbracketed kind-annotated param: fn r :: {K} => ...
          $.kind_annotated_param,
          $.typed_fn_param,
        )),
        "=>",
        $.expression,
      )),

    kind_annotated_param: ($) =>
      seq(
        choice($.identifier, "_"),
        choice("::", ":::"),
        choice($._simple_type, $.record_type),
      ),

    // Unbracketed annotated param: fn opt : option t => ...
    // prec 2 beats the constraint arrow (prec 1) so `=>` ends the annotation.
    typed_fn_param: ($) =>
      prec(PREC.ARROW, seq($.identifier, ":", $.type_expression)),

    // Parenthesized kind-annotated params: fn (attrs :: {Type}) => ...
    paren_type_param: ($) =>
      seq(
        "(",
        $.identifier,
        optional(seq(choice("::", ":::"), $.type_expression)),
        repeat(seq(",", $.identifier, optional(seq(choice("::", ":::"), $.type_expression)))),
        ")",
      ),

    case_expression: ($) =>
      prec.right(
        seq(
          "case",
          $.expression,
          "of",
          optional("|"),
          $.match_arm,
          repeat(seq("|", $.match_arm)),
        ),
      ),

    match_arm: ($) =>
      seq($._pattern, "=>", $.expression),

    if_expression: ($) =>
      prec.right(
        seq("if", $.expression, "then", $.expression, optional(seq("else", $.expression))),
      ),

    let_expression: ($) =>
      seq("let", repeat($._declaration), "in", $.expression, "end"),

    type_annotation: ($) =>
      prec(0, seq($.expression, ":", $.type_expression)),

    record_expression: ($) =>
      seq(
        "{",
        optional(choice(
          "...",
          seq(
            $.record_field,
            repeat(seq(",", $.record_field)),
            optional(seq(",", optional("..."))),
          ),
        )),
        "}",
      ),

    record_field: ($) =>
      seq(field("name", choice($.identifier, $.constructor_name)), "=", $.expression),

    list_expression: ($) =>
      seq("[", optional(seq($.expression, repeat(seq(",", $.expression)))), "]"),

    projection_expression: ($) =>
      prec.left(PREC.DOT, seq(
        $.expression,
        ".",
        choice($.identifier, $.constructor_name, alias(/[0-9]+/, $.integer_literal)),
      )),

    at_expression: ($) =>
      prec(PREC.UNARY, seq("@", $.expression)),

    double_at_expression: ($) =>
      prec(PREC.UNARY, seq("@@", $.expression)),

    dollar_expression: ($) =>
      prec(PREC.UNARY, seq("$", $.expression)),

    // #field - field name literal (e.g. #Name, #1)
    field_name: ($) =>
      prec(PREC.FIELD, seq("#", token.immediate(choice(/[A-Za-z][A-Za-z0-9_']*/, /[0-9]+/)))),

    module_qualified: ($) =>
      prec.right(PREC.DOT, seq(
        $.constructor_name,
        ".",
        choice($.identifier, $.constructor_name, $.module_qualified),
      )),

    // ========== SQL expressions ==========

    sql_expression: ($) => $.sql_keyword,

    sql_keyword: ($) =>
      alias(choice(...SQL_KEYWORDS), $.sql_keyword_value),

    // ========== XML expressions ==========

    xml_expression: ($) =>
      choice(
        seq(
          $.xml_open_tag,
          repeat($._xml_content),
          $.xml_close_tag,
        ),
        // <xml/>
        $.xml_self_closing_tag,
      ),

    // Tag names are Ur identifiers (tagHead resolves to EVar in urweb.grm).
    // Reusing the identifier token avoids a lexical conflict with the
    // infix `<` operator: after `a < b`, the lexer would otherwise prefer
    // a distinct xml_tag_name token for `b` and kill the comparison parse.
    _xml_tag_name: ($) => alias($.identifier, $.xml_tag_name),

    xml_open_tag: ($) =>
      seq("<", $._xml_tag_name, repeat(choice($.xml_attribute, $.xml_embedded_expression)), ">"),

    xml_close_tag: ($) =>
      seq("</", $._xml_tag_name, ">"),

    xml_self_closing_tag: ($) =>
      seq("<", $._xml_tag_name, repeat(choice($.xml_attribute, $.xml_embedded_expression)), "/>"),

    // Attribute value is optional: <input disabled/>.
    // Like tag names, plain attribute names reuse the identifier token to
    // avoid lexical conflicts with keywords (e.g. `then` after `a < b`).
    // Hyphenated names (data-*, aria-*) get their own token; it cannot
    // collide with keywords since keywords contain no hyphen.
    xml_attribute: ($) =>
      seq(
        choice(
          alias($.identifier, $.xml_attribute_name),
          alias($._hyphenated_attribute_name, $.xml_attribute_name),
        ),
        optional(seq("=", $.xml_attribute_value)),
      ),

    _hyphenated_attribute_name: ($) => /[a-zA-Z][a-zA-Z0-9_]*(-[a-zA-Z0-9_]+)+/,

    xml_attribute_value: ($) =>
      choice(
        $.string_literal,
        $.integer_literal,
        $.float_literal,
        $.xml_embedded_expression,
      ),

    xml_embedded_expression: ($) =>
      seq("{", $.expression, "}"),

    _xml_content: ($) =>
      choice(
        $.xml_expression,
        $.xml_embedded_expression,
        $.xml_comment,
        $.xml_text,
      ),

    xml_comment: ($) =>
      token(seq("<!--", repeat(choice(/[^-]+/, /-+[^->]/)), /--+>/)),

    xml_text: ($) => /[^<{}&]+/,

    // ========== Patterns ==========

    _pattern: ($) =>
      choice(
        $._simple_pattern,
        $.constructor_pattern,
        $.cons_pattern,
        $.as_pattern,
        $.typed_pattern,
        $.list_pattern,
      ),

    _simple_pattern: ($) =>
      choice(
        $.identifier,
        $.wildcard_pattern,
        $.integer_literal,
        seq("-", $.integer_literal),
        $.string_literal,
        $.char_literal,
        $.unit_expression,
        $.tuple_pattern,
        $.record_pattern,
        seq("(", $._pattern, ")"),
      ),

    wildcard_pattern: ($) => "_",

    constructor_pattern: ($) =>
      prec.left(PREC.APP, seq(
        choice($.constructor_name, $.module_qualified),
        optional(choice(
          $._simple_pattern,
          $.list_pattern,
          $.constructor_name,
          $.module_qualified,
        )),
      )),

    cons_pattern: ($) =>
      prec.right(PREC.PIPE, seq($._pattern, "::", $._pattern)),

    as_pattern: ($) =>
      seq($._pattern, "as", $.identifier),

    typed_pattern: ($) =>
      seq($._pattern, ":", $.type_expression),

    record_pattern: ($) =>
      seq(
        "{",
        optional(
          seq($.record_pattern_field, repeat(seq(",", $.record_pattern_field))),
        ),
        optional(seq(",", "...")),
        "}",
      ),

    record_pattern_field: ($) =>
      seq(
        field("name", choice($.identifier, $.constructor_name, $.integer_literal)),
        optional(seq("=", $._pattern)),
      ),

    list_pattern: ($) =>
      seq("[", optional(seq($._pattern, repeat(seq(",", $._pattern)))), "]"),

    tuple_pattern: ($) =>
      seq("(", $._pattern, repeat1(seq(",", $._pattern)), ")"),

    // ========== Terminals ==========

    constructor_name: ($) => /[A-Z][a-zA-Z0-9_']*/,

    identifier: ($) => /[a-z_][a-zA-Z0-9_']*/,

    integer_literal: ($) =>
      choice(
        /[0-9]+/,
        /0x[0-9a-fA-F]+/,
      ),

    float_literal: ($) => /[0-9]+\.[0-9]*([eE][+-]?[0-9]+)?/,

    // Ur/Web strings may be delimited by " or ' (see urweb.lex)
    string_literal: ($) =>
      choice(
        seq('"', repeat(choice(/[^"\\]+/, $.escape_sequence)), '"'),
        seq("'", repeat(choice(/[^'\\]+/, $.escape_sequence)), "'"),
      ),

    escape_sequence: ($) =>
      token.immediate(choice(
        /\\[\\'"nrt]/,
        /\\[0-9]{3}/,
        /\\x[0-9a-fA-F]{2}/,
      )),

    char_literal: ($) =>
      seq("#", token.immediate('"'), choice(/[^"\\]/, $.escape_sequence), '"'),

    comment: ($) =>
      seq(
        "(*",
        repeat(choice(
          $.comment,                // nested comments
          /[^*(]+/,                 // any chars except * and (
          /\*+[^*)]/,               // run of * not ending the comment
          /\(/,                     // ( not starting a nested comment
        )),
        /\*+\)/,                    // run of * then ) closes the comment
      ),
  },
});
