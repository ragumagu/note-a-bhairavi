function _add_text(inp_text) {
    let sel = window.getSelection();
    if (sel.anchorNode.nodeType === 3) {
        let offset = sel.anchorOffset + inp_text.length;
        let prefix = sel.anchorNode.nodeValue.substring(0, sel.anchorOffset);
        let suffix = sel.anchorNode.nodeValue.substring(sel.anchorOffset);
        sel.anchorNode.nodeValue = prefix + inp_text + suffix;

        var range = document.createRange();
        range.setStart(sel.anchorNode, offset);
        range.collapse(true);

        sel.removeAllRanges();
        sel.addRange(range);
    } else {
        console.log("selection is not a textnode");
        sel.anchorNode.innerText += inp_text;
        sel.anchorNode.focus();

        var range = document.createRange();
        range.setStart(sel.anchorNode, sel.anchorNode.innerText.length);
        range.collapse(true);

        sel.removeAllRanges();
        sel.addRange(range);
    }
}

function add_text(e){
    _add_text(e.target.value);
}

document
    .getElementById("aksharas_table")
    .querySelectorAll("button")
    .forEach((button) => {
        button.onclick = add_text;
    });

function editor_on_input(e) {
    /*
    Main's innerText will always have one \n in it.
    Even if you select all, and press delete or backspace,
    it will still have \n in it. And innerHTML will have <br> in it.
    */

    if (e.data === Tokens.pipe) {
        var sel = window.getSelection();

        let a = sel.anchorNode;
        if (a.nodeType === 3) {
            a = a.parentNode;
        }

        let div = a.closest("div");

        if (
            div.innerText.startsWith("||") &&
            (sel.anchorOffset == 1 || sel.anchorOffset == 2)
        ) {
            e.preventDefault();
            let text = div.innerText.trim();

            let start = 0;
            if (text.startsWith("||")) {
                start = 2;
            } else if (text.startsWith("|")) {
                start = 1;
            }
            text = text.substring(start);
            start = 0;
            let end = text.length;

            if (text.endsWith("||")) {
                end = text.length - 2;
            } else if (text.endsWith("|")) {
                end = text.length - 1;
            }
            text = text.substring(0, end).trim();
            console.log(
                "text after removing row markers",
                JSON.stringify(text)
            );
            text = "||" + nbsp + text + nbsp + "||" + nbsp + "\n";

            let row_content = parse(text);
            div.replaceChildren(...row_content[0].childNodes);
            div.classList.add("row");

            var range = document.createRange();
            range.setStart(
                div.querySelector(".letter-group").firstChild.firstChild,
                1
            );
            range.collapse(true);

            sel.removeAllRanges();
            sel.addRange(range);
        }
    } else if (e.data === Tokens.slash) {
        var sel = window.getSelection();

        let a = sel.anchorNode;
        if (a.nodeType === 3) {
            a = a.parentNode;
        }

        let div = a.closest("div");

        if (
            div.innerText.startsWith("//") &&
            (sel.anchorOffset == 1 || sel.anchorOffset == 2)
        ) {
            e.preventDefault();
            let text = div.innerText.trim();

            let start = 0;
            if (text.startsWith("//")) {
                start = 2;
            } else if (text.startsWith("/")) {
                start = 1;
            }
            text = text.substring(start);
            start = 0;
            let end = text.length;

            if (text.endsWith("//")) {
                end = text.length - 2;
            } else if (text.endsWith("/") || text.endsWith("⁋")) {
                end = text.length - 1;
            }

            text = text.substring(0, end).trim();
            console.log(
                "text after removing row markers",
                JSON.stringify(text)
            );

            text = "⁋" + nbsp + text + nbsp + "⁋" + "\n";

            let row_content = parse(text);
            div.replaceChildren(...row_content[0].childNodes);
            div.classList.add("row");

            var range = document.createRange();

            range.setStart(
                div.querySelector(".letter-group").firstChild.firstChild,
                1
            );
            range.collapse(true);

            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    apply_formatting(e.target);
    localStorage.setItem("input_string", get_editor_text_content(e.target));
}

function remove_row_markers(row, marker) {
    let text = row.innerText.trim();
    while (text.startsWith(marker)) {
        text = text.substring(1).trim();
    }
    while (text.endsWith(marker)) {
        text = text.substring(0, text.length - 1).trim();
    }

    let text_span = create_text_span(text);
    row.replaceChildren(text_span);

    // Set caret
    var range = document.createRange();
    range.setStart(text_span.firstChild, 0);
    range.collapse(true);

    let sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

function create_text_span(text, className) {
    let span = document.createElement("span");
    span.innerText = text;
    if (className) {
        span.classList.add(className);
    }
    return span;
}

function editor_on_keydown(e) {
    if (e.key === "Tab") {
        let sel = window.getSelection();
        let a = sel.anchorNode;
        if (a.nodeType === 3) {
            e.preventDefault();
            _add_text(Tokens.interpunct);

            apply_formatting(e.target);
            localStorage.setItem("input_string", get_editor_text_content(e.target));
        }
    }
}

function editor_on_keyup(e) {
    if (e.key === "Enter") {
        let sel = window.getSelection();
        let a = sel.anchorNode;
        if (a.nodeType === 3) {
            a = a.parentNode;
        }
        let div = a.closest("div");
        console.log("on enter", div, div.previousSibling);

        if (
            div.previousSibling.classList.contains("row") &&
            !div.previousSibling.querySelector(".end-row-marker")
        ) {
            // Enter key pressed when typing in the row content
            e.preventDefault();

            let previous_row = div.previousSibling;
            let previous_row_marker =
                previous_row.querySelector(".start-row-marker");

            let previous_row_text =
                nbsp +
                previous_row.innerText
                    .replace(previous_row_marker.innerText, "")
                    .trim() +
                nbsp;

            let end_marker = create_text_span(
                previous_row_marker.innerText,
                "row-marker"
            );
            end_marker.classList.add("end-row-marker");
            end_marker.onclick = setup_table_for_alignment;

            previous_row.replaceChildren(
                ...[
                    previous_row_marker,
                    create_text_span(previous_row_text),
                    end_marker,
                    create_text_span(nbsp),
                ]
            );

            // Get text from current row
            let text_node = div.firstChild;
            console.log("Text node", text_node);
            // Add empty text span if there is no text
            if (text_node.classList.contains("end-row-marker")) {
                text_node = create_text_span(nbsp + nbsp);
                div.prepend(text_node);
                console.log("Text node empty, created new", text_node);
            }

            text_node.innerText = nbsp + text_node.innerText.trim() + nbsp;

            // Add start row marker to current row
            let start_marker = create_text_span(
                end_marker.innerText,
                "row-marker"
            );
            start_marker.classList.add("start-row-marker");
            start_marker.onclick = setup_table_for_alignment;
            div.prepend(start_marker);
            div.classList.add("row");

            // Set caret
            var range = document.createRange();
            range.setStart(text_node.firstChild, 1);
            range.collapse(true);

            sel.removeAllRanges();
            sel.addRange(range);
        }

        apply_formatting(e.target);
        localStorage.setItem("input_string", get_editor_text_content(e.target));
    } else if (e.key === "Backspace") {
        let sel = window.getSelection();
        let a = sel.anchorNode;
        if (a.nodeType === 3) {
            a = a.parentNode;
        }

        let row = a.closest("div");
        let start = row.querySelector(".start-row-marker");
        let end = row.querySelector(".end-row-marker");
        if (start && end) {
            if (start.innerText === end.innerText) {
                return;
            }
        }
        if (!start && !end) {
            return;
        }

        let t = start ? start.innerText : end.innerText;
        remove_row_markers(row, t);

        apply_formatting(e.target);
        localStorage.setItem("input_string", get_editor_text_content(e.target));
    } else if (e.key === "Delete") {
        let sel = window.getSelection();
        let a = sel.anchorNode;
        if (a.nodeType === 3) {
            a = a.parentNode;
        }

        let row = a.closest("div");
        let start = row.querySelector(".start-row-marker");
        let end = row.querySelector(".end-row-marker");
        if (start && end) {
            if (start.innerText === end.innerText) {
                return;
            }
        }
        if (!start && !end) {
            return;
        }

        let t = start ? start.innerText : end.innerText;
        remove_row_markers(row, t);

        apply_formatting(e.target);
        localStorage.setItem("input_string", get_editor_text_content(e.target));
    }
}
