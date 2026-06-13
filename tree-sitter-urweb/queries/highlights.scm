; Ur/Web Tree-sitter highlight queries for Neovim

; ========== Keywords ==========
[
  "and"
  "case"
  "class"
  "con"
  "constraint"
  "constraints"
  "datatype"
  "else"
  "end"
  "export"
  "ffi"
  "fn"
  "fun"
  "functor"
  "if"
  "include"
  "of"
  "open"
  "let"
  "in"
  "rec"
  "sequence"
  "ensure_index"
  "sig"
  "signature"
  "cookie"
  "style"
  "task"
  "policy"
  "struct"
  "structure"
  "table"
  "view"
  "then"
  "type"
  "val"
  "where"
  "as"
] @keyword

; ========== SQL Keywords ==========
(sql_keyword_value) @keyword

; ========== Operators / Symbols ==========
[
  "="
  "=>"
  "->"
  "<-"
  "-->"
  "::"
  ":::"
  "++"
  "---"
  "--"
  "~"
  "|>"
  "<|"
  ">>>"
  "<<<"
  "||"
  "&&"
  "<>"
  "<"
  ">"
  "<="
  ">="
  "^"
  "+"
  "-"
  "*"
  "/"
  "%"
  "|"
  "@"
  "@@"
  "$"
  ";"
] @operator

; ========== Punctuation ==========
[
  "("
  ")"
  "{"
  "}"
  "["
  "]"
] @punctuation.bracket

[
  ","
  "."
  ":"
  "..."
] @punctuation.delimiter

; ========== Literals ==========
(integer_literal) @number
(float_literal) @number.float
(string_literal) @string
(escape_sequence) @string.escape
(char_literal) @character
(unit_expression) @constant.builtin

; ========== Comments ==========
(comment) @comment

; ========== Declarations ==========
(val_binding
  name: (identifier) @variable)

(fun_binding
  name: (identifier) @function)

(type_declaration
  name: (identifier) @type.definition)

(datatype_declaration
  name: (identifier) @type.definition)

(con_declaration
  name: (identifier) @type.definition)

(class_declaration
  name: (identifier) @type.definition)

(structure_declaration
  name: (constructor_name) @module)

(signature_declaration
  name: (constructor_name) @module)

(functor_declaration
  name: (constructor_name) @module)
(functor_declaration
  param_name: (constructor_name) @module)

(table_declaration
  name: (identifier) @variable)

(view_declaration
  name: (identifier) @variable)

(sequence_declaration
  name: (identifier) @variable)

(cookie_declaration
  name: (identifier) @variable)

(style_declaration
  name: (identifier) @variable)

; ========== Type parameters ==========
(type_param
  name: (identifier) @type)
(type_param
  name: (constructor_name) @type)

; ========== Constructors / Modules ==========
(constructor_def
  constructor: (constructor_name) @constructor)

(constructor_pattern
  (constructor_name) @constructor)
(constructor_expression
  (constructor_name) @constructor)

(module_path
  (constructor_name) @module)
(module_qualified
  (constructor_name) @module)

; ========== Field names ==========
(field_name) @property

; ========== Record fields ==========
(record_field
  name: (identifier) @property)
(record_field
  name: (constructor_name) @property)
(record_type_field
  name: (identifier) @property)
(record_type_field
  name: (constructor_name) @property)
(record_pattern_field
  name: (identifier) @property)
(record_pattern_field
  name: (constructor_name) @property)

; ========== Patterns ==========
(wildcard_pattern) @variable.builtin
(wildcard_expression) @variable.builtin

; ========== XML ==========
(xml_tag_name) @tag
(xml_attribute_name) @tag.attribute
(xml_text) @none

; ========== Identifiers ==========
; Must be last so more specific matches above take precedence
(constructor_name) @type
(identifier) @variable
