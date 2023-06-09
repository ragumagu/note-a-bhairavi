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
    Promise.all([
        fetch("/carnatic-notation-app/template.html").then((resp) =>
            resp.text()
        ),
        fetch("/carnatic-notation-app/scripts/render.js").then((resp) =>
            resp.text()
        ),
        fetch("/carnatic-notation-app/scripts/parser.js").then((resp) =>
            resp.text()
        ),
        fetch("/carnatic-notation-app/styles/styles.css").then((resp) =>
            resp.text()
        ),
        fetch("/carnatic-notation-app/styles/render.css").then((resp) =>
            resp.text()
        ),
    ]).then((sources) => {
        let template = sources[0];
        let render_code = sources[1];
        let parser_code = sources[2];
        let styles_css = sources[3];
        let render_css = sources[4];

        let match = `<script id="input" type="text/template"></script>`;
        replace_text = `<script id="input" type="text/template">\n${input}\n</script><!-- end of input -->`;

        template = template.replace(match, replace_text);

        match = `<!-- insert scripts here -->`;
        template = template.replace(
            match,
            match + `\n<script>\n` + parser_code + render_code + `\n</script>\n`
        );

        match = `<!-- insert style sheets here-->`;
        template = template.replace(
            match,
            match + `\n<style>\n` + styles_css + render_css + `\n</style>\n`
        );

        download(template);
    });
}

let download_button = document.getElementById("download-button");
if (download_button) {
    download_button.onclick = download_on_click;
}
