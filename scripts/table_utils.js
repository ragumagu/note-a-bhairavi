function get_table_rows(node) {
    let rows = [];
    let current_row = node;

    while (current_row) {
        if (current_row.classList.contains("row")) {
            rows.push(current_row);
        } else {
            break;
        }

        if (current_row.previousSibling) {
            current_row = current_row.previousSibling;
        } else {
            break;
        }
    }

    current_row = node.nextSibling;

    while (current_row) {
        if (current_row.classList.contains("row")) {
            rows.push(current_row);
        } else {
            break;
        }

        if (current_row.nextSibling) {
            current_row = current_row.nextSibling;
        } else {
            break;
        }
    }
    return rows;
}

function set_span_widths(rows) {
    return;
}

function add_alignment_helpers(rows) {
    rows.forEach((row) => {
        let groups = parse(row.innerText.trim() + Tokens.newLine)[0];
        row.replaceChildren(...groups.childNodes);

        row.querySelectorAll(".letter-group").forEach((lg) => {
            let letters = [];
            [...lg.innerText].forEach((char) => {
                let letter = document.createElement("span");
                letter.innerText = char;
                letter.classList.add("letter");
                letter.onclick = insert_separator;
                letters.push(letter);
            });
            lg.replaceChildren(...letters);
        });

        row.querySelectorAll(".separator").forEach((separator) => {
            separator.onclick = remove_separator;
        });

        row.querySelectorAll(".row-marker").forEach((marker) => {
            marker.onclick = remove_alignment_nodes_for_table;
        });

        row.classList.add("row-marked-for-alignment");
    });
}

function remove_separator(e) {
    e.preventDefault();

    let separator = e.target;
    let row = separator.closest(".row");
    row.removeChild(separator);
    add_alignment_helpers([row]);
}

function insert_separator(e) {
    e.preventDefault();
    let text = Tokens.interpunct;
    if (window.event.ctrlKey) {
        text = "|";
    }
    let separator = document.createElement("span");
    separator.innerText = text;
    separator.classList.add("separator");
    separator.onclick = remove_separator;
    e.target.parentNode.insertBefore(separator, e.target);

    add_alignment_helpers([separator.closest(".row")]);
}

function setup_table_for_alignment(e) {
    let current_row = e.target.closest(".row");
    if (current_row) {
        let rows = get_table_rows(current_row);
        add_alignment_helpers(rows);
    }
}

function remove_alignment_nodes(row) {
    row.classList.remove("row-marked-for-alignment");
    let groups = parse(row.innerText.trim() + Tokens.newLine)[0];
    row.replaceChildren(...groups.childNodes);

    row.querySelectorAll(".row-marker").forEach(
        (marker) => (marker.onclick = setup_table_for_alignment)
    );
}

function remove_alignment_nodes_for_table(e) {
    let row = e.target.closest(".row");
    let rows = get_table_rows(row);
    if (row) {
        rows.forEach((row) => {
            remove_alignment_nodes(row);
        });
    }
}
