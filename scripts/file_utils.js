function get_editor_text_content(elem) {
    // This hack is required because content-editable refuses to cooperate
    // Go the solution from:
    // https://stackoverflow.com/a/15349136/5940228
    var sel = window.getSelection();

    // Save ranges from selection
    let oldRanges = [];
    for (let i = 0; i < sel.rangeCount; i++) {
        oldRanges.push(sel.getRangeAt(i));
    }
    sel.removeAllRanges();

    // Get elem text
    let elemRange = document.createRange();
    elemRange.selectNode(elem);
    sel.addRange(elemRange);
    let text = sel.toString();
    text = text.replaceAll("\r\n", "\n");
    text = text.replaceAll("||\n", "||" + nbsp + "\n");
    text = text.replaceAll(Tokens.pilcrow + "\n", Tokens.pilcrow + nbsp + "\n");
    // console.log("SAVING TEXT");
    // console.log(JSON.stringify(text));

    // Restore old selection and return
    sel.removeAllRanges();
    for (let i = 0; i < oldRanges.length; i++) {
        sel.addRange(oldRanges[i]);
    }
    return text;
}

function on_file_upload(e) {
    if (e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            let text = e.target.result;
            start_token = `<script id="input" type="text/template">`;
            end_token = `</script><!-- end of input -->`;
            start = text.indexOf(start_token);
            end = text.indexOf(end_token);
            if (start === -1 || end === -1) {
                let alert_message =
                    "Could not parse uploaded file.\n" +
                    "Please try to recover by these steps:\n1. Open the file in a browser, \n" +
                    "2. Copy and paste the content into the input box, recreate the styling, and \n" +
                    "3. Download the file again.";
                alert(alert_message);
            }
            if (start !== -1) {
                start += start_token.length;
            }

            input_text = text.substring(start, end);

            render_text(input_text, document.querySelector("main"));
            apply_formatting(document.querySelector("main"));
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

document.getElementById("download-button").onclick = async (e) => {
    let main = document.querySelector("main");
    localStorage.setItem("input_string", get_editor_text_content(main));
    let input = localStorage.getItem("input_string");

    console.log("got text content:");
    console.log(input);

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
};
