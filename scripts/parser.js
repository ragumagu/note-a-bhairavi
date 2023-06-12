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
    ಧಿ: 1,
    ಧಿಂ: 1,
    ಧುಂ: 1,
    ನ: 1,
    ನ್ನ: 2,
    ನಂ: 1,
    ಮಿ: 1,
    ಣ: 1,
    ಣು: 1,
    ಳಾಂ: 2,
    ",": 1,
    ";": 2,
};

let kannada_to_english = {
    ಕ: "ka",
    ಕಿ: "ki",
    ಕು: "ku",
    ಟ: "Ta",
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
    ಧಿ: "dhi",
    ಧಿಂ: "dhim",
    ಧುಂ: "dhum",
    ನ: "na",
    ನ್ನ: "nna",
    ನಂ: "nam",
    ಮಿ: "mi",
    ಣ: "Na",
    ಣು: "Nu",
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

function get_tokens(text) {
    let tokens = [];

    let buff = "";
    for (let idx = 0; idx < text.length; idx++) {
        if (tokenChars.includes(text[idx])) {
            if (buff) {
                tokens.push(buff);
            }
            tokens.push(text[idx]);
            buff = "";

            continue;
        } else {
            buff += text[idx];
        }
    }
    if (buff) {
        tokens.push(buff);
    }
    return tokens;
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

let alignment = {};

function add_alignment_classes(line) {
    if (
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

    console.log("alignment:", alignment);
    for (const [idx, _class] of Object.entries(alignment)) {
        if (!line.childNodes[idx]) {
            break;
        }
        line.childNodes[idx].classList.add(_class);
    }
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

function parse(text) {
    console.log("INPUT:", JSON.stringify(text));

    additional_classes = [];
    let tokens = [...text];

    let i = 0;
    let lines = [];
    let line = document.createElement("div");
    let new_line = true;

    let group = document.createElement("span");
    group.classList.add("group");

    while (true) {
        if (i >= tokens.length) {
            if (line.classList.contains("row")) {
                add_alignment_classes(line);
            }
            lines.push(line);
            break;
        }

        if (tokens[i] === Tokens.newLine) {
            if (line.childNodes.length > 0) {
                if (line.classList.contains("row")) {
                    add_alignment_classes(line);
                }
                lines.push(line);
            }
            if (tokens[i + 1] && tokens[i + 1] == Tokens.newLine) {
                alignment = {};
                line = document.createElement("div");
                line.innerHTML = "<br>";

                line.id = `char-${i + 1}`;
                line.classList.add("empty-line");
                lines.push(line);
            }
            line = document.createElement("div");
            i += 1;
            new_line = true;
            continue;
        } else if (
            new_line &&
            tokens[i] == Tokens.dollar &&
            tokens[i + 1] &&
            tokens[i + 1] == Tokens.hash
        ) {
            add_phrase_to_container(tokens[i], i, line, [
                "chapter-title-marker",
            ]);
            add_phrase_to_container(tokens[i + 1], i, line, [
                "chapter-title-marker",
            ]);
            line.classList.add("h1");
            i += 2;
        } else if (
            new_line &&
            tokens[i] == Tokens.hash &&
            tokens[i + 1] &&
            tokens[i + 1] == Tokens.hash
        ) {
            add_phrase_to_container(tokens[i], i, line, ["heading-marker"]);
            add_phrase_to_container(tokens[i + 1], i, line, ["heading-marker"]);
            line.classList.add("h2");
            i += 2;
        } else if (
            tokens[i] == Tokens.interpunct ||
            tokens[i] === Tokens.pipe ||
            tokens[i] === Tokens.backSlash ||
            tokens[i] === Tokens.pilcrow
        ) {
            add_phrase_to_container(tokens[i], i, line, ["marker"]);
            line.classList.add("row");
            i += 1;
        } else {
            i = _process_char_group(tokens, i, line);
        }
        new_line = false;
    }
    return lines;
}
