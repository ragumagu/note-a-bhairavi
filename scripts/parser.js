var Translators = {
    kannada: new NonTamilBasicTranslator(
        NonTamilBasicTranslator.prototype.LANG_KANNADA
    ),
    sanskrit: new NonTamilBasicTranslator(
        NonTamilBasicTranslator.prototype.LANG_SANSKRIT
    ),

    telugu: new NonTamilBasicTranslator(
        NonTamilBasicTranslator.prototype.LANG_TELUGU
    ),

    malayalam: new NonTamilBasicTranslator(
        NonTamilBasicTranslator.prototype.LANG_MALAYALAM
    ),

    tamil: new TamilTranslator(true, true),
    off: null,
};

const Tokens = {
    pipe: "|",
    colon: ":",
    slash: "/",
    backSlash: "\\",
    dollar: "$",
    hash: "#",
    newLine: "\n",
    underscore: "_",
    caret: "^",
    leftBracket: "[",
    rightBracket: "]",
    leftParen: "(",
    rightParen: ")",
    pilcrow: "⁋",
    interpunct: "·",
    greater_than: ">",
};

const token_list = Object.entries(Tokens).map(([k, v]) => {
    return v;
});

const nbsp = String.fromCharCode(160);
const visible_markers = [Tokens.pipe.repeat(2), Tokens.pipe, Tokens.pilcrow];

const NodeType = {
    text: 100,
    visible_marker: 10,
    hidden_marker: 1,
};

let underline = 0;

function get_parts(text) {
    let parts = [];
    let underlines = [];
    let part = "";
    let i = 0;

    while (i < text.length) {
        if (
            text[i] === Tokens.leftParen &&
            ((text[i + 1] && text[i + 1] === Tokens.leftParen) ||
                underline === 1)
        ) {
            if (part) {
                parts.push(part);
                underlines.push(underline);
                part = "";
            }
            part += text[i];
            part += text[i + 1];
            underline = 2;
            i += 2;
            continue;
        } else if (text[i] === Tokens.leftParen) {
            if (part) {
                parts.push(part);
                underlines.push(underline);
                part = "";
            }
            part += text[i];
            underline = 1;
        } else if (text[i] === Tokens.rightParen) {
            if (text[i + 1] && text[i + 1] === Tokens.rightParen) {
                part += text[i];
                part += text[i + 1];
                parts.push(part);
                underlines.push(underline);
                part = "";
                underline = 0;
                i += 2;
                continue;
            }
            else if (text[i + 1] && text[i + 1] === Tokens.underscore){
                // Don't underline
                underline = 0;
            }

            part += text[i];
            parts.push(part);
            underlines.push(underline);
            part = "";
            underline -= 1;

        } else if (text[i] === Tokens.underscore) {
            if (underline === "subscript") {
                part += text[i];

                parts.push(part);
                underlines.push(underline);
                part = "";
                underline = 0;
            } else {
                if (part) {
                    parts.push(part);
                    underlines.push(underline);
                    part = "";
                }
                part += text[i];
                underline = "subscript";
            }
        } else if (text[i] === Tokens.caret) {
            if (underline === "superscript") {
                part += text[i];

                parts.push(part);
                underlines.push(underline);
                part = "";
                underline = 0;
            } else {
                if (part) {
                    parts.push(part);
                    underlines.push(underline);
                    part = "";
                }
                part += text[i];
                underline = "superscript";
            }
        } else {
            part += text[i];
        }
        i++;
    }
    if (part) {
        parts.push(part);
        underlines.push(underline);
    }
    return { parts: parts, underlines: underlines };
}

class TableCell {
    constructor(text) {
        this.text = text;
        this.target_length = this.text.length;
        this.alignment = "left";
        this.result = text;
        this.classes = [];
        if (visible_markers.includes(this.text)) {
            this.nodeType = NodeType.visible_marker;
        } else if (
            this.text === Tokens.interpunct ||
            this.text === Tokens.backSlash
        ) {
            this.nodeType = NodeType.hidden_marker;
        } else {
            this.nodeType = NodeType.text;
        }
    }

