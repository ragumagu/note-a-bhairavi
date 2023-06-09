function on_file_upload(e) {
    if (e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            let text = e.target.result;
            let start_token = `<script id="input" type="text/template">`;
            let end_token = `</script><!-- end of input -->`;
            let start = text.indexOf(start_token);
            let end = text.indexOf(end_token);
            if (start === -1 || end === -1) {
                let alert_message =
                    "Could not parse uploaded file.\n" +
                    "Please try to recover by these steps:\n1. Open the file in an editor, \n" +
                    "2. Copy and paste the content into the input box \n" +
                    "3. Download the file again.";
                alert(alert_message);
            }
            if (start !== -1) {
                start += start_token.length;
            }

            let input_text = text.substring(start, end);

            editor.value = input_text;
            render_text(input_text, preview);
        };

        reader.readAsText(e.target.files[0]);
    }
}

if (document.getElementById("file-upload")) {
    document.getElementById("file-upload").onclick = on_file_upload;
}

function download(text) {
    // From https://stackoverflow.com/a/48550997
    var blob = new Blob([text], {
        type: "text/plain",
    });
    var anchor = document.createElement("a");
    anchor.download = "notation.html";
    anchor.href = window.URL.createObjectURL(blob);
    anchor.target = "_blank";
    anchor.style.display = "none"; // just to be safe!
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}

async function download_on_click(e) {
    localStorage.setItem("input_string", editor.value);
    let input = localStorage.getItem("input_string");

    fetch("/carnatic-notation-app/template.html")
        .then((response) => response.text())
        .then((text) => {
            return text;
        })
        .then((t) => {
            match = `<script id="input" type="text/template"></script>`;
            replace_text = `<script id="input" type="text/template">\n${input}\n</script><!-- end of input -->`;

            t = t.replace(match, replace_text);

            download(t);
        })
        .catch((error) => {
            console.log(error);
        });
}

let download_button = document.getElementById("download-button");
if (download_button) {
    download_button.onclick = download_on_click;
}

function apply_rendering(text, container) {
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

    let pages = [];
    let page = [];
    let divs = container.querySelectorAll("div");

    for (let i = 0; i < divs.length; i++) {
        if (divs[i].classList.contains("h1")) {
            if (page.length > 0) {
                let page_section = document.createElement("section");
                page_section.classList.add("page");
                page_section.replaceChildren(...page);

                pages.push(page_section);
                page = [];
            }
        }
        page.push(divs[i]);
    }

    if (page.length > 0) {
        let page_section = document.createElement("section");
        page_section.classList.add("page");
        page_section.replaceChildren(...page);

        pages.push(page_section);
        page = [];
    }

    container.replaceChildren(...pages);

    document.querySelectorAll(".h1").forEach((h1) => {
        h1.innerText = h1.innerText.replace("$#", "").trim();
    });

    document.querySelectorAll(".h2").forEach((h2) => {
        h2.innerText = h2.innerText.replace("##", "").trim();
    });

    document.querySelectorAll(".su, .du").forEach((speed) => {
        if (speed.innerText == "(" || speed.innerText == ")") {
            speed.style.display = "none";
        }
    });

    document.querySelectorAll(".underscore").forEach((speed) => {
        speed.innerText = speed.innerText.replaceAll("_", "").trim();
    });

    let rows = document.querySelectorAll(".row");
    rows.forEach((row) => {

        if (row.innerText.indexOf("[") >= 0) {
            row.style.display = "none";
            return;
        }

        row.querySelectorAll(".marker").forEach((separator) => {
            if (separator.innerText === Tokens.interpunct) {
                row.removeChild(separator);
            } else if (separator.innerText === Tokens.slash) {
                row.childNodes.forEach((node) => {
                    node.style.visibility = "hidden";
                });
            }
        });

        row.querySelectorAll(".row-marker").forEach((marker) => {
            if (marker.innerText === "//") {
                marker.innerText = "⁋";
            }
        });
    });

}

function create_header() {
    let header = document.querySelector("header");
    let header_left = header.querySelector(".nav-left");
    let header_center = header.querySelector(".nav-center");
    let header_right = header.querySelector(".nav-right");

    let anchor = document.createElement("a");
    anchor.href = "#table-of-contents";
    anchor.innerText = "Contents";
    header_left.appendChild(anchor);

    let span = document.createElement("span");
    span.id = "current-chapter-title";
    span.innerText = "Current chapter";
    header_center.appendChild(span);

    let label = document.createElement("label");
    label.innerText = "Show syllable counts:";
    header_right.appendChild(label);

    let input = document.createElement("input");
    input.type = "checkbox";
    input.id = "show-counts-checkbox";
    input.onchange = show_or_hide_count_hints_with_range;

    header_right.appendChild(input);
}

