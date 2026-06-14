#include "tree_sitter/parser.h"
#include <wctype.h>

enum TokenType {
  COMMENT,
  XML_TEXT,
};

void *tree_sitter_urweb_external_scanner_create(void) { return NULL; }
void tree_sitter_urweb_external_scanner_destroy(void *p) { (void)p; }
unsigned tree_sitter_urweb_external_scanner_serialize(void *p, char *b) {
  (void)p;
  (void)b;
  return 0;
}
void tree_sitter_urweb_external_scanner_deserialize(void *p, const char *b, unsigned n) {
  (void)p;
  (void)b;
  (void)n;
}

static void advance(TSLexer *lexer) { lexer->advance(lexer, false); }
static void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

// Consume the body of a nested (* ... *) block comment.  Assumes the opening
// "(*" has already been consumed.  Returns true on a well-formed comment.
static bool finish_comment(TSLexer *lexer) {
  int depth = 1;
  while (depth > 0) {
    if (lexer->eof(lexer)) return false;
    if (lexer->lookahead == '(') {
      advance(lexer);
      if (lexer->lookahead == '*') {
        advance(lexer);
        depth++;
      }
    } else if (lexer->lookahead == '*') {
      advance(lexer);
      if (lexer->lookahead == ')') {
        advance(lexer);
        depth--;
      }
    } else {
      advance(lexer);
    }
  }
  lexer->result_symbol = COMMENT;
  return true;
}

// Inside XML content, scan either a comment (which starts at "(*") or a run of
// raw character data.  A lone '(' not followed by '*' is part of the text
// (mirrors urweb.lex's `notags`).  We handle comments here too because once we
// advance past '(' to peek for '*', the comment scanner can no longer see it.
static bool scan_xml(TSLexer *lexer, const bool *valid_symbols) {
  bool consumed = false;
  while (!lexer->eof(lexer)) {
    int32_t c = lexer->lookahead;
    if (c == '<' || c == '{') break;
    if (c == '(') {
      if (!consumed) {
        // Text would be empty: this may be a comment.
        advance(lexer); // consume '('
        if (lexer->lookahead == '*' && valid_symbols[COMMENT]) {
          advance(lexer); // consume '*'
          return finish_comment(lexer);
        }
        // A lone '(' is ordinary text.
        consumed = true;
        continue;
      }
      // We already have text; stop before a possible comment so it can be
      // lexed separately on the next scan.
      lexer->mark_end(lexer);
      advance(lexer); // consume '(' (cursor only; excluded from token)
      if (lexer->lookahead == '*') {
        lexer->result_symbol = XML_TEXT;
        return true;
      }
      consumed = true;
      continue;
    }
    advance(lexer);
    consumed = true;
  }
  if (!consumed) return false;
  lexer->mark_end(lexer);
  lexer->result_symbol = XML_TEXT;
  return true;
}

bool tree_sitter_urweb_external_scanner_scan(void *payload, TSLexer *lexer,
                                             const bool *valid_symbols) {
  (void)payload;

  if (valid_symbols[XML_TEXT]) {
    return scan_xml(lexer, valid_symbols);
  }

  if (valid_symbols[COMMENT]) {
    while (iswspace(lexer->lookahead)) skip(lexer);
    if (lexer->lookahead == '(') {
      advance(lexer);
      if (lexer->lookahead == '*') {
        advance(lexer);
        return finish_comment(lexer);
      }
    }
  }

  return false;
}
