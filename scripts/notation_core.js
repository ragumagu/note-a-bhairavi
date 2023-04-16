aksharas = {
    "ಕ": 1,
    "ಕಿ": 1,
    "ಕು": 1,
    "ಟ": 1,
    "ಗಿ": 1,
    "ಗು": 1,
    "ಗುಂ": 1,
    "ಝ": 1,
    "ತ": 1,
    "ರಿ": 1,
    "ತ್": 0,
    "ತಾ": 2,
    "ತಾಂ": 2,
    "ತ್ಲಾಂ": 2,
    "ತೊ": 1,
    "ತೊಂ": 1,
    "ದಿ": 1,
    "ಧಿ": 1,
    "ಧಿಂ": 1,
    "ಧುಂ": 1,
    "ನ": 1,
    "ನ್ನ": 2,
    "ನಂ": 1,
    "ಮಿ": 1,
    "ಣ": 1,
    "ಣು": 1,
    "ಳಾಂ": 2,
    ",": 1,
    ";": 2
}


function isASCII(str) {
    if (str === " ") { // check for &emsp;
        return true;
    }
    return /^[\x00-\x7F]*$/.test(str);
}

var special_characters = ["⁋", "¶"]

function isDiacritic(str) {
    return /^[\u0C80-\u0CFF]*$/.test(str) && !(/^[\u0C85-\u0CB9]*$/.test(str));
}



function get_chars(src) {
    let result = [];

    let i = 0;
    while (i < src.length) {
        if (src.substring(i, i + 5) in aksharas) {
            result.push(src.substring(i, i + 5));
            i = i + 5;
        } else if (src.substring(i, i + 3) in aksharas) {
            result.push(src.substring(i, i + 3));
            i = i + 3;
        } else if (src.substring(i, i + 2) in aksharas) {
            result.push(src.substring(i, i + 2));
            i = i + 2;
        } else if (src.substring(i, i + 1) in aksharas) {
            result.push(src.substring(i, i + 1));
            i = i + 1;
        } else if (!isASCII(src[i]) && !(special_characters.includes(src[i]))) {
            alert("Unrecognized character" + src[i] + ",at index:" + i)
            console.log("Unrecognized character:'" + src[i] + "',at index:" + i);
        } else {
            if (src.substring(i, i + 2) === "((" || src.substring(i, i + 2) === "))" ||
                src.substring(i, i + 2) === "||") {
                result.push(src.substring(i, i + 2))
                i = i + 1;
            } else if (src[i] === " ") { // space
                if (result[result.length - 1] != " ") {
                    result.push(src[i]);
                }
            } else if (!(src[i] === " " || src[i] === "\n")) { // &emsp; and new line characters
                // console.log("Pushing ascii:'" + src[i] + "'");
                result.push(src[i]);
            }
            i = i + 1;
        }
    }

    return result;
}

function generate_table_of_contents() {
    let toc = document.createElement("table");
    book.forEach((page, idx) => {
        let link_text = "Page " + (idx + 1) + ": " + page.substring(0, page.indexOf("\n"));
        let link = document.createElement("a");
        link.innerText = link_text;

        link.classList.add('button-link');

        link.onclick = (e) => {
            e.preventDefault();
            current_page = idx;
            let text = document.getElementById("text");
            if (text != null) {
                text.value = book[current_page];
            }
            render_text(book[current_page], document.getElementById("output"));
            update_page_numbers_window();
        }

        let row = document.createElement("tr");
        let td = document.createElement("td");
        td.appendChild(link);
        row.appendChild(td);
        toc.appendChild(row);
    });
    return toc;
}


