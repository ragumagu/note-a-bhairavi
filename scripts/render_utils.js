function apply_rendering(container) {
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
        speed.innerText = speed.innerText.replaceAll("(", "").trim();
        speed.innerText = speed.innerText.replaceAll(")", "").trim();
    });

    document.querySelectorAll(".speed").forEach((speed) => {
        speed.innerText = speed.innerText.replaceAll("_", "").trim();
    });

    let rows = document.querySelectorAll(".row");
    rows.forEach((row) => {
        row.querySelectorAll(".separator").forEach((separator) => {
            if (separator.innerText === Tokens.interpunct) {
                row.removeChild(separator);
                // separator.style.display = "none";
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

    let i = 0;
    while (i < rows.length) {
        if (rows[i].innerText.indexOf("[") >= 0) {
            let alignment = [];
            rows[i].childNodes.forEach((node) => {
                if (node.innerText.trim() === "[r]") {
                    alignment.push("text-align-right");
                } else if (node.innerText.trim() === "[c]") {
                    alignment.push("text-align-center");
                } else {
                    alignment.push("text-align-left");
                }
            });
            let table_rows = get_table_rows(rows[i]);

            for (let j = 1; j < table_rows.length; j++) {
                table_rows[j].childNodes.forEach((node, idx) => {
                    node.classList.add(alignment[idx]);
                });
            }
            rows[i].style.display = "none";
            i += table_rows.length;
            continue;
        }
        i++;
    }
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
                render_text(t, main);
                apply_rendering(main);
            })
            .catch((error) => {
                console.log(error);
            });
    } else {
        input = document.getElementById("input");
        if (input.innerHTML) {
            render_text(input.innerHTML, main);
            apply_rendering(main);
        }
    }

    create_header();
    create_table_of_contents();
}

window.onload = render_content;
