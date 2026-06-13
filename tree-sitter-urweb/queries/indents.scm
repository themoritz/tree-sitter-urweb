; Ur/Web indent queries for Neovim

[
  (let_expression)
  (struct_expression)
  (sig_expression)
  (case_expression)
  (if_expression)
  (fn_expression)
  (fun_declaration)
  (record_expression)
  (record_type)
  (xml_expression)
] @indent.begin

[
  "end"
  "}"
  "]"
  ")"
] @indent.end

[
  "in"
  "then"
  "else"
  "of"
] @indent.branch