function get_row(content) {
    let row = document.createElement("tr");
    let td = document.createElement("td");

    let split = get_chars(content);
    console.log("Split", split);
    let text = "";

    for (let i = 0; i < split.length; i++) {
        if (split[i] in aksharas) {
            text += split[i];
            text_len += aksharas[split[i]];

        } else if (split[i] === "(" || split[i] === "((") {
            if (text != "") {
                let span = document.createElement("span");
                span.innerHTML = text;
                td.appendChild(span);
            }

            text = "";
            text_len = 0;

        } else if (split[i] === ")") {
            if (text != "") {
                let span = document.createElement("span");
                span.innerHTML = text;
                span.classList.add("su");
                td.appendChild(span);
            }

            text = "";
            text_len = 0;

        } else if (split[i] === "))") {
            if (text != "") {
                let span = document.createElement("span");
                span.innerHTML = text;
                span.classList.add("du");
                td.appendChild(span);
            }
            text = "";
            text_len = 0;

        } else if (["||", "⁋", "¶", "|", "//", "\\"].includes(split[i])) {
            if (!(text === "")) {
                let span = document.createElement("span");
                span.innerHTML = text;
                td.appendChild(span);
                row.append(td);
            }

            text = "";
            text_len = 0;

            if (split[i] !== "\\") {
                td = document.createElement("td");
                td.innerHTML = split[i];
                row.appendChild(td)
            }

            td = document.createElement("td");

        } else if (split[i] === " ") {
            console.log("text is space");
            text += split[i];
        } else {
            text += split[i];
            text_len += 1;
        }
        console.log('text is:"' + text + '"');
    }

    return row;
}

function render_text(text, output_container) {
    let lines = text.split("\n");
    let buff = "";

    let curr_table = null;
    let curr_table_style = null;
    let result = [];
    let new_table = false;

    for (let i = 0; i < lines.length; i++) {
        buff = lines[i].trim();

        while (buff !== "") {
            console.log("BUFF", buff);
            if (buff === "#TOC") {
                result.push(generate_table_of_contents());
                buff = "";
            } else if (buff[0] === "*") {
                if (curr_table === null) {
                    new_table = true;
                } else {
                    // Add styles to current table and push to result

                    if (curr_table_style !== null) {
                        curr_table.childNodes.forEach((tr) => {
                            curr_table_style['align-right'].forEach((col_num) => {
                                [...tr.childNodes][col_num].classList.add("text-align-right");
                                [...[...tr.childNodes][col_num].childNodes].forEach((n) => {
                                    n.classList.add("text-align-right");
                                })
                            });

                            curr_table_style['align-center'].forEach((col_num) => {
                                [...tr.childNodes][col_num].classList.add("text-align-center");
                                [...[...tr.childNodes][col_num].childNodes].forEach((n) => {
                                    n.classList.add("text-align-center");
                                })
                            });
                        })
                    }
                    result.push(curr_table);
                    curr_table = null;
                    curr_table_style = null;
                }
                buff = buff.substring(1);
            } else if (buff.startsWith("||") | buff.startsWith("//")) {
                match_string = buff.substring(0, 2);
                let markers = ["||", "||"];

                if (match_string === "//") {
                    markers = ["⁋", "¶"]
                }

                if (new_table) {
                    curr_table = document.createElement("table");
                    new_table = false;
                }

                end = buff.substring(2).indexOf(match_string);
                if (end < 0) {
                    throw new Error('Unmatched ' + match_string +
                        " on line number " + i + ", line:" + lines[i]);
                }

                curr_table.appendChild(get_row(markers[0] +
                    buff.substring(2, end + 2) + markers[1]));

                buff = buff.substring(end + 4);

            } else if (buff.startsWith("[") && buff.endsWith("]")) {
                console.log("buff startswith []");
                let align = get_row(buff.substring(1, buff.length - 1));
                curr_table_style = {
                    "align-right": [],
                    "align-center": [],
                }
                let i = 0;
                console.log("align", align);
                align.childNodes.forEach((td) => {
                    td = td.innerText.trim();
                    if (td === "r") {
                        curr_table_style['align-right'].push(i);
                    } else if (td === "c") {
                        curr_table_style['align-center'].push(i);
                    }
                    i++;
                });

                console.log("Curr table style", curr_table_style);

                buff = "";
            } else if (buff.startsWith("# ")) {
                // add h1
                let h1 = document.createElement("h1");
                h1.innerHTML = buff.substring(2);
                result.push(h1);
                buff = "";
            } else if (buff.startsWith("## ")) {
                // add h2
                let h2 = document.createElement("h2");
                h2.innerHTML = buff.substring(3);
                result.push(h2);
                buff = "";
            } else {
                let p = document.createElement("p");
                p.innerHTML = buff;
                result.push(p);
                buff = "";
            }
        }
    };
    output_container.replaceChildren(...result);
}


