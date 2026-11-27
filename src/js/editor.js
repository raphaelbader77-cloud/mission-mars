import {
  EditorView,
  lineNumbers,
  keymap,
  highlightActiveLine,
  drawSelection,
  placeholder,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, historyKeymap, history } from "@codemirror/commands";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
const colors = HighlightStyle.define([
  { tag: tags.keyword, color: "#ffb27a" },
  { tag: tags.string, color: "#a3e4bc" },
  { tag: tags.number, color: "#97d4ff" },
  { tag: tags.bool, color: "#c4bbff" },
  { tag: tags.lineComment, color: "#94a4b8" },
]);
export function buildEditor(parent, doc, run, onEdit) {
  return new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        history(),
        drawSelection(),
        highlightActiveLine(),
        sql({ dialect: PostgreSQL }),
        syntaxHighlighting(colors),
        EditorView.lineWrapping,
        placeholder("Write your SQL here…"),
        EditorView.contentAttributes.of({
          "aria-label": "SQL query",
          spellcheck: "false",
        }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onEdit(u.state.doc.toString());
        }),
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              run();
              return true;
            },
          },
          ...defaultKeymap,
          ...historyKeymap,
        ]),
      ],
    }),
  });
}
