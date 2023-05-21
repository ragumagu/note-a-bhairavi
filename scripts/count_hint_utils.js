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
    if (span.querySelector(".count-hints-brace") || span.querySelector(".count-hints-label")) {
        return;
    }

    let len = get_aksharas_count(span.innerText);
    if (len === 0) {
        return;
    }
    label = document.createElement("label");
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
    span.classList.add("count-hints-container");

    span.style.alignItems = alignment;
}

function show_count_hints(page) {
    let nodes = page.querySelectorAll(".letter-group");

    for (let i = 0; i < nodes.length; i++) {
        let container = nodes[i];

        let alignment = "start";
        if (container.classList.contains("text-align-right")) {
            alignment = "end";
        }else if (container.classList.contains("text-align-center")){
            alignment = "center";
        }
        let spans = container.querySelectorAll("span");
        spans.forEach((span) => add_curly_brace(span, alignment));
    }
}

function hide_count_hints(page) {
    page.querySelectorAll(".count-hints-label").forEach((hint_node) => {
        hint_node.remove();
    });
    page.querySelectorAll(".count-hints-brace").forEach((hint_node) => {
        hint_node.remove();
    });
    page.querySelectorAll(".count-hints-container").forEach((hint_node) => {
        hint_node.classList.remove("count-hints-container");
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

// let page_id = location.hash;
// let title = document.querySelector(page_id).querySelector(".h1").innerText;
// document.querySelector("#current-chapter-title").innerText = title;

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