function get_curly_brace() {
    let border_element = document.createElement("div");
    children = [];
    for (let i = 0; i < 6; i++) {
        let div = document.createElement("div")
        children.push(div);
    }
    children[0].classList.add("curly-brace-left-arc");
    children[1].classList.add("curly-brace-line");
    children[2].classList.add("curly-brace-left-arc");
    children[2].classList.add("curly-brace-invert");
    children[3].classList.add("curly-brace-right-arc");
    children[3].classList.add("curly-brace-invert");
    children[4].classList.add("curly-brace-line");
    children[5].classList.add("curly-brace-right-arc");
    border_element.replaceChildren(...children);
    border_element.classList.add("curly-brace-group");
    return border_element;
}



function show_count_hints(page) {
    let nodes = page.querySelectorAll("span:not(.count-hints-span)");

    console.log("Show counts called.", nodes);
    for (let i = 0; i < nodes.length; i++) {
        let text_node = nodes[i];

        let splits = "";
        splits = get_chars(text_node.innerText);

        let len = 0;
        for (let i = 0; i < splits.length; i++) {
            if (splits[i] in aksharas) {
                len += aksharas[splits[i]];
            }
        }

        if (text_node.classList.contains("su")) {
            len = len / 2;
        } else if (text_node.classList.contains("du")) {
            len = len / 4;
        }

        console.log("Len is ", len);
        if (len === 0) {
            continue;
        }

        let container = document.createElement("div");

        label = document.createElement("label");
        label.innerText = len;
        label.classList.add("text-align-center");

        let brace = get_curly_brace();
        brace.style.width = `${text_node.getBoundingClientRect().width}px`;
        label.style.width = `${text_node.getBoundingClientRect().width}px`;

        label.classList.add("count-hints");
        brace.classList.add("count-hints-span");

        let span = text_node.cloneNode(true);
        span.classList.add("count-hints-span");

        let children = [label, brace, span];
        container.classList.add('curly-brace-group-container');
        container.replaceChildren(...children);

        if (text_node.classList.contains("text-align-right")) {
            container.style.alignItems = "end";
        }

        if (text_node.classList.contains("text-align-center")) {
            container.style.alignItems = "center";
        }

        text_node.replaceWith(container);
    }
}

function hide_count_hints(page) {
    page.querySelectorAll(".count-hints").forEach((hint_node) => {
        hint_node.remove();
    })
    page.querySelectorAll(".count-hints-span").forEach((hint_node) => {
        hint_node.classList.remove('count-hints-span');
    })
}

function show_or_hide_count_hints_with_range() {
    let pages = document.querySelectorAll('.page');
    range_min = Math.max(0, current_page_in_viewport - 3);
    range_max = Math.min(pages.length, current_page_in_viewport + 3);

    console.log("pages ", pages, range_min, range_max);
    for (let i = range_min; i < range_max; i++) {
        if (show_counts_checkbox.checked) {
            show_count_hints(pages[i]);
        } else {
            console.log("pages [i], ", pages.length, i);
            hide_count_hints(pages[i]);
        }
    }
}

var current_page_in_viewport = 0;

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            let new_val = parseInt(entry.target.id.replace("page-", ""));
            console.log("new val", new_val);
            if (Math.abs(current_page_in_viewport - new_val) > 2){
                current_page_in_viewport = new_val;
                show_or_hide_count_hints_with_range();
            }
            console.log("current_page is", current_page_in_viewport);
        }
    })
});

document.querySelectorAll('.page').forEach((page) => {
observer.observe(page);
})

let show_counts_checkbox = document.getElementById("show-counts-checkbox")
show_counts_checkbox.onchange = () => {
    show_or_hide_count_hints_with_range();
}
