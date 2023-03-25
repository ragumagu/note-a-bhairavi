var pages_window_start = 0;
var pages_window_size = 10;


let new_page_button = document.getElementById("new-page-button")

if (new_page_button !== null) {
    new_page_button.onclick = (e) => {
        let text = document.getElementById("text");
        book[current_page] = text.value; // save current buffer
        current_page++;
        book.splice(current_page, 0, ""); // Add new page.

        text.value = book[current_page];
        render_text(book[current_page], document.getElementById("output"));
        update_page_numbers_window();
    };
}

let home_button_page = document.getElementById("home-page");
home_button_page.onclick = (e) => {
    e.preventDefault();
    current_page = 0;

    let text = document.getElementById("text");
    if (text !== null) {
        text.value = book[current_page];
    }
    render_text(book[current_page], document.getElementById("output"));
    update_page_numbers_window();
}

let fbp = document.getElementById("fast-backward-page");

fbp.onclick = (e) => {
    e.preventDefault();

    current_page -= pages_window_size;

    if (current_page < 0) {
        current_page = 0;
    }

    let text = document.getElementById("text");
    if (text !== null) {
        text.value = book[current_page];
    }
    render_text(book[current_page], document.getElementById("output"));
    update_page_numbers_window();
}

let bp = document.getElementById("previous-page");
bp.onclick = (e) => {
    e.preventDefault();
    current_page--;
    if (current_page < 0) {
        current_page = 0;
    }

    let text = document.getElementById("text");

    if (text !== null) {
        text.value = book[current_page];
    }
    render_text(book[current_page], document.getElementById("output"));
    update_page_numbers_window();
}

let np = document.getElementById("next-page");
np.onclick = (e) => {
    e.preventDefault();
    current_page++;
    console.log("Page number is now", current_page);
    if (current_page === book.length) {
        current_page = book.length - 1;
    }

    let text = document.getElementById("text");
    if (text !== null) {
        text.value = book[current_page];
    }
    render_text(book[current_page], document.getElementById("output"));
    update_page_numbers_window();
}

let fnp = document.getElementById("fast-forward-page");

fnp.onclick = (e) => {
    e.preventDefault();
    current_page += pages_window_size;
    if (current_page >= book.length) {
        current_page = book.length - 1;
    }

    let text = document.getElementById("text");
    if (text !== null) {
        text.value = book[current_page];
    }
    render_text(book[current_page], document.getElementById("output"));
    update_page_numbers_window();
}


function update_page_numbers_window() {
    page_links = [];

    if (book.length === 1) {
        document.getElementById("nav-links").classList.add("hide");
        document.getElementById("nav-links").classList.remove("visible");
        return;
    } else {
        document.getElementById("nav-links").classList.add("visible");
        document.getElementById("nav-links").classList.remove("hide");
    }

    if (current_page > 0) {
        bp.classList.add("visible");
        bp.classList.remove("hide");
    } else {
        bp.classList.add("hide");
        bp.classList.remove("visible");
    }

    if (current_page < book.length - 1) {
        np.classList.add("visible");
        np.classList.remove("hide");
    } else {
        np.classList.add("hide");
        np.classList.remove("visible");
    }

    if (current_page > pages_window_size) {
        fbp.classList.add("visible");
        fbp.classList.remove("hide");
    } else {
        fbp.classList.add("hide");
        fbp.classList.remove("visible");
    }

    if ((book.length - current_page) > pages_window_size) {
        fnp.classList.add("visible");
        fnp.classList.remove("hide");
    } else {
        fnp.classList.add("hide");
        fnp.classList.remove("visible");
    }

    if ((current_page >= pages_window_start + pages_window_size) ||
        (current_page < pages_window_start)) {
        pages_window_start = Math.floor(current_page / pages_window_size) * pages_window_size;
    }

    for (let i = pages_window_start; i < Math.min(pages_window_start + pages_window_size, book.length); i++) {
        let link = document.createElement("a");
        link.innerHTML = i + 1;
        link.classList.add('button-link');

        link.onclick = (e) => {
            e.preventDefault();
            current_page = i;
            let text = document.getElementById("text");
            if (text != null) {
                text.value = book[current_page];
            }
            render_text(book[current_page], document.getElementById("output"));
            update_page_numbers_window();
        }

        if (current_page === i) {
            link.classList.add("bold");
        }

        page_links.push(link);
    }

    document.getElementById("page-numbers-window").replaceChildren(...page_links);
}

update_page_numbers_window(current_page);