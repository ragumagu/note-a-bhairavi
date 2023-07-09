const Tokens = {
    pipe: "|",
    slash: "/",
    backSlash: "\\",
    dollar: "$",
    hash: "#",
    newLine: "\n",
    underscore: "_",
    leftBracket: "[",
    rightBracket: "]",
    leftParen: "(",
    rightParen: ")",
    pilcrow: "⁋",
    interpunct: "·",
};

const nbsp = String.fromCharCode(160);
const row_markers = ["||", Tokens.pilcrow];

const tokenChars = Object.values(Tokens);

let additional_classes = [];

const Aksharas = {
    ಕ: 1,
    ಕಿ: 1,
    ಕು: 1,
    ಟ: 1,
    ಗಿ: 1,
    ಗ: 1,
    ಗು: 1,
    ಗುಂ: 1,
    ಝ: 1,
    ಝಂ: 1,
    ತ: 1,
    ರಿ: 1,
    ತ್: 0,
    ತಾ: 2,
    ತಾಂ: 2,
    ತ್ಲಾಂ: 2,
    ತೊ: 1,
    ತೊಂ: 1,
    ದಿ: 1,
    ದಿಂ: 1,
    ಧಿ: 1,
    ಧಿಂ: 1,
    ಧುಂ: 1,
    ನ: 1,
    ನ್ನ: 2,
    ನಂ: 1,
    ಮಿ: 1,
    ಣ: 1,
    ಣು: 1,
    ಳ: 1,
    ಳಾಂ: 2,
    ",": 1,
    ";": 2,
};

let kannada_to_english = {
    ಕ: "ka",
    ಕಿ: "ki",
    ಕು: "ku",
    ಟ: "Ta",
    ಗ: "ga",
    ಗಿ: "gi",
    ಗು: "gu",
    ಗುಂ: "gum",
    ಝ: "jha",
    ಝಂ: "jham",
    ತ: "ta",
    ರಿ: "ri",
    ತ್: "th",
    ತಾ: "taa",
    ತಾಂ: "taam",
    ತ್ಲಾಂ: "tlaam",
    ತೊ: "tho",
    ತೊಂ: "thom",
    ದಿ: "di",
    ದಿಂ: "dim",
    ಧಿ: "dhi",
    ಧಿಂ: "dhim",
    ಧುಂ: "dhum",
    ನ: "na",
    ನ್ನ: "nna",
    ನಂ: "nam",
    ಮಿ: "mi",
    ಣ: "Na",
    ಣು: "Nu",
    ಳ: "La",
    ಳಾಂ: "Lam",
    ",": ",",
    ";": ";",
};
let akshara_list = Object.keys(Aksharas).sort((a, b) => {
    return b.length - a.length;
});

function get_aksharas_count(text) {
    let i = 0;
    let count = 0;
    while (i < text.length) {
        let match = false;
        for (let j = 0; j < akshara_list.length; j++) {
            if (text.startsWith(akshara_list[j], i)) {
                match = akshara_list[j];
                break;
            }
        }
        if (match) {
            count += Aksharas[match];
            i += match.length;
        } else {
            i += 1;
        }
    }
    return count;
}

function lint(text) {
    text = text.replaceAll("\r\n", "\n") + "\n";
    return text;
}

function add_phrase_to_container(token, i, container, classes) {
    let char = document.createElement("span");
    char.innerText = token;

    classes.forEach((_class) => {
        char.classList.add(_class);
    });
    additional_classes.forEach((_class) => {
        char.classList.add(_class);
    });

    char.id = `char-${i}`;
    container.appendChild(char);
}

