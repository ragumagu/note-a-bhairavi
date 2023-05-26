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

const Tokens = {
    pipe: "|",
    slash: "/",
    dollar: "$",
    hash: "#",
    newLine: "\n",
    underscore: "_",
    leftBracket: "[",
    rightBracket: "]",
    leftParen: "(",
    rightParen: ")",
    pilcrow: "⁋",
    plus: "+",
};

const nbsp = String.fromCharCode(160);
const row_markers = ["||", Tokens.pilcrow];

const tokenChars = Object.values(Tokens);
console.log(tokenChars, typeof tokenChars);

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

function _process_letter_group(tokens, startIndex, line) {
    let idx = startIndex;

    let opening_parens = 0;
    let closing_parens = 0;
    let out = document.createElement("span");
    out.classList.add("letter-group");
    let buf = "";
    while (true) {
        if (
            idx === tokens.length ||
            tokens[idx] === Tokens.newLine ||
            tokens[idx] === Tokens.pipe ||
            tokens[idx] === Tokens.pilcrow ||
            tokens[idx] === Tokens.slash
        ) {
            if (buf) {
                let span = document.createElement("span");
                span.innerText = buf;
                out.appendChild(span);
            }
            break;
        } else if (tokens[idx] === Tokens.leftParen) {
            if (buf && buf != "(") {
                let span = document.createElement("span");
                span.innerText = buf;
                out.appendChild(span);
                buf = "";
            }

            buf += tokens[idx];
            opening_parens += 1;
        } else if (tokens[idx] === Tokens.rightParen) {
            buf += tokens[idx];
            closing_parens -= 1;
            if (opening_parens + closing_parens == 0) {
                let span = document.createElement("span");
                span.classList.add("speed");
                span.innerText = buf;

                if (tokens[idx + 1] === Tokens.underscore) {
                    span.innerText += "_";
                    let sub = document.createElement("span");
                    sub.innerText = tokens[idx + 2].trim();
                    sub.classList.add("subscript");
                    span.appendChild(sub);

                    out.appendChild(span);
                    idx += 3;
                } else if (opening_parens == 2) {
                    span.classList.add("du");
                    out.appendChild(span);
                    idx += 1;
                } else {
                    span.classList.add("su");
                    out.appendChild(span);
                    idx += 1;
                }
                buf = "";
                opening_parens = 0;
                closing_parens = 0;
                continue;
            }
        } else {
            buf += tokens[idx];
        }
        idx += 1;
    }
    line.appendChild(out);
    return idx;
}

function _process_row(tokens, startIndex, line) {
    let idx = startIndex;
    let buf = "";

    while (true) {
        if (tokens[idx] == Tokens.pipe) {
            let span = document.createElement("span");
            buf += tokens[idx];

            if (tokens[idx + 1] && tokens[idx + 1] == Tokens.pipe) {
                buf += tokens[idx + 1];
                span.classList.add("row-marker");
                idx += 2;
            } else {
                span.classList.add("separator");
                idx += 1;
            }

            span.innerText = buf;
            line.appendChild(span);

            buf = "";
            continue;
        } else if (tokens[idx] == Tokens.slash) {
            let span = document.createElement("span");
            span.classList.add("separator");
            span.innerText = tokens[idx];
            line.appendChild(span);
        } else if (tokens[idx] == Tokens.pilcrow) {
            let span = document.createElement("span");
            span.classList.add("row-marker");
            span.innerText = tokens[idx];
            line.appendChild(span);
        } else if (tokens[idx] == Tokens.newLine || idx === tokens[length]) {
            break;
        } else {
            idx = _process_letter_group(tokens, idx, line);
            continue;
        }
        idx += 1;
    }
    let markers = line.querySelectorAll(".row-marker");
    for (let i = 0; i < markers.length; i++) {
        if (i == 0) {
            markers[i].classList.add("start-row-marker");
        } else {
            markers[i].classList.add("end-row-marker");
        }
    }
    return idx;
}

function parse(text) {
    console.log("INPUT:", JSON.stringify(text));
    let tokens = get_tokens(text);
    console.log("TOKENS:", JSON.stringify(tokens));
    let i = 0;
    let lines = [];
    let line = document.createElement("div");
    let new_line = true;
    while (true) {
        if (i == tokens.length) {
            lines.push(line);
            break;
        }
        if (
            new_line &&
            tokens[i] == Tokens.dollar &&
            tokens[i + 1] &&
            tokens[i + 1] == Tokens.hash
        ) {
            line.classList.add("h1");
            line.appendChild(document.createTextNode("$#"));
            i += 2;
            new_line = false;
            continue;
        } else if (
            new_line &&
            tokens[i] == Tokens.hash &&
            tokens[i + 1] &&
            tokens[i + 1] == Tokens.hash
        ) {
            line.classList.add("h2");
            line.appendChild(document.createTextNode("##"));
            i += 2;
            new_line = false;
            continue;
        } else if (
            new_line &&
            tokens[i] == Tokens.pipe &&
            tokens[i + 1] &&
            tokens[i + 1] == Tokens.pipe
        ) {
            line.classList.add("row");
            i = _process_row(tokens, i, line);
            new_line = false;
            continue;
        } else if (new_line && tokens[i] == Tokens.pilcrow) {
            line.classList.add("row");
            i = _process_row(tokens, i, line);
            new_line = false;
            continue;
        } else if (tokens[i] == Tokens.newLine) {
            lines.push(line);
            if (tokens[i + 1] && tokens[i + 1] == Tokens.newLine) {
                line = document.createElement("div");
                line.innerHTML = "<br>";
                lines.push(line);
            }
            line = document.createElement("div");
            i += 1;
            new_line = true;
        } else if (tokens[i] == Tokens.plus) {
            if (tokens[i + 1] && tokens[i + 1] == Tokens.newLine) {
                i += 2;
                new_line = false;
                continue;
            }
        } else {
            line.innerText += tokens[i];
            i += 1;
            new_line = false;
        }
    }

    return lines;
}

// parse("");
// parse(" ");
// parse("ab");
// parse("abc ");
// parse("$# abc");
// parse("## abc");
// parse("abc\ndef");
// parse("abc \ndef");
// parse("a b  cd \n    dfsdf \n");
// parse("|| a b  (cd) | df/sdf || \n");
// parse("|| a b || ((cd)) | dfsdf || \n");
// parse("a b || ((cd)) | dfsdf || \n");
