function apply_rendering(text, container) {
    var startTime = performance.now();
    let result = parse(text);
    var endTime = performance.now();
    console.log(
        `Parser took ${endTime - startTime} milliseconds to lint and parse ${
            text.length
        } characters.`
    );

    // container.replaceChildren(...result.nodes);

    let pages = [];
    let page = [];

    for (let i = 0; i < result.nodes.length; i++) {
        if (result.nodes[i].querySelector(".h1")) {
            if (page.length > 0) {
                let page_section = document.createElement("section");
                page_section.classList.add("page");
                page_section.replaceChildren(...page);

                pages.push(page_section);
                page = [];
            }
        }
        page.push(result.nodes[i]);
    }

    if (page.length > 0) {
        let page_section = document.createElement("section");
        page_section.classList.add("page");
        page_section.replaceChildren(...page);

        pages.push(page_section);
        page = [];
    }

    container.replaceChildren(...pages);

    container.querySelectorAll(".hidden").forEach((n)=>{
        n.style.visibility ='hidden';
    });

    container.querySelectorAll(".directive").forEach((n)=>{
        // Hack which fixes heading alignment when
        // heading line startswith with >#
        if (n.nextSibling){
            n.nextSibling.style.gridColumnStart = 1;
        }
        n.style.display ='none';
    });

    container.querySelectorAll(".row").forEach((n)=>{
        let pilcrows = n.querySelectorAll(".pilcrow")
        if (pilcrows.length>1){
            let last =pilcrows[pilcrows.length-1];
            last.classList.add('flip-horizontal');
        }
    });

    container.querySelectorAll(".superscript").forEach((subscript) => {
        subscript.innerText = subscript.innerText.replaceAll("^", "").trim();
    });

    container.querySelectorAll(".subscript").forEach((subscript) => {
        subscript.innerText = subscript.innerText.replaceAll("_", "").trim();
    });

    return;

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
        if (
            row.innerText.indexOf("[L]") >= 0 ||
            row.innerText.indexOf("[R]") >= 0 ||
            row.innerText.indexOf("[C]") >= 0
        ) {
            row.style.display = "none";
            return;
        } else if (row.innerText.indexOf("/") >= 0) {
            row.style.visibility = "hidden";
            return;
        }

        row.querySelectorAll(".marker").forEach((separator) => {
            if (separator.innerText === Tokens.interpunct) {
                row.removeChild(separator);
            } else if (separator.innerText === Tokens.backSlash) {
                separator.style.visibility = "hidden";
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


    console.log("ids",ids);
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
        fetch("/note-a-bhairavi/content/" + input)
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
        if (input && input.innerHTML) {
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
    for (let i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
            any_visible = true;
            break;
        }
    }

    entries.forEach((entry) => {
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
