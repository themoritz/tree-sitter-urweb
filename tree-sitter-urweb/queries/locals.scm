; Ur/Web locals queries for Neovim

; Scopes
(let_expression) @local.scope
(fn_expression) @local.scope
(fun_binding) @local.scope
(case_expression) @local.scope
(match_arm) @local.scope
(struct_expression) @local.scope

; Definitions
(val_binding
  name: (identifier) @local.definition)

(fun_binding
  name: (identifier) @local.definition)

; References
(identifier) @local.reference
