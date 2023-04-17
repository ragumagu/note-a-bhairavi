aksharas = {
    "ಕ": 1,
    "ಕಿ": 1,
    "ಕು": 1,
    "ಟ": 1,
    "ಗಿ": 1,
    "ಗು": 1,
    "ಗುಂ": 1,
    "ಝ": 1,
    "ಝಂ": 1,
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

let aksharas_sorted = Object.keys(aksharas);
let accepted_tokens = [
    "||", "//", "$#", "##", "#", "*", "\\", "|", "⁋", "¶", "(", "((", ")", "))", ...aksharas_sorted
];
accepted_tokens = accepted_tokens.sort((a, b) => { return b.length - a.length });


ignore_tokens = [
    "\n", " "
]

function isASCII(str) {
    if (str === " ") { // check for &emsp;
        return true;
    }
    return /^[\x00-\x7F]*$/.test(str);
}

function isDiacritic(str) {
    return /^[\u0C80-\u0CFF]*$/.test(str) && !(/^[\u0C85-\u0CB9]*$/.test(str));
}

function get_chars(src) {
    let result = [];
    let i = 0;
    while (i < (src.length)) {
        let done = false;
        // case 1: src[i] is a recognized token
        for (let j = 0; j < accepted_tokens.length; j++) {
            let token = accepted_tokens[j]
            if (token === src.substring(i, i + token.length)) {
                result.push(accepted_tokens[j]);
                i += accepted_tokens[j].length;
                done = true;
                break;
            }
        }
        if (done) {
            continue;
        }

        // case 2: src[i] is ASCII
        if (isASCII(src[i])) {
            result.push(src[i]);
            i += 1;
            continue;
        }

        if (ignore_tokens.includes(src[i])) {
            i += 1;
            continue;
        }

        alert("Unrecognized character" + src[i] + ",at index:" + i)
        console.log("Unrecognized character:'" + src[i] + "', at index:" + i);
    }

    return result;
}


function get_row(content) {
    let row = document.createElement("tr");
    let td = document.createElement("td");

    let split = get_chars(content);

    let text = "";

    for (let i = 0; i < split.length; i++) {

        if (split[i] === "(" || split[i] === "((") {
            if (text != "") {
                let span = document.createElement("span");
                span.innerHTML = text;
                let div = document.createElement("div");
                div.appendChild(span);
                div.classList.add("count-hints-container")
                td.appendChild(div);
            }
            text = "";

        } else if (split[i] === ")") {
            if (text != "") {
                let span = document.createElement("span");
                span.innerHTML = text;
                span.classList.add("su");

                let div = document.createElement("div");
                div.appendChild(span);
                div.classList.add("count-hints-container")
                td.appendChild(div);

            }

            text = "";

        } else if (split[i] === "))") {
            if (text != "") {
                let span = document.createElement("span");
                span.innerHTML = text;
                span.classList.add("du");

                let div = document.createElement("div");
                div.appendChild(span);
                div.classList.add("count-hints-container")
                td.appendChild(div);

            }
            text = "";

        } else if (["||", "⁋", "¶", "|", "//", "\\"].includes(split[i])) {
            if (!(text === "")) {
                let span = document.createElement("span");
                span.innerHTML = text;

                let div = document.createElement("div");
                div.appendChild(span);
                div.classList.add("count-hints-container")
                td.appendChild(div);

                row.append(td);
            }

            text = "";

            if (split[i] !== "\\") {
                td = document.createElement("td");
                td.innerHTML = split[i];
                row.appendChild(td)
            }

            td = document.createElement("td");

        } else if (split[i] === " ") {
            text += split[i];
        } else {
            text += split[i];
        }
    }

    return row;
}


function get_header() {
    let header = document.createElement("header");
    header.classList.add('nav-header');

    let div = document.createElement("div");
    let anchor = document.createElement("a");
    anchor.href = "#table-of-contents";
    anchor.innerText = "Contents";
    div.appendChild(anchor);
    header.appendChild(div);

    div = document.createElement("div");
    let span = document.createElement("span");
    span.id = "current-chapter-title";
    span.innerText = "Current chapter";
    div.appendChild(span);
    header.appendChild(div);

    div = document.createElement("div");
    let label = document.createElement("label");
    label.innerText = "Show syllable counts:";
    div.appendChild(label);

    let input = document.createElement("input");
    input.type = "checkbox";
    input.id = "show-counts-checkbox";
    input.onchange = show_or_hide_count_hints_with_range;

    div.appendChild(input);
    header.appendChild(div);

    return header;

}

function render_text(text, output_container) {
    let lines = text.split("\n");
    let buff = "";

    let pages = [];
    let page = [];
    let ids = [];

    let paragraph = document.createElement("p");

    let table = null;
    let table_style = null;

    let titles = [];

    for (let i = 0; i < lines.length; i++) {
        buff = lines[i].trim();
        buff = buff.replace(/  +/g, ' ');

        while (buff !== "") {
            if (buff.startsWith("$# ")) {
                if (page.length != 0) {
                    page_element = document.createElement("div");
                    page_element.classList.add('page');
                    page_element.replaceChildren(...page);
                    let id = "page-id-" + ids.length;
                    page_element.id = id;
                    ids.push(id);
                    pages.push(page_element);

                    page = [];
                }

                let h1 = document.createElement("h1");
                h1.innerHTML = buff.substring(3);
                titles.push(buff.substring(3));
                page.push(h1);
                buff = "";

            } else if (buff.startsWith("# ")) {
                // add h1
                let h1 = document.createElement("h1");
                h1.innerHTML = buff.substring(2);
                page.push(h1);
                buff = "";

            } else if (buff.startsWith("## ")) {
                // add h2
                let h2 = document.createElement("h2");
                h2.innerHTML = buff.substring(3);
                page.push(h2);
                buff = "";

            } else if (buff[0] === "*") {
                if (table === null) {
                    table = document.createElement("table");
                    console.log("creating new table", table);
                } else {

                    if (table_style !== null) {
                        table.childNodes.forEach((tr) => {
                            table_style['align-right'].forEach((col_num) => {
                                [...tr.childNodes][col_num].classList.add("text-align-right");
                            });

                            table_style['align-center'].forEach((col_num) => {
                                [...tr.childNodes][col_num].classList.add("text-align-center");
                            });
                        })
                    }
                    page.push(table);
                    buff = buff.substring(1);
                    table = null;
                }
                buff = buff.substring(1);
            } else if (buff.startsWith("||") | buff.startsWith("//")) {
                match_string = buff.substring(0, 2);
                let markers = ["||", "||"];

                if (match_string === "//") {
                    markers = ["⁋", "¶"]
                }

                end = buff.substring(2).indexOf(match_string);
                if (end < 0) {
                    throw new Error('Unmatched ' + match_string +
                        " on line number " + i + ", line:" + lines[i]);
                }

                table.appendChild(get_row(markers[0] +
                    buff.substring(2, end + 2) + markers[1]));

                buff = buff.substring(end + 4);

            } else if (buff.startsWith("[") && buff.endsWith("]")) {

                let align = get_row(buff.substring(1, buff.length - 1));
                table_style = {
                    "align-right": [],
                    "align-center": [],
                }
                let i = 0;
                align.childNodes.forEach((td) => {
                    td = td.innerText.trim();
                    if (td === "r") {
                        table_style['align-right'].push(i);
                    } else if (td === "c") {
                        table_style['align-center'].push(i);
                    }
                    i++;
                });
                buff = "";
            } else {
                if (buff.endsWith("+")) {
                    paragraph.innerHTML += " " + buff.substring(0, buff.length - 1);
                } else {
                    paragraph.innerHTML += " " + buff;

                    page.push(paragraph);
                    paragraph = document.createElement("p");
                }
                buff = "";
            }
        }
    }

    if (page != []) {
        page_element = document.createElement("div");
        page_element.classList.add('page');
        page_element.replaceChildren(...page);

        let id = "page-id-" + ids.length;
        page_element.id = id;
        ids.push(id);

        pages.push(page_element);
    }


    let toc = document.createElement("div");
    let list = document.createElement("ul");

    for (let i = 0; i < titles.length; i++) {
        let list_entry = document.createElement("li");
        let anchor = document.createElement("a");
        anchor.href = "#" + ids[i];
        anchor.innerText = titles[i];
        list_entry.appendChild(anchor);
        list.appendChild(list_entry);
    }
    toc.appendChild(list);
    toc.classList.add("page");
    toc.classList.add("toc");
    toc.classList.add("page-first");
    toc.id = "table-of-contents";


    output_container.replaceChildren(...[get_header(), toc, ...pages]);


    document.querySelectorAll('.page').forEach((page) => {
        observer.observe(page);
    })
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
    let nodes = page.querySelectorAll(".count-hints-container");

    for (let i = 0; i < nodes.length; i++) {
        let container = nodes[i];
        if (container.querySelector(".count-hints-label")){
            continue;
        }
        let text_node = container.querySelector("span");

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

        if (len === 0) {
            continue;
        }

        label = document.createElement("label");
        label.innerText = len;
        label.classList.add("text-align-center");

        let brace = get_curly_brace();
        let width = text_node.getBoundingClientRect().width;
        brace.style.width = `${width}px`;
        label.style.width = `${width}px`;

        label.classList.add("count-hints-label");
        brace.classList.add("count-hints-brace");

        container.insertBefore(label, text_node);
        container.insertBefore(brace, text_node);

        if (text_node.classList.contains("text-align-right")) {
            container.style.alignItems = "end";
        }

        if (text_node.classList.contains("text-align-center")) {
            container.style.alignItems = "center";
        }

    }
}


function hide_count_hints(page) {
    page.querySelectorAll(".count-hints-label").forEach((hint_node) => {
        hint_node.remove();
    })
    page.querySelectorAll(".count-hints-brace").forEach((hint_node) => {
        hint_node.remove();
    })
}

function show_or_hide_count_hints_with_range() {
    let pages = [...document.getElementsByClassName('page')];
    for (let i = 0; i < pages.length; i++) {
        if (pages[i].classList.contains("toc")) {
            pages.splice(i, 1);
            break;
        }
    }

    range_min = Math.max(0, current_page_in_viewport - 3);
    range_max = Math.min(pages.length, current_page_in_viewport + 3);

    let show_counts_checkbox = document.getElementById("show-counts-checkbox");
    for (let i = range_min; i < range_max; i++) {
        if (show_counts_checkbox.checked) {
            show_count_hints(pages[i]);
        } else {
            hide_count_hints(pages[i]);
        }
    }
}

var current_page_in_viewport = 0;

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            let new_val = parseInt(entry.target.id.replace("page-id-", ""));

            console.log("current_page is", current_page_in_viewport, new_val, entry.target);

            current_page_in_viewport = new_val;
            show_or_hide_count_hints_with_range();

            if (!entry.target.classList.contains("toc")) {
                document.getElementById("current-chapter-title").innerText = entry.target.children[0].innerHTML;
            }
        }
    })
});