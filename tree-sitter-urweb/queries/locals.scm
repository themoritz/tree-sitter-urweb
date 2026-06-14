; Ur/Web locals queries for Neovim

; Scopes
(let_exp) @local.scope
(case_exp) @local.scope
(branch) @local.scope
(str) @local.scope
(vali) @local.scope

; Definitions
(vali name: (lident) @local.definition)

; References
(variable (lident) @local.reference)