    get_dom_node() {
        let cell = document.createElement("span");
        if (this.text.startsWith("# ")) {
            this.classes.push("h1");
        } else if (this.text.startsWith("## ")) {
            this.classes.push("h2");
        }
        cell.classList.add(...this.classes);
        if (this.nodeType === NodeType.text) {
            let res = get_parts(this.text);
            for (let i = 0; i < res.parts.length; i++) {
                if (res.underlines[i] === 0) {
                    let text = document.createTextNode(res.parts[i]);
                    cell.appendChild(text);
                } else {
                    let span = document.createElement("span");
                    span.innerText = res.parts[i];
                    if (res.underlines[i] === 1) {
                        span.classList.add("su");
                    } else if (res.underlines[i] === 2) {
                        span.classList.add("du");
                    } else if (res.underlines[i] === "subscript") {
                        span.classList.add("subscript");
                    } else if (res.underlines[i] === "superscript") {
                        span.classList.add("superscript");
                    }
                    cell.appendChild(span);
                }
            }
        } else {
            cell.innerText = this.text;
            if (this.nodeType === NodeType.hidden_marker) {
                cell.classList.add("hidden");
                cell.classList.add("marker");
            } else if (this.nodeType === NodeType.visible_marker) {
                if (this.text === Tokens.pilcrow) {
                    cell.classList.add("pilcrow");
                }
                cell.classList.add("marker");
            }
        }

        if (this.text.trim() === Tokens.greater_than) {
            cell.classList.add("directive");
        }
        return cell;
    }
    update_alignment() {
        let spaces_to_add = this.target_length - this.result.length;
        if (spaces_to_add > 0) {
            if (this.alignment === "left") {
                this.result = this.result + " ".repeat(spaces_to_add);
            } else if (this.alignment === "right") {
                this.result = " ".repeat(spaces_to_add) + this.result;
            } else if (this.alignment === "center") {
                let left = Math.floor(spaces_to_add / 2);
                let right = spaces_to_add - left;
                this.result =
                    " ".repeat(left) + this.result + " ".repeat(right);
            }
        }
    }
}

function is_directive_line(line) {
    if (
        line.length === 3 &&
        line[0].text === ">" &&
        line[1].text.indexOf(":") > 0
    ) {
        if (
            ["language"].includes(
                line[1].text.split(":")[0].trim().toLowerCase()
            )
        ) {
            return true;
        }
    }
    return false;
}

function get_directive(line) {
    let parts = line[1].text.toLowerCase().split(":");
    let key = parts[0].trim();
    let value = parts[1].trim().split(",");
    if (value.length === 1) {
        value = value[0];
    }
    return { [key]: value };
}

function is_alignment_line(line) {
    // We use >: to mark an alignment line.
    if (line.length > 2 && line[0].text === ">:") {
        // Table rows are meant to start with markers,
        // and markers cannot be aligned --> only textual
        // content can be aligned.

        // ">:" is the first cell in the line
        // and we set it to align as left.
        let alignment = ["left"];
        for (let i = 1; i < line.length; i++) {
            let t = line[i].text.trim().toLowerCase();
            if (
                line[i].text === Tokens.newLine ||
                token_list.includes(t) ||
                t.match(/[clr]/i) ||
                line[i].text.match(/[ ]+/)
            ) {
                if (t === "r") {
                    alignment.push("right");
                } else if (t === "c") {
                    alignment.push("center");
                } else {
                    alignment.push("left");
                }
            } else {
                return false;
            }
        }
        return alignment;
    }
    return false;
}

function transliterate(lines) {
    let language_mode = "off";

    // console.log("lines", lines);
    for (let i = 0; i < lines.length; i++) {
        // console.log(lines[i], is_directive_line(lines[i]));
        if (is_directive_line(lines[i])) {
            let directives = get_directive(lines[i]);
            // console.log("directives", directives);
            if (
                "language" in directives &&
                directives["language"] in Translators
            ) {
                language_mode = directives["language"];
                // console.log("Changed language mode", language_mode);
            }
            continue;
        } else {
            if (
                language_mode !== "off" &&
                !lines[i][0].text.startsWith(Tokens.greater_than)
            ) {
                for (j = 0; j < lines[i].length; j++) {
                    lines[i][j].text = Translators[language_mode].translate(
                        lines[i][j].text
                    );
                    // lines[i][j].target_length = lines[i][j].text.length;
                    // lines[i][j].result = lines[i][j].text;
                }
            }
        }
    }
    return lines;
}

