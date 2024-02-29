function _add_text(inp_text, textarea) {
    let startPos = textarea.selectionStart;
    let endPos = textarea.selectionEnd;
    textarea.value =
        textarea.value.substring(0, startPos) +
        inp_text +
        textarea.value.substring(endPos, textarea.value.length);
    textarea.selectionStart = startPos + inp_text.length;
    textarea.selectionEnd = startPos + inp_text.length;
}

function render_text(text, container) {
    let startTime = performance.now();
    let result = parse(text);
    let endTime = performance.now();
    console.log(
        `Parser took ${endTime - startTime} milliseconds to lint and parse ${
            text.length
        } characters.`
    );
    container.replaceChildren(...result.nodes);
}

function editor_on_keydown(e) {
    if (e.key === "Tab") {
        e.preventDefault();
        console.log(e.target);
        _add_text(Tokens.interpunct, e.target);
        render_text(e.target.value, preview);
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
    render_text(e.target.value, preview);
}


let preview = document.querySelector("main");
let editor = document.querySelector("textarea");

let params = new URL(document.location).searchParams;
let content = params.get("content");
if (content) {
    content = content.replace(".txt", "");
    let url = `/note-a-bhairavi/content/${content}.txt`;
    fetch(url)
        .then((response) => response.text())
        .then((input) => {
            editor.value = input;
            render_text(input, preview);
        });
}

editor.addEventListener("input", editor_on_input);
editor.addEventListener("keydown", editor_on_keydown);
editor.addEventListener("keyup", editor_on_keyup);

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
