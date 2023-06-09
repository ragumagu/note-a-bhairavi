function _add_text(inp_text, textarea) {
    var startPos = textarea.selectionStart;
    var endPos = textarea.selectionEnd;
    textarea.value =
        textarea.value.substring(0, startPos) +
        inp_text +
        textarea.value.substring(endPos, textarea.value.length);
    textarea.selectionStart = startPos + inp_text.length;
    textarea.selectionEnd = startPos + inp_text.length;
}

function remove_marker(e) {
    console.log("Removing marker");
    let caret_pos = parseInt(e.target.id.replace("char-", ""));

    editor.value =
        editor.value.substring(0, caret_pos) +
        editor.value.substring(caret_pos + 1, editor.value.length);
    editor.selectionStart = caret_pos;
    editor.selectionEnd = caret_pos;

    render_text(editor.value, preview);
    place_cursor();
    editor.focus();
}

function add_separator(e) {
    let caret_pos = null;
    if (e.target.nodeName === "SPAN") {
        if (e.target.classList.contains("marker")) {
            return;
        }
        let id = e.target.id;
        if (id.startsWith("char-extra")) {
            caret_pos = parseInt(id.replace("char-extra-", ""));
        } else {
            caret_pos = parseInt(id.replace("char-", ""));
        }
        e.preventDefault();
    } else {
        return;
    }

    console.log("TO add separator at, ", caret_pos);

    editor.selectionStart = caret_pos;
    editor.selectionEnd = caret_pos;

    var startPos = editor.selectionStart;
    var endPos = editor.selectionEnd;

    console.log(
        "between",
        editor.value.substring(0, startPos),
        "and",
        editor.value.substring(endPos, editor.value.length)
    );

    let separator_to_add = Tokens.interpunct;

    if (window.event.ctrlKey) {
        separator_to_add = Tokens.pipe;
    } else if (window.event.shiftKey) {
        separator_to_add = Tokens.pilcrow;
    }

    _add_text(separator_to_add, editor);
    render_text(editor.value, preview);
    place_cursor();
    editor.focus();
}

function render_text(text, container) {
    var startTime = performance.now();
    text = lint(text);

    let nodes = parse(text);
    var endTime = performance.now();
    console.log(
        `Parser took ${endTime - startTime} milliseconds to lint and parse ${
            text.length
        } characters.`
    );
    container.replaceChildren(...nodes);

    container.querySelectorAll("div").forEach((row) => {
        if (!row.lastChild || row.classList.contains("empty-line")) {
            return;
        }
        let idx = parseInt(row.lastChild.id.replace("char-", "")) + 1;
        add_phrase_to_container(nbsp, "extra-" + idx, row, []);
        row.onclick = add_separator;
    });
    container.querySelectorAll(".marker").forEach((marker) => {
        marker.onclick = remove_marker;
    });

}

function place_cursor() {
    document.querySelectorAll(".caret-left").forEach((n) => {
        n.classList.remove("caret-left");
    });
    document.querySelectorAll(".caret-right").forEach((n) => {
        n.classList.remove("caret-right");
    });

    let cursor_pos = editor.selectionEnd;
    let caret = document.createElement("span");
    caret.classList.add("caret");
    caret.innerText = Tokens.pipe;
    let char = document.querySelector(`#char-${cursor_pos - 1}`);
    if (char && !char.classList.contains("empty-line")) {
        char.classList.add("caret-right");
        return;
    }
    char = document.querySelector(`#char-${cursor_pos}`);
    if (char) {
        char.classList.add("caret-left");
    }
}

function editor_on_keydown(e) {
    if (e.key === "Tab") {
        e.preventDefault();
        console.log(e.target);
        _add_text(Tokens.interpunct, e.target);
        render_text(e.target.value, document.querySelector("main"));
        place_cursor();
    }
}

function editor_on_input(e) {
    let last_two_chars = editor.value.substring(
        editor.selectionEnd - 2,
        editor.selectionEnd
    );

    if (last_two_chars === "//") {
        let caret_pos = editor.selectionEnd;
        editor.value =
            editor.value.substring(0, editor.selectionEnd - 2) +
            editor.value.substring(editor.selectionEnd);
        editor.selectionEnd = caret_pos - 2;
        _add_text(Tokens.pilcrow + "  " + Tokens.pilcrow, editor);
        editor.selectionEnd = editor.selectionEnd - 2;
    }
}

function editor_on_keyup(e) {
    render_text(e.target.value, document.querySelector("main"));
    place_cursor();
}

function add_text(e) {
    _add_text(e.target.value, editor);
    render_text(editor.value, preview);
    place_cursor();
    editor.focus();
}

let aksharas_table = document.getElementById("aksharas_table");
if (aksharas_table){
    aksharas_table.querySelectorAll("button")
    .forEach((button) => {
        button.onclick = add_text;
    });
}

let preview = document.querySelector("main");
let editor = document.querySelector("textarea");

let params = new URL(document.location).searchParams;
let content = params.get("content");
if (content) {
    let url = `/carnatic-notation-app/content/${content}.txt`;
    fetch(url)
        .then((response) => response.text())
        .then((input) => {
            editor.value = input;
            render_text(input, preview);
            place_cursor();
        });
}

editor.addEventListener("input", editor_on_input);
editor.addEventListener("keydown", editor_on_keydown);
editor.addEventListener("keyup", editor_on_keyup);
editor.addEventListener("click", place_cursor);

// Scroll sync between editor and preview
// From https://stackoverflow.com/a/57365748/5940228
// Locks so that only one pane is in control of scroll sync

var eScroll = false;
var pScroll = false;
// Set the listener to scroll
function editor_on_scroll() {
    if (eScroll) {
        // Lock the editor pane
        eScroll = false;
        return;
    }
    pScroll = true; // Enable the preview scroll

    // Calculate the position of scroll position based on percentage
    let percentage =
        editor.scrollTop / (editor.scrollHeight - editor.offsetHeight);

    // Set the scroll position on the other pane
    preview.scrollTop =
        percentage * (preview.scrollHeight - preview.offsetHeight);

    percentage = editor.scrollLeft / (editor.scrollWidth - editor.offsetWidth);

    // Set the scroll position on the other pane
    preview.scrollLeft =
        percentage * (preview.scrollWidth - preview.offsetWidth);
}

function preview_on_scroll() {
    if (pScroll) {
        // Lock the preview pane
        pScroll = false;
        return;
    }
    eScroll = true; // Enable the editor scroll

    // Calculate the position of scroll position based on percentage
    let percentage =
        preview.scrollTop / (preview.scrollHeight - preview.offsetHeight);

    // Set the scroll position on the other pane
    editor.scrollTop = percentage * (editor.scrollHeight - editor.offsetHeight);

    percentage =
        preview.scrollLeft / (preview.scrollWidth - preview.offsetWidth);

    // Set the scroll position on the other pane
    editor.scrollLeft = percentage * (editor.scrollWidth - editor.offsetWidth);
}

editor.addEventListener("scroll", editor_on_scroll);
preview.addEventListener("scroll", preview_on_scroll);