function get_lines(text) {
    let lines = [];
    let tokens = [...text];
    let i = 0;
    let line = [];
    let phrase = "";

    while (true) {
        if (i == tokens.length) {
            if (phrase.length > 0) {
                line.push(new TableCell(phrase));
                phrase = "";
            }
            if (line.length > 0) {
                lines.push(line);
                line = [];
            }
            break;
        }
        if (tokens[i] === Tokens.newLine) {
            if (phrase.length > 0) {
                line.push(new TableCell(phrase));
                phrase = "";
            }
            line.push(new TableCell(tokens[i]));
            if (line.length > 0) {
                lines.push(line);
                line = [];
            }
        } else if (
            tokens[i] === Tokens.interpunct ||
            tokens[i] === Tokens.pipe ||
            tokens[i] === Tokens.greater_than ||
            tokens[i] === Tokens.backSlash ||
            tokens[i] === Tokens.pilcrow
        ) {
            if (phrase.length > 0) {
                line.push(new TableCell(phrase));
                phrase = "";
            }
            if (
                tokens[i] === Tokens.pipe &&
                tokens[i + 1] &&
                tokens[i + 1] === Tokens.pipe
            ) {
                line.push(new TableCell(tokens[i] + tokens[i + 1]));
                i += 2;
                continue;
            } else if (
                tokens[i] === Tokens.greater_than &&
                tokens[i + 1] &&
                tokens[i + 1] === Tokens.colon
            ) {
                line.push(new TableCell(tokens[i] + tokens[i + 1]));
                i += 2;
                continue;
            } else if (
                tokens[i] === Tokens.greater_than &&
                tokens[i + 1] &&
                tokens[i + 1] === " "
            ) {
                let _phrase = ">";
                while (tokens[i + 1] === " ") {
                    _phrase += " ";
                    i++;
                }

                line.push(new TableCell(_phrase));
                continue;
            } else {
                line.push(new TableCell(tokens[i]));
            }
        } else {
            phrase += tokens[i];
        }
        i++;
    }
    return lines;
}

function isTableRow(line) {
    if (line.length > 2) {
        return true;
    }
    return false;
}

