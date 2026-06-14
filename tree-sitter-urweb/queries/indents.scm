; Ur/Web indent queries for Neovim

[
  (let_exp)
  (str)
  (sgn_term)
  (case_exp)
  (if_exp)
  (record_con_exp)
  (record_type)
  (record_con)
  (xml)
  (sql_query)
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