function create_table_of_contents() {
    titles = [];
    document.querySelectorAll(".h1").forEach((h1) => {
        titles.push(h1.innerText);
    });

    let ids = [];
    document.querySelectorAll(".page").forEach((page) => {
        let id = "page-id-" + ids.length;
        page.id = id;
        ids.push(id);
    });

    let toc = document.createElement("div");
    let list = document.createElement("ul");

    for (let i = 0; i < titles.length; i++) {
        let list_entry = document.createElement("li");
        let anchor = document.createElement("a");
        anchor.href = "#" + ids[i];
        anchor.innerText = titles[i];
        // anchor.onclick = set_title_in_header;
        list_entry.appendChild(anchor);
        list.appendChild(list_entry);
    }
    toc.appendChild(list);
    toc.classList.add("page");
    toc.classList.add("toc");
    toc.classList.add("page-first");
    toc.id = "table-of-contents";

    document.querySelector("main").prepend(toc);

    let header = document.querySelector("header");
    let header_height = Math.round(header.getBoundingClientRect().height);
    let root_margin = header_height + "px 0px 0px 0px";
    document.querySelector("html").style.scrollPaddingTop =
        header_height + "px";
    console.log("root margin", root_margin);

    let options = {
        rootMargin: root_margin,
        threshold: 1.0,
    };
    const observer = new IntersectionObserver(change_title_on_scroll, options);

    document.querySelectorAll(".h1").forEach((page) => {
        observer.observe(page);
    });
}
function render_content() {
    let params = new URL(document.location).searchParams;
    let input = params.get("test");
    let main = document.querySelector("main");
    if (input) {
        fetch("/carnatic-notation-app/tests/" + input)
            .then((response) => response.text())
            .then((text) => {
                return text;
            })
            .then((t) => {
                apply_rendering(t, main);
            })
            .catch((error) => {
                console.log(error);
            });
    } else {
        input = document.getElementById("input");
        if (input.innerHTML) {
            apply_rendering(input.innerHTML, main);
        }
    }

    create_header();
    create_table_of_contents();
}

window.onload = render_content;

// COUNT HINT UTILS
function get_curly_brace() {
    let border_element = document.createElement("div");
    children = [];
    for (let i = 0; i < 6; i++) {
        let div = document.createElement("div");
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

function add_curly_brace(span, alignment) {
    if (
        span.querySelector(".count-hints-brace") ||
        span.querySelector(".count-hints-label")
    ) {
        return;
    }

    let len = get_aksharas_count(span.innerText);
    if (len === 0) {
        return;
    }

    if (span.firstChild.classList.contains("su")) {
        len = len / 2;
    }
    if (span.firstChild.classList.contains("du")) {
        len = len / 4;
    }

    label = document.createElement("div");
    label.innerText = len;
    label.classList.add("text-align-center");
    label.classList.add("count-hints-label");

    let brace = get_curly_brace();
    let width = span.getBoundingClientRect().width;
    label.style.width = `${width}px`;
    brace.style.width = `${width}px`;
    brace.classList.add("count-hints-brace");
    // if (len < 2){
    // brace.style.visibility = "hidden";
    // }
    span.prepend(brace);
    span.prepend(label);

    span.style.alignItems = alignment;
}

function show_count_hints(page) {
    let nodes = page.querySelectorAll(".row > .group");

    for (let i = 0; i < nodes.length; i++) {
        let container = nodes[i];

        // add_curly_brace(container, alignment);
        container.querySelectorAll(".phrase").forEach((phrase) => {
            if (
                phrase.querySelector(".count-hints-brace") ||
                phrase.querySelector(".count-hints-label")
            ) {
                return;
            }
            let len = get_aksharas_count(phrase.innerText);
            if (len === 0) {
                return;
            }

            if (phrase.firstChild.classList.contains("su")) {
                len = len / 2;
            }
            if (phrase.firstChild.classList.contains("du")) {
                len = len / 4;
            }

            let width = phrase.getBoundingClientRect().width;

            letters = document.createElement("div");
            letters.replaceChildren(...phrase.childNodes);

            label = document.createElement("div");
            label.innerText = len;
            label.classList.add("text-align-center");
            label.classList.add("count-hints-label");

            let brace = get_curly_brace();
            label.style.width = `${width}px`;
            brace.style.width = `${width}px`;
            brace.classList.add("count-hints-brace");

            phrase.replaceChildren(...[label, brace, letters]);
            phrase.prepend(brace);
            phrase.prepend(label);
            phrase.classList.add("count-hints-container");
        });
    }
}

function hide_count_hints(page) {
    page.querySelectorAll(".count-hints-label").forEach((hint_node) => {
        hint_node.remove();
    });
    page.querySelectorAll(".count-hints-brace").forEach((hint_node) => {
        hint_node.remove();
    });
}

function show_or_hide_count_hints_with_range() {
    let pages = [...document.getElementsByClassName("page")];
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

function change_title_on_scroll(entries) {
    let any_visible = false;
    console.log("Current page is", current_page_in_viewport);

    for (let i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
            any_visible = true;
            break;
        }
    }

    entries.forEach((entry) => {
        console.log(
            "Entry",
            entry.target.innerHTML,
            entry.boundingClientRect,
            entry.isIntersecting
        );

        // Adapted from https://stackoverflow.com/a/63820023
        if (entry.boundingClientRect.top > 100 && entry.isIntersecting) {
            // Title is entering from bottom of viewport
            let new_val = parseInt(
                entry.target.parentNode.id.replace("page-id-", "")
            );
            current_page_in_viewport = new_val;
            show_or_hide_count_hints_with_range();

            if (!entry.target.parentNode.classList.contains("toc")) {
                document.getElementById("current-chapter-title").innerText =
                    entry.target.innerHTML;
            }
        } else if (
            entry.boundingClientRect.top > 100 &&
            !entry.isIntersecting &&
            !any_visible
        ) {
            // Title is exiting from bottom of viewport
            let new_val =
                parseInt(entry.target.parentNode.id.replace("page-id-", "")) -
                1;
            if (new_val < 0) {
                new_val = 0;
            }

            current_page_in_viewport = new_val;
            show_or_hide_count_hints_with_range();

            if (!entry.target.parentNode.classList.contains("toc")) {
                document.getElementById("current-chapter-title").innerText =
                    document.getElementById(
                        "page-id-" + new_val
                    ).childNodes[0].innerHTML;
            }
        }
    });
}
