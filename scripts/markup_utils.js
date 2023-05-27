function assert_and_add(node, start_strings, css_class) {
    for (let i = 0; i < start_strings.length; i++) {
        if (node.innerText.startsWith(start_strings[i])) {
            node.classList.add(css_class);
            break;
        }
    }

    if (node.classList.contains(css_class)) {
        remove = true;
        for (let i = 0; i < start_strings.length; i++) {
            if (node.innerText.startsWith(start_strings[i])) {
                remove = false;
                break;
            }
        }
        if (remove) {
            node.classList.remove(css_class);
        }
    }
}

function apply_formatting(node) {
    let divs = node.querySelectorAll("div");
    for (let i = 0; i < divs.length; i++) {
        let div = divs[i];
        assert_and_add(div, ["$#"], "h1");
        assert_and_add(div, ["##"], "h2");
        assert_and_add(div, row_markers, "row");

        if (div.classList.contains("row")) {
            if (div.classList.contains("row-marked-for-alignment")) {
                // On applying formatting, you don't want the table
                // to be in alignment mode.
                remove_alignment_nodes(div);
            }
        }
    }

    node.querySelectorAll(".row-marker").forEach((marker)=>{
        marker.onclick = setup_table_for_alignment;
    })
}

function render_text(text, container) {
    text = text.replaceAll("\r\n", "\n").trim() + "\n";
    var startTime = performance.now();
    let nodes = parse(text);
    var endTime = performance.now();
    console.log(
        `Parser took ${endTime - startTime} milliseconds to parse ${
            text.length
        } characters.`
    );
    container.replaceChildren(...nodes);
    return;

}

/* Tests */
// split("");
// split("abc");
// split("abc\r\n");
// split("abc\r\nbcd");
// split("abc\r\nbcd\r\n");
// split("abc\r\n\r\nbcd\r\n");
// split("abc\r\n\r\nbcd\r\n\r\n\r\ndef");
// split("abc\r\n\r\nbcd +\r\ndef");
// split("abc\r\n\r\nbcd +\r\ndef +\r\nefg\r\n\r\nddd");