function make_tables_with_spaces(lines) {
    let tables = [];
    let current_table = null;
    let row_num = 0;
    for (let i = 0; i < lines.length; i++) {
        if (isTableRow(lines[i])) {
            if (!current_table) {
                current_table = {
                    target_lengths: [],
                    start_line_idx: i,
                    end_line_idx: i,
                    visibleMarkerIndex: [],
                    visibleMarkerSpans: [],
                };
            }
            current_table.end_line_idx = i;

            current_table.visibleMarkerIndex[row_num] = [];
            current_table.visibleMarkerSpans[row_num] = [];

            for (let j = 0; j < lines[i].length; j++) {
                if (lines[i][j].nodeType === NodeType.visible_marker) {
                    current_table.visibleMarkerIndex[row_num].push(j);
                    if (current_table.visibleMarkerIndex[row_num].length > 1) {
                        current_table.visibleMarkerSpans[row_num].push(
                            current_table.visibleMarkerIndex[row_num].at(-1) -
                                current_table.visibleMarkerIndex[row_num].at(
                                    -2
                                ) -
                                1
                        );
                    }
                }
                if (j < current_table.target_lengths.length) {
                    current_table.target_lengths[j] = Math.max(
                        lines[i][j].result.length,
                        current_table.target_lengths[j]
                    );
                } else {
                    current_table.target_lengths[j] = lines[i][j].result.length;
                }
            }
            row_num += 1;
        } else {
            if (current_table) {
                tables.push(current_table);
            }
            current_table = null;
            row_num = 0;
        }
    }

    if (current_table) {
        tables.push(current_table);
    }

    tables.forEach((table) => {
        let lengths = [];
        table.visibleMarkerSpans.forEach((l) => {
            lengths.push(l.length);
        });
        let max_j = Math.max(...lengths);
        table.max_spans = [];
        for (let j = 0; j < max_j; j++) {
            for (let i = 0; i < table.visibleMarkerSpans.length; i++) {
                if (
                    table.max_spans[j] &&
                    table.visibleMarkerSpans[i][j] &&
                    table.visibleMarkerSpans[i][j] > table.max_spans[j]
                ) {
                    table.max_spans[j] = table.visibleMarkerSpans[i][j];
                } else if (
                    !table.max_spans[j] &&
                    table.visibleMarkerSpans[i][j]
                ) {
                    table.max_spans[j] = table.visibleMarkerSpans[i][j];
                }
            }
        }
    });

    let table_idx = 0;
    let current_line_is_table = false;
    let output = [];
    current_table = [];
    // console.log("TABLES", tables);
    let max_cols = 0;
    let alignment = null;
    for (let i = 0; i < lines.length; i++) {
        if (
            (tables[table_idx] && i === tables[table_idx].start_line_idx) ||
            current_line_is_table
        ) {
            current_line_is_table = true;

            let temp = is_alignment_line(lines[i]);
            if (temp) {
                // console.log("UPDATING ALIGNMENT", temp);
                alignment = temp;
            }

            let nodes = [];

            let spans = tables[table_idx].max_spans.slice(0);
            let visible_marker_index =
                tables[table_idx].visibleMarkerIndex[
                    i - tables[table_idx].start_line_idx
                ];
            let pointer_to_visible_marker = 0;
            let column = 1;
            lines[i].forEach((cell, idx) => {
                // console.log("COLUMN", column);
                cell.classes.push("table-cell");
                if (alignment && alignment[idx]) {
                    cell.alignment = alignment[idx];
                    cell.classes.push(`text-align-${alignment[idx]}`);
                }

                cell.target_length = tables[table_idx].target_lengths[idx];
                cell.update_alignment();
                let node = cell.get_dom_node();
                node.style.gridColumn = column;
                node.style.gridRow = i - tables[table_idx].start_line_idx + 1;

                // console.log(
                //     "VISIblE marker index",
                //     visible_marker_index[pointer_to_visible_marker],
                //     idx
                // );
                if (idx > visible_marker_index[pointer_to_visible_marker]) {
                    // console.log("Updating spans");
                    spans[pointer_to_visible_marker] -= 1;
                    if (
                        idx ===
                        visible_marker_index[pointer_to_visible_marker + 1] - 1
                    ) {
                        node.style.gridColumn = `${column} / span ${
                            spans[pointer_to_visible_marker] + 1
                        }`;
                        column += spans[pointer_to_visible_marker];
                    } else if (
                        idx ===
                        visible_marker_index[pointer_to_visible_marker + 1]
                    ) {
                        pointer_to_visible_marker += 1;
                    }
                }
                nodes.push(node);

                column += 1;
            });

            if (nodes.length > max_cols) {
                max_cols = nodes.length;
            }

            let _line = document.createElement("div");
            _line.classList.add("row");
            if (is_alignment_line(lines[i]) || is_directive_line(lines[i])) {
                _line.classList.add("directive");
            }
            _line.replaceChildren(...nodes);

            current_table.push(_line);

            if (i === tables[table_idx].end_line_idx) {
                let _table = document.createElement("div");
                _table.classList.add("table");
                _table.style.gridTemplateColumns = `repeat(${max_cols},auto)`;
                _table.replaceChildren(...current_table);
                output.push(_table);

                // console.log("MADE table");
                // console.log(_table);

                max_cols = 0;
                current_table = [];
                current_line_is_table = false;
                table_idx += 1;
                alignment = null;
            }
        } else {
            let _line = document.createElement("div");
            let nodes = [];
            lines[i].forEach((cell) => {
                nodes.push(cell.get_dom_node());
            });
            _line.replaceChildren(...nodes);
            output.push(_line);
        }
    }

    // tables.forEach((table) => {
    //     for (let i = table.start_line_idx; i <= table.end_line_idx; i++) {
    //         for (let j = 0; j < lines[i].length; j++) {
    //             lines[i][j].target_length = table.target_lengths[j];
    //             lines[i][j].update_spaces();
    //         }
    //     }
    // });
    return output;
}

function parse(text, caret_position) {
    underline = 0;
    console.log("INPUT:", JSON.stringify(text));

    let lines = get_lines(text);
    lines = transliterate(lines);
    console.log("parsed content\n", lines);

    output = make_tables_with_spaces(lines);

    let aligned_text = lines
        .map((line) => {
            return line
                .map((x) => {
                    return x.result;
                })
                .join("");
        })
        .join("");
    console.log(aligned_text);

    return { nodes: output, text: aligned_text };
}