function _process_char_group(tokens, idx, line) {
    let group = document.createElement("span");
    group.classList.add("group");

    let phrase = document.createElement("span");
    phrase.classList.add("phrase");

    while (idx < tokens.length) {
        if (
            tokens[idx] === Tokens.newLine ||
            tokens[idx] === Tokens.interpunct ||
            tokens[idx] === Tokens.pilcrow ||
            tokens[idx] === Tokens.backSlash ||
            tokens[idx] === Tokens.pipe
        ) {
            if (phrase.childNodes.length > 0) {
                group.appendChild(phrase);
            }

            if (group.childNodes.length > 0) {
                line.appendChild(group);
            }

            return idx;
        } else if (tokens[idx] == Tokens.leftParen) {
            if (phrase.childNodes.length > 0) {
                group.appendChild(phrase);

                phrase = document.createElement("span");
                phrase.classList.add("phrase");
            }

            let right_paren_pos = idx + 1;
            let match = 1;
            while (right_paren_pos < tokens.length) {
                if (tokens[right_paren_pos] == Tokens.rightParen) {
                    match -= 1;
                } else if (tokens[right_paren_pos] == Tokens.leftParen) {
                    match += 1;
                }
                if (match == 0) {
                    break;
                }
                right_paren_pos += 1;
            }

            if (additional_classes.includes("su")) {
                additional_classes.push("du");
            } else if (
                tokens[right_paren_pos + 1] &&
                tokens[right_paren_pos + 1] !== Tokens.underscore
            ) {
                additional_classes.push("su");
            }

            if (
                additional_classes.includes("su") &&
                tokens[idx + 1] &&
                tokens[idx + 1] == Tokens.leftParen
            ) {
                additional_classes.push("du");
            }
        } else if (tokens[idx] == Tokens.rightParen) {
            add_phrase_to_container(tokens[idx], idx, phrase, ["letter"]);

            if (
                additional_classes.includes("du") &&
                tokens[idx + 1] &&
                tokens[idx + 1] != Tokens.rightParen
            ) {
                additional_classes = additional_classes.filter(
                    (i) => i != "du"
                );

                if (phrase.childNodes.length > 0) {
                    group.appendChild(phrase);

                    phrase = document.createElement("span");
                    phrase.classList.add("phrase");
                }
            } else if (additional_classes.includes("su")) {
                additional_classes = additional_classes.filter(
                    (i) => i != "su"
                );

                if (phrase.childNodes.length > 0) {
                    group.appendChild(phrase);

                    phrase = document.createElement("span");
                    phrase.classList.add("phrase");
                }
            }

            idx += 1;

            continue;
        } else if (tokens[idx] === Tokens.underscore) {
            if (phrase.childNodes.length > 0) {
                group.appendChild(phrase);

                phrase = document.createElement("span");
                phrase.classList.add("phrase");
            }
            add_phrase_to_container(tokens[idx], idx, phrase, [
                "letter",
                "underscore",
            ]);
            idx += 1;
            while (idx < tokens.length) {
                if (
                    tokens[idx] &&
                    tokens[idx] != " " &&
                    tokens[idx] != Tokens.newLine
                ) {
                    add_phrase_to_container(tokens[idx], idx, phrase, [
                        "letter",
                        "subscript",
                    ]);
                    idx += 1;
                } else {
                    break;
                }
            }
            continue;
        }
        add_phrase_to_container(tokens[idx], idx, phrase, ["letter"]);
        idx += 1;
    }
}

function _process_line(tokens, idx, line) {
    while (idx < tokens.length) {
        if (tokens[idx] === Tokens.newLine) {
            return idx;
        } else if (
            tokens[idx] === Tokens.dollar &&
            tokens[idx + 1] &&
            tokens[idx + 1] === Tokens.hash
        ) {
            add_phrase_to_container(tokens[idx], idx, line, [
                "chapter-title-marker",
            ]);
            add_phrase_to_container(tokens[idx + 1], idx + 1, line, [
                "chapter-title-marker",
            ]);
            line.classList.add("h1");
            idx += 2;
        } else if (
            tokens[idx] === Tokens.hash &&
            tokens[idx + 1] &&
            tokens[idx + 1] === Tokens.hash
        ) {
            add_phrase_to_container(tokens[idx], idx, line, ["heading-marker"]);
            add_phrase_to_container(tokens[idx + 1], idx + 1, line, [
                "heading-marker",
            ]);
            line.classList.add("h2");
            idx += 2;
        } else if (
            tokens[idx] === Tokens.interpunct ||
            tokens[idx] === Tokens.pipe ||
            tokens[idx] === Tokens.pilcrow ||
            tokens[idx] === Tokens.backSlash
        ) {
            add_phrase_to_container(tokens[idx], idx, line, ["marker"]);
            line.classList.add("row");
            idx += 1;
        } else {
            idx = _process_char_group(tokens, idx, line);
        }
    }
}

function check_if_nodes_match(a, b) {
    if (!b){
        return false;
    }
    if (a.classList.contains("group") && b.classList.contains("group")) {
        return true;
    } else if (
        a.classList.contains("marker") &&
        b.classList.contains("marker")
    ) {
        if (a.innerText === b.innerText) {
            return true;
        }
        if (
            a.innerText === Tokens.backSlash ||
            b.innerText === Tokens.backSlash
        ) {
            return true;
        }
    }
    return false;
}

