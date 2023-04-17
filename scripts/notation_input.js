var text_input_mode = "table";

function add_text(e) {
    console.log(e);
    let text = document.getElementById("text");
    let cursor_pos = text.selectionEnd;
    let offset = 0;

    let inp_text = e.currentTarget.value;

    if (!(text.value === "")) {
        text.value = text.value.substring(0, cursor_pos) + inp_text + " " + text.value.substring(cursor_pos);
        offset = inp_text.length + 1;
    } else {
        let new_text = inp_text;
        if (text_input_mode === "table") {
            new_text = "*|| " + inp_text + " " + " ||*";
            offset = "*|| ".length + inp_text.length + 1;
        } else {
            offset = new_text.length;
        }
        text.value = new_text;
    }

    book[current_page] = text.value;
    render_text(book[current_page], document.getElementById("output"));
    text.focus();
    text.selectionEnd = cursor_pos + offset;

};

document.getElementById("aksharas_table").childNodes.forEach((tbody) => {
    tbody.childNodes.forEach((tr) => {
        tr.childNodes.forEach((td) => {
            if (td.nodeType === 1) {
                td.firstChild.onclick = add_text;
            }
        })
    })
});

document.getElementById('text').onkeydown = (e) => {
    let text = document.getElementById("text");
    let cursor_pos = text.selectionEnd;
    console.log("keydown text", text.selectionStart, text.selectionEnd);
    if (e.code === "Backspace") {
        if (text.selectionEnd === text.selectionStart) {
            e.preventDefault();
            start = cursor_pos - 1;
            while (isDiacritic(text.value.substring(start, start + 1)) && start > 0) {
                start--;
            }
            console.log("Backspace will remove:'" + text.value.substring(start, cursor_pos) + "'", text.value.substring(start, cursor_pos) in aksharas);

            text.value = text.value.substring(0, start) + text.value.substring(cursor_pos);
            text.selectionEnd = start;
        }
    }

}

document.getElementById("text").onkeyup = (e) => {
    console.log("onkeyup, text changed", e.code, e.key);

    let text = document.getElementById("text");
    let cursor_pos = text.selectionEnd;

    let paired_input = false;

    if (e.code === "Enter") {
        let cursor_is_in_middle_of_line = false;
        if (text.value.length > cursor_pos && (!(text.value[cursor_pos] === "\n"))) {
            cursor_is_in_middle_of_line = true;
        }
        console.log('text, cursor_pos', text.value, cursor_pos, cursor_is_in_middle_of_line);

        if (text_input_mode === "table" && cursor_is_in_middle_of_line) {
            text.value = text.value.substring(0, cursor_pos - 1) + "||\n|| " + text.value.substring(cursor_pos);
            text.selectionEnd = cursor_pos + "||\n|| ".length - 1;
        }
    } else if (["(", "[", "{", "*"].includes(e.key)) {
        paired_input = true;
    }

    console.log("paired input", paired_input);
    if (paired_input) {
        let matching = {
            "(": ")",
            "[": "]",
            "{": "}",
            "*": "*"
        };
        text.value = text.value.substring(0, cursor_pos) + matching[e.key] + text.value.substring(cursor_pos);
        text.selectionEnd = cursor_pos;
    }

    book[current_page] = text.value;
    render_text(book[current_page], document.getElementById("output"));
};



document.getElementById("file-upload").onchange = (e) => {
    if (e.target.files[0]) {
        const reader = new FileReader()
        reader.onload = (e) => {
            let text = e.target.result;
            start_token = `<script id="input" type="text/template">`;
            end_token = `</script><!-- end of input -->`;
            start = text.indexOf(start_token);
            end = text.indexOf(end_token);
            if (start === -1 || end === -1) {
                let alert_message = "Could not parse uploaded file.\n" +
                    "Please try to recover by these steps:\n1. Open the file in a browser, \n" +
                    "2. Copy and paste the content into the input box, recreate the styling, and \n" +
                    "3. Download the file again."
                alert(alert_message);
            }
            if (start !== -1) {
                start += start_token.length;
            }

            input_text = text.substring(start, end);

            document.getElementById('text').value = input_text;
            render_text(input_text, document.getElementById("output"));
        };

        reader.readAsText(e.target.files[0])
    }
};

function download(text) {
    // From https://stackoverflow.com/a/48550997
    text = text.replace(/\n/g, "\r\n"); // To retain the Line breaks.
    var blob = new Blob([text], {
        type: "text/plain"
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


var notation_core = null;

fetch("/carnatic-notation-app/scripts/notation_core.js")
    .then((response) => response.text())
    .then((text) => {
        return text;
    }).then((t) => {
        notation_core = t;
    })
    .catch((error) => {
        console.log(error);
    });

var stylesheet = null;

fetch("/carnatic-notation-app/styles/styles.css")
    .then((response) => response.text())
    .then((text) => {
        return text;
    }).then((t) => {
        stylesheet = t;
    })
    .catch((error) => {
        console.log(error);
    });

var output_template = null;
fetch("/carnatic-notation-app/template.html")
    .then((response) => response.text())
    .then((text) => {
        return text;
    }).then((t) => {
        output_template = t;
    })
    .catch((error) => {
        console.log(error);
    });


document.getElementById("download-button").onclick = async(e) => {

    let input = document.getElementById("text").value;

    let match = `<script id="notation_core"><\/script>`;
    replace_text = `<script id="notation_core">${notation_core}<\/script>`
    let html = output_template.replace(match, replace_text);

    match = `<style></style>`;
     replace_text= `<style>${stylesheet}</style>`;
    html = html.replace(match, replace_text);

    match = `<script id="input" type="text/template"></script>`;
    replace_text = `<script id="input" type="text/template">\n${input}\n</script><!-- end of input -->`;
                    
    html = html.replace(match, replace_text);

    download(html);
};