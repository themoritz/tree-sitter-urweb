# Ur/Web Tree-sitter for Neovim

Tree-sitter grammars for Ur/Web source files (`.ur`, `.urs`) and project files (`.urp`).

## Prerequisites

- Neovim 0.11+
- [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter)
- `tree-sitter-cli` installed globally: `npm install -g tree-sitter-cli`

## Build the parsers

```bash
# Ur/Web source grammar (has an external scanner: src/scanner.c)
cd tree-sitter-urweb
npm install
npx tree-sitter generate
cc -o parser.so -shared -fPIC -I src src/parser.c src/scanner.c

# Ur/Web project file grammar
cd ../tree-sitter-urweb-project
npm install
npx tree-sitter generate
cc -o urweb_project.so -shared -fPIC -I src src/parser.c
```

## Neovim configuration

### 1. Register filetypes

In your Neovim settings (e.g. `lua/settings.lua`):

```lua
vim.filetype.add {
  extension = {
    ur = 'urweb',
    urs = 'urweb',
    urp = 'urp',
  },
}
```

### 2. Register parsers with nvim-treesitter

In your treesitter plugin config, parser registration must happen both immediately
and on the `TSUpdate` autocmd, because `reload_parsers()` wipes `package.loaded`
and loses custom parser entries.

```lua
config = function()
  local function register_urweb()
    local parsers = require('nvim-treesitter.parsers')
    parsers.urweb = {
      install_info = {
        path = '/path/to/tree-sitter-urweb',
        generate = false,
        generate_from_json = false,
        queries = 'queries',
      },
    }
    parsers.urweb_project = {
      install_info = {
        path = '/path/to/tree-sitter-urweb-project',
        generate = false,
        generate_from_json = false,
        queries = 'queries',
      },
    }
  end

  register_urweb()
  vim.api.nvim_create_autocmd('User', {
    pattern = 'TSUpdate',
    callback = register_urweb,
  })

  -- Map parser languages to filetypes
  vim.treesitter.language.register('urweb', { 'ur', 'urs' })
  vim.treesitter.language.register('urweb_project', { 'urp' })

  -- Custom parsers need explicit vim.treesitter.start() in Neovim 0.11
  vim.api.nvim_create_autocmd('FileType', {
    pattern = { 'urweb', 'ur', 'urs', 'urp' },
    callback = function()
      vim.treesitter.start()
    end,
  })

  require('nvim-treesitter').setup {
    -- your other config ...
  }
end,
```

### 3. Install the parsers

Open Neovim and run:

```vim
:TSInstall urweb
:TSInstall urweb_project
```

## Query files

### Ur/Web (`tree-sitter-urweb/queries/`)

- `highlights.scm` — Syntax highlighting (keywords, types, constructors, strings, XML tags, SQL, etc.)
- `locals.scm` — Local variable scoping
- `folds.scm` — Code folding
- `indents.scm` — Auto-indentation

### Ur/Web Project (`tree-sitter-urweb-project/queries/`)

- `highlights.scm` — Directive names, arguments, module references, comments

## Troubleshooting

**`:TSInstall` hangs at "Compiling parser"**: Make sure `tree-sitter-cli` is installed globally (`npm install -g tree-sitter-cli`).

**"skipping unsupported language: urweb"**: The `TSUpdate` event wipes custom parser registrations. Make sure you re-register in a `User TSUpdate` autocmd as shown above.

**No highlighting after opening a file**: Custom parsers in Neovim 0.11 need an explicit `vim.treesitter.start()` call via a `FileType` autocmd.
