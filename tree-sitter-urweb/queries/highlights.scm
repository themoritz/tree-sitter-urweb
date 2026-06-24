; Ur/Web tree-sitter highlight queries for Neovim

; ========== Declaration name fields (before generic identifier rules) =========
(vali name: (lident) @function)

; val binding name (val empty = ... / val f x = ...) — highlight like fun
(val_decl
  (pat
    (pat_s
      (pat_term
        (variable (lident) @function)))))

; val binding name with a type annotation (val empty : t = ...)
(val_decl
  (pat
    (pat_s
      (pat_s
        (pat_term
          (variable (lident) @function))))))

(con_decl name: (lident) @type.definition)
(type_decl name: (lident) @type.definition)
(sgi_con name: (lident) @type.definition)
(sgi_type name: (lident) @type.definition)
(sgi_con_abs name: (lident) @type.definition)
(sgi_class name: (lident) @type.definition)
(datatype name: (lident) @type.definition)
(datatype_imp_decl name: (lident) @type.definition)

(dcon name: (uident) @constructor)

; constructor application in a pattern (e.g. `Some i`)
(pat name: (uident) @constructor)

(structure_decl name: (uident) @module)
(signature_decl name: (uident) @module)
(functor_decl name: (uident) @module)
(functor_decl arg: (uident) @module)
(sgi_structure name: (uident) @module)
(sgi_functor name: (uident) @module)
(module_ref (uident) @module)

(table_decl name: (lident) @variable)
(sequence_decl name: (lident) @variable)
(view_decl name: (lident) @variable)
(cookie_decl name: (lident) @variable)
(style_decl name: (lident) @variable)
(sgi_view name: (lident) @variable)
(ffi_decl name: (lident) @function)

; ========== Keywords ==========
[
  "and"
  "case"
  "class"
  "con"
  "constraint"
  "constraints"
  "cookie"
  "datatype"
  "else"
  "end"
  "export"
  "ffi"
  "fn"
  "fun"
  "functor"
  "if"
  "in"
  "include"
  "let"
  "map"
  "of"
  "open"
  "policy"
  "rec"
  "sequence"
  "sig"
  "signature"
  "struct"
  "structure"
  "style"
  "table"
  "task"
  "then"
  "type"
  "val"
  "view"
  "where"
  "ensure_index"
] @keyword

; ========== SQL keywords ==========
[
  "SELECT" "SELECT1" "DISTINCT" "FROM" "AS" "WHERE" "SQL" "GROUP" "ORDER" "BY"
  "HAVING" "LIMIT" "OFFSET" "ALL" "JOIN" "INNER" "CROSS" "OUTER" "LEFT" "RIGHT"
  "FULL" "ON" "UNION" "INTERSECT" "EXCEPT" "INSERT" "INTO" "VALUES" "UPDATE"
  "SET" "DELETE" "IS" "NULL" "LIKE" "COALESCE" "CAST" "NOT" "AND" "OR"
  "COUNT" "AVG" "SUM" "MIN" "MAX" "STRING_AGG" "RANK" "PARTITION" "OVER"
  "ASC" "DESC" "RANDOM" "CURRENT_TIMESTAMP"
  "PRIMARY" "KEY" "FOREIGN" "REFERENCES" "UNIQUE" "CHECK" "CONSTRAINT"
  "CASCADE" "RESTRICT" "ACTION" "NO" "IF" "THEN" "ELSE"
] @keyword

[
  "TRUE"
  "FALSE"
] @constant.builtin

; ========== Operators ==========
[
  "=" "=>" "->" "<-" "-->" "==>" "::" ":::" "::_" ":::_"
  "++" "---" "--" "~" "|>" "<|" ">>>" "<<<" "||" "&&"
  "<>" "<" ">" "<=" ">=" "<->" "^" "+" "-" "*" "/" "%"
  "|" "@" "$" "#" "!"
] @operator

(backtick_path) @operator

; ========== Punctuation ==========
[ "(" ")" "{" "}" "[" "]" ] @punctuation.bracket
[ "," "." ":" "..." ";" ] @punctuation.delimiter

; ========== Literals ==========
(int) @number
(float) @number.float
(string) @string
(char) @character
(unit) @constant.builtin

; ========== Comments ==========
(comment) @comment
(xml_comment) @comment

; ========== Type-level constructor variables (int, string, ...) ==========
(variable_con (lident) @type)

; ========== Record / field labels ==========
(rpath_con) @property
(record_pat (uident) @property)
(field_exp (lident) @property)
(field_exp (uident) @property)
(field_exp (int) @property)
(sql_fident) @property
(sql_select_item (sql_tident) @variable)
(sql_group_item (sql_tident) @variable)

; ========== SQL table names ==========
(sql_table (lident) @variable)

; ========== XML ==========
(tag_name) @tag
(attr_name) @tag.attribute
(xml_close_tag) @tag
(xml_text) @none

; ========== Constructors / modules / variables (generic; keep last) ==========
(module_path) @module
(constructor) @constructor
(variable) @variable
