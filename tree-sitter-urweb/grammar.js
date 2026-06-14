/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Ur/Web tree-sitter grammar.
//
// This is a faithful translation of the official Ur/Web parser, found in
//   packages/urweb/src/urweb.grm  (ML-Yacc grammar)
//   packages/urweb/src/urweb.lex  (ML-Lex lexer)
// Nonterminal names and the operator-precedence table below mirror that
// grammar as closely as a GLR tree-sitter grammar allows.

// Operator precedence, lowest to highest, copied from urweb.grm's
// %right/%left/%nonassoc declarations.
const P = {
  karrow: 1, // %right KARROW
  dkarrow: 2, // %nonassoc DKARROW
  larrow: 3, // %nonassoc LARROW
  ite: 4, // %nonassoc IF THEN ELSE
  darrow: 5, // %nonassoc DARROW
  semi: 6, // %right SEMI
  orelse: 7, // %left ORELSE
  andalso: 8, // %left ANDALSO
  colon: 9, // %nonassoc COLON
  dcolon: 10, // %nonassoc DCOLON TCOLON DCOLONWILD TCOLONWILD
  setop: 11, // %left UNION INTERSECT EXCEPT ALL
  comma: 12, // %right COMMA
  join: 13, // %right JOIN INNER CROSS OUTER LEFT RIGHT FULL
  sqlor: 14, // %right OR
  sqland: 15, // %right CAND
  cmp: 16, // %nonassoc EQ NE LT LE GT GE IS LIKE
  arrow: 17, // %right ARROW
  revapp: 18, // %left REVAPP
  fwdapp: 19, // %right FWDAPP
  backtick: 20, // %left BACKTICK_PATH
  compose: 21, // %right COMPOSE ANDTHEN
  concat: 22, // %right CARET PLUSPLUS
  minusminus: 23, // %left MINUSMINUS MINUSMINUSMINUS
  add: 24, // %left PLUS MINUS
  mul: 25, // %left STAR DIVIDE MOD
  notp: 26, // %left NOT
  twiddle: 27, // %nonassoc TWIDDLE
  dollar: 28, // %nonassoc DOLLAR
  dot: 29, // %left DOT
  app: 30, // function application (juxtaposition)
  brace: 31, // %nonassoc LBRACE RBRACE
};