let alignment = {};

function add_alignment_classes(line) {
    if (
        line.innerText.indexOf("[L]") >= 0 ||
        line.innerText.indexOf("[R]") >= 0 ||
        line.innerText.indexOf("[C]") >= 0
    ) {
        alignment = {};
        groups = line.childNodes;
        for (let i = 0; i < groups.length; i++) {
            if (groups[i].innerText.trim() === "[L]") {
                alignment[i] = "text-align-left";
            } else if (groups[i].innerText.trim() === "[R]") {
                alignment[i] = "text-align-right";
            } else if (groups[i].innerText.trim() === "[C]") {
                alignment[i] = "text-align-center";
            }
        }
    }

    for (const [idx, _class] of Object.entries(alignment)) {
        if (!line.childNodes[idx]) {
            break;
        }
        line.childNodes[idx].classList.add(_class);
    }
}

function format_table(table) {
    let max_cols = 0;
    let max_row = 0;

    let rows = table.querySelectorAll(".row");
    let starts = [];
    let spans = [];
    rows.forEach((row, idx) => {
        let _starts = [];
        let _spans = [];
        row.childNodes.forEach((node, i) => {
            _starts.push(i);
            _spans.push(1);
        });
        if (max_cols < row.childNodes.length) {
            max_cols = row.childNodes.length;
            max_row = idx;
        }
        starts.push(_starts);
        spans.push(_spans);
    });

    for (let i = 0; i < rows.length; i++) {
        if (i === max_row) {
            continue;
        }

        let ref = 0;
        for (let j = 0; j < starts[i].length; j++) {
            if (
                check_if_nodes_match(
                    rows[i].childNodes[j],
                    rows[max_row].childNodes[ref]
                )
            ) {
            } else {
                let match = false;
                while (ref < max_cols) {
                    if (!rows[max_row].childNodes[ref]) {
                        break;
                    }
                    if (
                        check_if_nodes_match(
                            rows[i].childNodes[j],
                            rows[max_row].childNodes[ref]
                        )
                    ) {
                        match = true;
                        break;
                    }
                    ref += 1;
                }

                if (match) {
                    if (
                        rows[i].childNodes[j - 1] &&
                        rows[i].childNodes[j - 1].classList.contains("group")
                    ) {
                        spans[i][j - 1] = ref - starts[i][j - 1];
                    }
                    let offset = 0;
                    for (let k = j; k < starts[i].length; k++) {
                        starts[i][k] = ref + offset;
                        offset++;
                    }
                }
            }
            ref += 1;
        }
    }

    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < starts[i].length; j++) {
            rows[i].childNodes[j].style.gridColumn = `${
                starts[i][j] + 1
            } / span ${spans[i][j]}`;
            rows[i].childNodes[j].style.gridRow = i + 1;
        }
    }

    table.style.gridTemplateColumns = `repeat(${max_cols},auto)`;
}


function parse(text) {
    console.log("INPUT:", JSON.stringify(text));

    additional_classes = [];
    let tokens = [...text];

    let i = 0;
    let lines = [];
    let line = document.createElement("div");
    let table = document.createElement("div");
    table.classList.add("table");

    while (true) {
        if (i >= tokens.length) {
            if (table.childNodes.length > 0) {
                format_table(table);
                lines.push(table);
                table = document.createElement("div");
                table.classList.add("table");
            }
            break;
        }
        if (tokens[i] === Tokens.newLine) {
            if (tokens[i + 1] && tokens[i + 1] == Tokens.newLine) {
                if (table.childNodes.length > 0) {
                    format_table(table);
                    lines.push(table);
                    table = document.createElement("div");
                    table.classList.add("table");
                }

                line = document.createElement("div");
                line.innerHTML = "<br>";

                line.id = `char-${i + 1}`;
                line.classList.add("empty-line");
                console.log("empty line", line);
                lines.push(line);
            }
            i += 1;
            line = document.createElement("div");
            continue;
        } else {
            i = _process_line(tokens, i, line);
            if (line.classList.contains("row")) {
                add_alignment_classes(line);
                table.appendChild(line);
                table.style.gridTemplateColumns = `repeat(${line.childNodes.length},auto)`;
            } else {
                if (table.childNodes.length > 0) {
                    format_table(table);
                    lines.push(table);
                    table = document.createElement("div");
                    table.classList.add("table");
                }
                lines.push(line);
                line = document.createElement("div");
            }
        }
    }
    return lines;
}