module.exports = grammar({
  name: "urweb",

  externals: ($) => [$.comment, $._xml_text],

  extras: ($) => [/\s/, $.comment],

  word: ($) => $.lident,

  conflicts: ($) => [
    [$.kind, $.cexp],
    [$.sql_select_item, $.sqlexp],
    [$._con, $.rpath_con],
    [$.variable, $.rpath_con],
    [$.sql_fitem],
    [$.con_decl, $.sgi_con],
    [$.type_decl, $.sgi_type],
    [$._decl, $._sgn_item],
    [$._var, $.sgi_val],
  ],

  rules: {
    // file : decls (.ur)  |  SIG sgis  |  bare sgis (.urs signature files, where
    // the real compiler synthetically prepends "sig")
    source_file: ($) =>
      choice(
        seq("sig", repeat($._sgn_item)),
        repeat($._top_item),
      ),
    _top_item: ($) => choice($._decl, $._sgn_item),

    // ---------------------------------------------------------------- lexemes
    lident: ($) => /[a-z_][A-Za-z0-9_']*/,
    uident: ($) => /[A-Z][A-Za-z0-9_']*/,

    // A run of capitalized identifiers each followed by a dot: "A.B.C."
    module_path: ($) => prec.right(token(/([A-Z][A-Za-z0-9_']*\.)+/)),

    int: ($) => choice(/[0-9]+/, /0x[0-9A-F]+/),
    float: ($) => /[0-9]+\.[0-9]*/,
    string: ($) => choice(/"(\\.|[^"\\])*"/, /'(\\.|[^'\\])*'/),
    char: ($) => /#"(\\.|[^"\\])"/,
    backtick_path: ($) => /`([A-Z][A-Za-z0-9_']*\.)*[a-z_][A-Za-z0-9_']*`/,

    // var:  optionally module-qualified lowercase identifier (a value)
    // con:  optionally module-qualified uppercase identifier (a constructor / module member)
    _var: ($) => seq(optional($.module_path), field("name", $.lident)),
    _con: ($) => seq(optional($.module_path), field("name", $.uident)),

    variable: ($) => $._var,
    constructor: ($) => $._con,

    // ---------------------------------------------------------- declarations
    _decl: ($) =>
      choice(
        $.con_decl,
        $.type_decl,
        $.datatype_decl,
        $.datatype_imp_decl,
        $.val_decl,
        $.val_rec_decl,
        $.fun_decl,
        $.signature_decl,
        $.structure_decl,
        $.functor_decl,
        $.open_decl,
        $.open_constraints_decl,
        $.constraint_decl,
        $.export_decl,
        $.table_decl,
        $.index_decl,
        $.sequence_decl,
        $.view_decl,
        $.cookie_decl,
        $.style_decl,
        $.task_decl,
        $.policy_decl,
        $.ffi_decl,
      ),

    con_decl: ($) =>
      seq("con", field("name", $.lident), repeat($._cargp), optional($._kind_ann), "=", field("body", $.cexp)),
    type_decl: ($) =>
      seq("type", field("name", $.lident), repeat($._cargp), "=", field("body", $.cexp)),

    datatype_decl: ($) => seq("datatype", sepBy1("and", $.datatype)),
    datatype_imp_decl: ($) =>
      seq("datatype", field("name", $.lident), "=", "datatype", $._var),
    datatype: ($) =>
      seq(field("name", $.lident), repeat(field("param", $.lident)), "=", optional("|"), sepBy1("|", $.dcon)),
    dcon: ($) => seq(field("name", $.uident), optional(seq("of", $.cexp))),

    val_decl: ($) => seq("val", $.pat, repeat($._earg), optional($._copt), "=", field("body", $.eexp)),
    val_rec_decl: ($) => seq("val", "rec", sepBy1("and", $.vali)),
    fun_decl: ($) => seq("fun", sepBy1("and", $.vali)),
    vali: ($) =>
      seq(field("name", $.lident), repeat($._earg), optional($._copt), "=", field("body", $.eexp)),
    _copt: ($) => seq(":", field("type", $.cexp)),

    signature_decl: ($) => seq("signature", field("name", $.uident), "=", $.sgn),
    structure_decl: ($) =>
      seq("structure", field("name", $.uident), optional(seq(":", field("signature", $.sgn))), "=", field("body", $.str)),
    functor_decl: ($) =>
      seq(
        "functor",
        field("name", $.uident),
        "(", field("arg", $.uident), ":", field("arg_signature", $.sgn), ")",
        optional(seq(":", field("result_signature", $.sgn))),
        "=", field("body", $.str),
      ),

    open_decl: ($) => seq("open", $.module_ref, optional(seq("(", $.str, ")"))),
    open_constraints_decl: ($) => seq("open", "constraints", $.module_ref),
    module_ref: ($) => seq(optional($.module_path), $.uident),

    constraint_decl: ($) => seq("constraint", $.cterm, "~", $.cterm),
    export_decl: ($) => seq("export", $.str),

    table_decl: ($) =>
      seq("table", field("name", $.lident), ":", $.cterm, optional($._primary_key), optional(","), optional($._constraints)),
    index_decl: ($) => seq("ensure_index", $._eterm, ":", $._eterm, optional(seq("in", $.cterm))),
    sequence_decl: ($) => seq("sequence", field("name", $.lident)),
    view_decl: ($) =>
      seq("view", field("name", $.lident), "=", choice($.sql_query, seq("{", $.eexp, "}"))),
    cookie_decl: ($) => seq("cookie", field("name", $.lident), ":", $.cexp),
    style_decl: ($) => seq("style", field("name", $.lident)),
    task_decl: ($) => seq("task", $._eapps, "=", field("body", $.eexp)),
    policy_decl: ($) => seq("policy", $.eexp),
    ffi_decl: ($) => seq("ffi", field("name", $.lident), repeat($.ffi_mode), ":", $.cexp),

    ffi_mode: ($) => seq($.lident, optional($.string)),

    // ----------------------------------------------------- table constraints
    _primary_key: ($) => seq("PRIMARY", "KEY", $.pk),
    pk: ($) => choice(seq("{", "{", $.eexp, "}", "}"), $.tnames),

    _constraints: ($) => $.csts,
    csts: ($) =>
      choice(
        seq("CONSTRAINT", $.tname, $.cst),
        prec.left(seq($.csts, ",", $.csts)),
        seq("{", "{", $.eexp, "}", "}"),
      ),
    cst: ($) =>
      choice(
        seq("UNIQUE", $.tnames),
        seq("CHECK", $.sqlexp),
        seq("FOREIGN", "KEY", $.tnames, "REFERENCES", $.sql_texp, "(", $.tnames_inner, ")", repeat($.pmode)),
        seq("{", $.eexp, "}"),
      ),
    pmode: ($) => seq("ON", choice("DELETE", "UPDATE"), $.prule),
    prule: ($) =>
      choice(seq("NO", "ACTION"), "RESTRICT", "CASCADE", seq("SET", "NULL")),

    tname: ($) => choice($.uident, seq("{", $.cexp, "}")),
    tnames: ($) => choice($.tname_w, seq("(", $.tnames_inner, ")")),
    tnames_inner: ($) => sepBy1(",", $.tname_w),
    tname_w: ($) => $.tname,

    // ------------------------------------------------------------ signatures
    sgn: ($) =>
      choice(
        $.sgn_term,
        prec.right(seq("functor", "(", field("arg", $.uident), ":", field("arg_signature", $.sgn), ")", ":", field("result_signature", $.sgn))),
      ),
    sgn_term: ($) =>
      choice(
        seq("sig", repeat($._sgn_item), "end"),
        $.module_ref,
        prec.left(seq($.sgn_term, "where", choice("con", "type"), $._var, "=", $.cexp)),
        seq("(", $.sgn, ")"),
      ),

    _sgn_item: ($) =>
      choice(
        // items whose signature syntax is identical to the declaration form
        $.datatype_decl,
        $.datatype_imp_decl,
        $.signature_decl,
        $.constraint_decl,
        $.table_decl,
        $.sequence_decl,
        $.cookie_decl,
        $.style_decl,
        // items whose signature syntax differs from the declaration form
        $.sgi_con_abs,
        $.sgi_con,
        $.sgi_type,
        $.sgi_val,
        $.sgi_structure,
        $.sgi_functor,
        $.sgi_include,
        $.sgi_view,
        $.sgi_class,
      ),

    sgi_con_abs: ($) => prec(1, seq("type", field("name", $.lident))),
    sgi_type: ($) =>
      seq("type", field("name", $.lident), repeat($._cargp), optional(seq("=", field("body", $.cexp)))),
    sgi_con: ($) =>
      seq("con", field("name", $.lident), repeat($._cargp), optional($._kind_ann), optional(seq("=", field("body", $.cexp)))),
    sgi_val: ($) => seq("val", field("name", $.lident), ":", $.cexp),
    sgi_structure: ($) => seq("structure", field("name", $.uident), ":", $.sgn),
    sgi_functor: ($) =>
      seq("functor", field("name", $.uident), "(", field("arg", $.uident), ":", $.sgn, ")", ":", $.sgn),
    sgi_include: ($) => seq("include", $.sgn),
    sgi_view: ($) => seq("view", field("name", $.lident), ":", $.cexp),
    sgi_class: ($) =>
      choice(
        seq("class", field("name", $.lident), optional($._kind_ann), optional(seq("=", $.cexp))),
        seq("class", field("name", $.lident), $.lident, "=", $.cexp),
        seq("class", field("name", $.lident), "(", $.lident, "::", $.kind, ")", "=", $.cexp),
      ),

    // ------------------------------------------------------------ structures
    str: ($) =>
      choice(
        seq("struct", repeat($._decl), "end"),
        $.struct_path,
        prec.right(seq("functor", "(", field("arg", $.uident), ":", field("arg_signature", $.sgn), ")", optional(seq(":", field("result_signature", $.sgn))), "=>", field("body", $.str))),
        prec(1, seq($.struct_path, "(", $.str, ")")),
      ),
    struct_path: ($) => seq(optional($.module_path), $.uident),

    // ------------------------------------------------------------------ kinds
    _kind_ann: ($) => choice(seq("::", $.kind), "::_"),
    kind: ($) =>
      choice(
        seq("{", $.kind, "}"),
        prec.right(seq($.kind, "->", $.kind)),
        seq("(", $.kind, ")"),
        "__",
        seq("(", $.kind_tuple, ")"),
        $.uident,
        prec.right(seq($.uident, "-->", $.kind)),
      ),
    kind_tuple: ($) => sepBy2("*", $.kind),

    // ------------------------------------------------------ constructors/types
    capps: ($) => choice($.cterm, prec.left(P.app, seq($.capps, $.cterm))),

    cexp: ($) =>
      choice(
        $.capps,
        prec.right(P.arrow, seq($.cexp, "->", $.cexp)),
        prec.right(P.arrow, seq($.lident, $._kcolon, $.kind, "->", $.cexp)),
        prec.right(P.karrow, seq($.uident, "-->", $.cexp)),
        prec.right(P.concat, seq($.cexp, "++", $.cexp)),
        prec.right(P.darrow, seq("fn", repeat1($._carg), "=>", $.cexp)),
        prec.right(P.darrow, seq("[", $.cexp, "~", $.cexp, "]", "=>", $.cexp)),
        prec.right(P.dkarrow, seq($.uident, "==>", $.cexp)),
        seq("(", $.cexp, ")", "::", $.kind),
        seq("_", "::", $.kind),
        $.con_tuple,
      ),
    con_tuple: ($) => prec(P.mul, sepBy2("*", $.capps)),

    _kcolon: ($) => choice("::", ":::"),

    cterm: ($) =>
      choice(
        seq("(", $.cexp, ")"),
        $.record_con,
        $.record_type,
        seq("$", $.cterm),
        seq("#", choice($.uident, $.int)),
        $.variable_con,
        $.con_proj,
        "_",
        "map",
        $.unit,
        seq("(", $.con_tuple_v, ")"),
      ),
    variable_con: ($) => $._var,
    con_proj: ($) => seq($._var, ".", $.int),
    con_tuple_v: ($) => sepBy2(",", $.cexp),

    // [A = t, ...] or [A, ...]  (trailing comma allowed)
    record_con: ($) =>
      choice(
        seq("[", commaT(seq($.rpath_con, "=", $.cexp)), "]"),
        seq("[", comma1T($.rpath_con), "]"),
      ),
    // { A : t, ... }  (trailing comma allowed)
    record_type: ($) => seq("{", commaT(seq($.rpath_con, ":", $.cexp)), "}"),
    rpath_con: ($) => choice($._var, $.uident),

    // cargp: an unannotated type-parameter binder (used in con/type/class decls)
    _cargp: ($) =>
      choice(
        $.lident,
        "_",
        seq("(", $.lident, optional($._kind_ann), repeat(seq(",", $.lident, optional($._kind_ann))), ")"),
      ),
    // carg: a type-parameter binder for `fn` abstractions (allows `:: kind`)
    _carg: ($) =>
      choice(
        seq($.lident, "::", $.kind),
        seq("_", "::", $.kind),
        seq($.lident, "::_"),
        seq("_", "::_"),
        $._cargp,
      ),

    // --------------------------------------------------------- expressions
    _eapps: ($) =>
      choice(
        $._eterm,
        prec.left(P.app, seq($._eapps, $._eterm)),
        prec.left(P.app, seq($._eapps, "[", $.cexp, "]")),
        prec.left(P.app, seq($._eapps, "!")),
      ),

    eexp: ($) =>
      choice(
        $._eapps,
        prec.right(P.darrow, seq("fn", repeat1($._earg), optional(seq(":", field("type", $.cexp))), "=>", $.eexp)),
        prec.right(P.dkarrow, seq($.uident, "==>", $.eexp)),
        prec.left(P.colon, seq($.eexp, ":", $.cexp)),
        prec.left(P.minusminus, seq($.eexp, "--", $.cexp)),
        prec.left(P.minusminus, seq($.eexp, "---", $.cexp)),
        $.case_exp,
        $.if_exp,
        $.bind_exp,
        prec.right(P.semi, seq($.eexp, ";", $.eexp)),
        prec.left(P.cmp, seq($.eexp, "=", $.eexp)),
        prec.left(P.cmp, seq($.eexp, "<>", $.eexp)),
        prec.left(P.cmp, seq($.eexp, "<", $.eexp)),
        prec.left(P.cmp, seq($.eexp, "<=", $.eexp)),
        prec.left(P.cmp, seq($.eexp, ">", $.eexp)),
        prec.left(P.cmp, seq($.eexp, ">=", $.eexp)),
        prec.right(P.notp, seq("-", $._eterm)),
        prec.left(P.add, seq($.eexp, "+", $.eexp)),
        prec.left(P.add, seq($.eexp, "-", $.eexp)),
        prec.left(P.mul, seq($._eapps, "*", $.eexp)),
        prec.left(P.mul, seq($.eexp, "/", $.eexp)),
        prec.left(P.mul, seq($.eexp, "%", $.eexp)),
        prec.right(P.fwdapp, seq($.eexp, "<|", $.eexp)),
        prec.left(P.revapp, seq($.eexp, "|>", $.eexp)),
        prec.right(P.compose, seq($.eexp, "<<<", $.eexp)),
        prec.right(P.compose, seq($.eexp, ">>>", $.eexp)),
        prec.left(P.backtick, seq($.eexp, $.backtick_path, $.eexp)),
        prec.left(P.andalso, seq($.eexp, "&&", $.eexp)),
        prec.left(P.orelse, seq($.eexp, "||", $.eexp)),
        prec.right(P.concat, seq($.eexp, "++", $.eexp)),
        prec.right(P.concat, seq($.eexp, "^", $.eexp)),
        prec.right(P.dcolon, seq($._eapps, "::", $.eexp)),
      ),

    case_exp: ($) =>
      prec.right(P.ite, seq("case", $.eexp, "of", optional("|"), sepBy1("|", $.branch))),
    branch: ($) => prec.right(seq($.pat, "=>", $.eexp)),
    if_exp: ($) =>
      prec.right(P.ite, seq("if", $.eexp, "then", $.eexp, "else", $.eexp)),
    bind_exp: ($) =>
      prec.right(P.larrow, seq($._eapps, "<-", $.eexp, ";", $.eexp)),

    _earg: ($) =>
      choice(
        $.pat_term,
        seq("[", $.lident, "]"),
        seq("[", $.lident, "::_", "]"),
        seq("[", $.lident, $._kcolon, $.kind, "]"),
        seq("[", $.lident, ":::_", "]"),
        seq("[", $.cexp, "~", $.cexp, "]"),
        seq("[", $.uident, "]"),
      ),

    _eterm: ($) =>
      choice(
        seq("(", $.eexp, ")"),
        $.tuple_exp,
        $.variable,
        $.constructor,
        seq("@", $._var),
        seq("@", "@", $._var),
        seq("@", $._con),
        seq("@", "@", $._con),
        $.record_con_exp,
        $.unit,
        $.int,
        $.float,
        $.string,
        $.char,
        $.field_exp,
        "_",
        $.xml,
        $.let_exp,
        $.list_nil,
        seq("(", $.sql_query, ")"),
        seq("(", "WHERE", $.sqlexp, ")"),
        seq("(", "SQL", $.sqlexp, ")"),
        seq("(", "FROM", $.sql_tables, ")"),
        seq("(", "SELECT1", $.sql_query1, ")"),
        $.sql_insert,
        $.sql_update,
        $.sql_delete,
      ),

    tuple_exp: ($) => seq("(", sepBy2(",", $.eexp), ")"),
    unit: ($) => "()",
    list_nil: ($) => seq("[", "]"),

    record_con_exp: ($) =>
      seq("{", choice("...", commaT(choice("...", seq($.rpath_con, "=", $.eexp)))), "}"),

    // record / module projection:  e.Foo.Bar   or  _.Foo
    field_exp: ($) =>
      prec.left(
        P.dot,
        seq(
          choice($.variable, seq("(", $.eexp, ")"), seq("@", $._var), seq("@", "@", $._var), "_"),
          repeat1(seq(".", $._ident)),
        ),
      ),
    _ident: ($) => choice($.uident, $.int, $.lident),

    let_exp: ($) =>
      choice(
        seq("let", repeat($._edecl), "in", $.eexp, "end"),
        seq("let", $.eexp, "where", repeat($._edecl), "end"),
      ),
    _edecl: ($) =>
      choice(
        seq("val", $.pat, "=", $.eexp),
        seq("val", "rec", sepBy1("and", $.vali)),
        seq("fun", sepBy1("and", $.vali)),
      ),

    // --------------------------------------------------------------- patterns
    pat: ($) =>
      choice(
        $.pat_s,
        prec(1, seq($._con, $.pat_term)),
      ),
    pat_s: ($) =>
      choice(
        $.pat_term,
        prec.right(P.dcolon, seq($.pat_term, "::", $.pat_s)),
        prec.left(P.colon, seq($.pat_s, ":", $.cexp)),
      ),
    pat_term: ($) =>
      choice(
        $.variable,
        $.constructor,
        "_",
        $.int,
        seq("-", $.int),
        $.string,
        $.char,
        seq("(", $.pat, ")"),
        $.unit,
        $.record_pat,
        seq("(", sepBy2(",", $.pat), ")"),
        $.list_nil,
      ),
    record_pat: ($) =>
      seq("{", optional(choice("...", sepBy1(",", choice("...", seq(choice($.uident, $.int), "=", $.pat))))), "}"),

    // ------------------------------------------------------------------- XML
    xml: ($) =>
      choice(
        seq($.xml_open_tag, repeat($._xml_node), $.xml_close_tag),
        $.xml_singleton,
      ),
    xml_open_tag: ($) => seq($._tag_lt, repeat($.xml_attr), ">"),
    xml_singleton: ($) => seq($._tag_lt, repeat($.xml_attr), "/", ">"),
    xml_close_tag: ($) => token(/<\/[A-Za-z][A-Za-z0-9_-]*>/),
    _tag_lt: ($) => seq(alias($._tag_open, $.tag_name), repeat(seq("{", $.cexp, "}"))),
    _tag_open: ($) => token(/<[A-Za-z][A-Za-z0-9_-]*/),

    xml_attr: ($) => seq(alias($._attr_name, $.attr_name), optional(seq("=", $._attrv))),
    _attr_name: ($) => token(/[A-Za-z][A-Za-z0-9_-]*/),
    _attrv: ($) => choice($.int, $.float, $.string, seq("{", $.eexp, "}")),

    _xml_node: ($) =>
      choice(
        alias($._xml_text, $.xml_text),
        $.xml,
        $.xml_antiquote,
        $.xml_comment,
      ),
    xml_comment: ($) => token(/<!--([^-]|-[^-]|--+[^->])*--+>/),
    xml_antiquote: ($) =>
      choice(
        prec(2, seq("{", "[", $.eexp, "]", "}")),
        prec(1, seq("{", $.eexp, "}")),
      ),

    // ------------------------------------------------------------------- SQL
    sql_query: ($) => seq($.sql_query1, optional($.sql_orderby), optional($.sql_limit), optional($.sql_offset)),

    sql_query1: ($) =>
      choice(
        seq(
          "SELECT", optional("DISTINCT"), $.sql_select, "FROM", $.sql_tables,
          optional($.sql_where), optional($.sql_groupby), optional($.sql_having),
        ),
        prec.left(P.setop, seq($.sql_query1, "UNION", optional("ALL"), $.sql_query1)),
        prec.left(P.setop, seq($.sql_query1, "INTERSECT", optional("ALL"), $.sql_query1)),
        prec.left(P.setop, seq($.sql_query1, "EXCEPT", optional("ALL"), $.sql_query1)),
        seq("{", "{", "{", $.eexp, "}", "}", "}"),
      ),

    sql_select: ($) => choice("*", sepBy1(",", $.sql_select_item)),
    sql_select_item: ($) =>
      choice(
        prec(2, seq($.sql_tident, ".", $.sql_fident)),
        prec(2, seq($.sql_tident, ".", "{", "{", $.cexp, "}", "}")),
        prec(2, seq($.sql_tident, ".", "*")),
        $.sqlexp,
        seq($.sqlexp, "AS", $.sql_fident),
      ),

    sql_tables: ($) => sepBy1(",", $.sql_fitem),
    sql_fitem: ($) =>
      choice(
        $.sql_table_item,
        seq("{", "{", $.eexp, "}", "}"),
        prec.left(P.join, seq($.sql_fitem, "JOIN", $.sql_fitem, "ON", $.sqlexp)),
        prec.left(P.join, seq($.sql_fitem, "INNER", "JOIN", $.sql_fitem, "ON", $.sqlexp)),
        prec.left(P.join, seq($.sql_fitem, "CROSS", "JOIN", $.sql_fitem)),
        prec.left(P.join, seq($.sql_fitem, "LEFT", optional("OUTER"), "JOIN", $.sql_fitem, "ON", $.sqlexp)),
        prec.left(P.join, seq($.sql_fitem, "RIGHT", optional("OUTER"), "JOIN", $.sql_fitem, "ON", $.sqlexp)),
        prec.left(P.join, seq($.sql_fitem, "FULL", optional("OUTER"), "JOIN", $.sql_fitem, "ON", $.sqlexp)),
        seq("(", $.sql_query, ")", "AS", $.tname),
        seq("(", "{", "{", $.eexp, "}", "}", ")", "AS", $.tname),
        seq("(", $.sql_fitem, ")"),
      ),
    sql_table_item: ($) => $.sql_table,
    sql_table: ($) =>
      choice(
        $.lident,
        seq($.lident, "AS", $.tname),
        seq("{", "{", $.eexp, "}", "}", "AS", $.tname),
      ),

    sql_tident: ($) => choice($.lident, $.uident, seq("{", "{", $.cexp, "}", "}")),
    sql_fident: ($) => choice($.uident, seq("{", $.cexp, "}")),
    sql_texp: ($) => choice($.lident, seq("{", "{", $.eexp, "}", "}")),

    sqlexp: ($) =>
      choice(
        "TRUE",
        "FALSE",
        $.int,
        $.float,
        $.string,
        "CURRENT_TIMESTAMP",
        "NULL",
        prec(2, seq($.sql_tident, ".", $.sql_fident)),
        $.uident,
        seq("{", $.eexp, "}"),
        seq("{", "[", $.eexp, "]", "}"),
        prec.left(P.cmp, seq($.sqlexp, "=", $.sqlexp)),
        prec.left(P.cmp, seq($.sqlexp, "<>", $.sqlexp)),
        prec.left(P.cmp, seq($.sqlexp, "<", $.sqlexp)),
        prec.left(P.cmp, seq($.sqlexp, "<=", $.sqlexp)),
        prec.left(P.cmp, seq($.sqlexp, ">", $.sqlexp)),
        prec.left(P.cmp, seq($.sqlexp, ">=", $.sqlexp)),
        prec.left(P.add, seq($.sqlexp, "+", $.sqlexp)),
        prec.left(P.add, seq($.sqlexp, "-", $.sqlexp)),
        prec.left(P.mul, seq($.sqlexp, "*", $.sqlexp)),
        prec.left(P.mul, seq($.sqlexp, "/", $.sqlexp)),
        prec.left(P.mul, seq($.sqlexp, "%", $.sqlexp)),
        prec.right(P.sqland, seq($.sqlexp, "AND", $.sqlexp)),
        prec.right(P.sqlor, seq($.sqlexp, "OR", $.sqlexp)),
        prec.left(P.cmp, seq($.sqlexp, "LIKE", $.sqlexp)),
        prec.left(P.cmp, seq($.sqlexp, "<->", $.sqlexp)),
        prec.right(P.notp, seq("NOT", $.sqlexp)),
        prec.right(P.notp, seq("-", $.sqlexp)),
        prec.left(P.cmp, seq($.sqlexp, "IS", "NULL")),
        prec.right(seq("IF", $.sqlexp, "THEN", $.sqlexp, "ELSE", $.sqlexp)),
        seq("(", $.sqlexp, ")"),
        $.sql_agg,
        $.sql_func,
        seq("(", $.sql_query, ")"),
      ),

    sql_agg: ($) =>
      choice(
        seq("COUNT", "(", "*", ")", optional($.sql_window)),
        seq("COUNT", "(", $.sqlexp, ")", optional($.sql_window)),
        seq(choice("AVG", "SUM", "MIN", "MAX"), "(", $.sqlexp, ")", optional($.sql_window)),
        seq("STRING_AGG", "(", $.sqlexp, ",", $.sql_string, ")", optional($.sql_window)),
        seq("RANK", "(", ")", $.sql_window),
        seq("RANK", $.unit, $.sql_window),
      ),
    sql_func: ($) =>
      choice(
        seq("COALESCE", "(", $.sqlexp, ",", $.sqlexp, ")"),
        seq("CAST", "(", $.sqlexp, "AS", $.uident, ")"),
        seq($.sql_fname, "(", $.sqlexp, ")"),
        seq($.sql_fname, "(", $.lident, "FROM", $.sqlexp, ")"),
        seq($.sql_fname, "(", $.sqlexp, ",", $.sqlexp, ")"),
      ),
    sql_fname: ($) => choice($.lident, seq("{", $.eexp, "}")),
    sql_string: ($) => choice($.string, seq("{", $.eexp, "}")),

    sql_window: ($) => seq("OVER", "(", optional($.sql_partition), optional($.sql_orderby), ")"),
    sql_partition: ($) => seq("PARTITION", "BY", $.sqlexp),

    sql_where: ($) => seq("WHERE", $.sqlexp),
    sql_groupby: ($) => seq("GROUP", "BY", sepBy1(",", $.sql_group_item)),
    sql_group_item: ($) =>
      choice(
        seq($.sql_tident, ".", $.sql_fident),
        seq($.sql_tident, ".", "{", "{", $.cexp, "}", "}"),
      ),
    sql_having: ($) => seq("HAVING", $.sqlexp),

    sql_orderby: ($) =>
      choice(
        seq("ORDER", "BY", $.sql_obexps),
        seq("ORDER", "BY", "{", "{", "{", $.eexp, "}", "}", "}"),
      ),
    sql_obexps: ($) =>
      choice(
        sepBy1(",", $.sql_obitem),
        seq("RANDOM", optional(choice($.unit, seq("(", ")")))),
      ),
    sql_obitem: ($) => seq($.sqlexp, optional($.sql_dir)),
    sql_dir: ($) => choice("ASC", "DESC", seq("{", $.eexp, "}")),

    sql_limit: ($) =>
      choice(seq("LIMIT", "ALL"), seq("LIMIT", $.sql_int)),
    sql_offset: ($) => seq("OFFSET", $.sql_int),
    sql_int: ($) => choice($.int, seq("{", $.eexp, "}")),

    sql_insert: ($) =>
      seq("(", "INSERT", "INTO", $.sql_texp, "(", sepBy1(",", $.sql_fident), ")", "VALUES", "(", sepBy1(",", $.sqlexp), ")", ")"),
    sql_update: ($) =>
      seq("(", "UPDATE", $.sql_texp, "SET", sepBy1(",", seq($.sql_fident, "=", $.sqlexp)), "WHERE", $.sqlexp, ")"),
    sql_delete: ($) =>
      seq("(", "DELETE", "FROM", $.sql_texp, "WHERE", $.sqlexp, ")"),
  },
});

function sepBy1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)));
}
function sepBy2(sep, rule) {
  return seq(rule, repeat1(seq(sep, rule)));
}
function sepBy(sep, rule) {
  return optional(sepBy1(sep, rule));
}
// comma-separated list with an optional trailing comma
function comma1T(rule) {
  return seq(rule, repeat(seq(",", rule)), optional(","));
}
function commaT(rule) {
  return optional(comma1T(rule));
}
