(function ($) {

    "use strict";
    var BiTreeNode, chars, morse, morseHtmlImage, morsePlayer, morseBlinker;
    BiTreeNode = function (letter, left, right) {
        this.letter = letter;
        this.left = left;
        this.right = right;
    };

    BiTreeNode.prototype = {

        constructor: BiTreeNode

    };
    chars = '';
    morse = {
        alphabet: null,
        reverser: null,
        dash: '-',
        dot: '.',
        init: function () {
            this.alphabet = [
                // Letters
                '.-', '-...', '-.-.', '-..', '.', '..-.', '--.', '....', '..', '.---', '-.-',
                '.-..', '--', '-.', '---', '.--.', '--.-', '.-.', '...', '-', '..-', '...-',
                '.--', '-..-', '-.--', '--..',
                // Numbers
                '-----', '.----', '..---', ' ...---', '....-', '.....', '-....', '--...', '---..', '----.' // 9
            ];
            this.reverser = new BiTreeNode('', null, null);
            var cNode, map, i, j;
            cNode = this.reverser;
            map = "abcdefghijklmnopqrstuvwxyz0123456790";
            for (i = 0; i < this.alphabet.length; i += 1) {
                for (j = 0; j < this.alphabet[i].length; j += 1) {
                    if (this.alphabet[i].charAt(j) === this.dot) { // dot detection
                        if (cNode.left === null) {
                            cNode.left = new BiTreeNode(null, null, null);
                        }
                        cNode = cNode.left;
                    } else if (this.alphabet[i].charAt(j) === this.dash) { // dash detection
                        if (cNode.right === null) {
                            cNode.right = new BiTreeNode(null, null, null);
                        }
                        cNode = cNode.right;
                    }
                }
                cNode.letter = map.charAt(i);
                cNode = this.reverser;
            }
        },
        toMorse: function (input) {
            var translation = '', invalid_chars = false, chars = 0, code = '', sep = '', i = 0;
            if (null !== input) {
                input = input.toUpperCase();
                for (i = 0; i < input.length; i += 1) {
                    if (input.charAt(i) === ' ') {
                        translation += ' / '; // Word separator
                    } else {
                        code = input.charCodeAt(i);
                        if (code > 64) { // Char detection
                            code -= 65;
                        }
                        if (code > 47) { // Number detection
                            code = 24;
                        }
                        if (code === 32) { // TODO remove?
                            code = this.alphabet.length - 1;
                        }
                        if (code >= 0 && code < this.alphabet.length) {
                            translation += sep + this.alphabet[code];
                            chars += 1;
                            sep = ' ';
                        }
                    }
                }
            }
            return translation;
        },
        toText: function (input) {
            var cNode = this.reverser, txt = '', i = 0;
            for (i = 0; i < input.length; i += 1) {
                if (input.charAt(i) === this.dot) { // dot
                    cNode = cNode.left;
                } else if (input.charAt(i) === this.dash) {
                    cNode = cNode.right;
                } else if (input.charAt(i) === ' ') {
                    txt += cNode.letter;
                    cNode = this.reverser;
                } else if (input.charAt(i) === "/") {
                    txt += ' ';
                }
            }
            txt += cNode.letter;
            return txt;
        }
    };
    morseHtmlImage = {
        x: 0,
        y: 0,
        dot: 5,
        ctx: null,
        canvas: null,
        init: function (canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (this.canvas.getContext) {
                this.ctx = this.canvas.getContext("2d");
            }
        },
        draw: function (offset) {
            if (this.x + offset + 2 > this.canvas.width) {
                this.y += 10;
                this.x = 0;
            }
            this.ctx.fillStyle = "#2779AA";
            this.ctx.fillRect(this.x, this.y, this.dot * offset, 5);
            this.x += this.dot * (offset + 1);
        },
        toImage: function (morse) {
            var i = 0;
            this.x = 0;
            this.y = 0;
            this.clear();
            for (i = 0; i < morse.length; i += 1) {
                if (morse.charAt(i) === '.') {
                    //this._drawDot();
                    this.draw(1);
                } else if (morse.charAt(i) === '-') {
                    this.draw(3);
                } else if (morse.charAt(i) === ' ') { //  TODO change this and the next to a space/ word separator
                    this.x += this.dot * 3; // Letter separator
                } else if (morse.charAt(i) === '/') {
                    this.x += this.dot * 7; // Space
                }
            }
        },
        clear: function () {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    };

    morsePlayer = {
        observers: null,
        mcode: null,
        timeout: null,
        setCode: function (code) {
            this.mcode = code;
        },
        play: function () {
            if (this.mcode !== '') {
                this.step(0);
            } else {
                return -1;
            }
        },
        stop: function () {
            if (this.timeout !== null) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
        },
        step: function (i) {
            var t = 10;
            this.notitfy(this.mcodecharAt(i));
            // TODO calculate timeout (t value), get from morseblinker.
            this.timeout = setTimeout(function () {morsePlayer.step(i + 1); }, t);
        }
    };

    morseBlinker = {
        lapsus: 250,
        timeout: null,
        ctx: null,
        canvas: null,
        txt: null,
        init: function (canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (this.canvas.getContext) {
                this.ctx = this.canvas.getContext("2d");
            }
            this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        },
        on: function () {
            if (this.timeout !== null) { // is running?
                return; // yes
            }
            if (this.txt === null) { // string not empty
                return;
            }
            this.blink(0);
        },
        start: function (txt) {
            if (txt !== '') {
                this.txt = txt;
                this.blink(0);
            }
        },
        blink: function (i) {
            var t = 1, txt = this.txt;
            if (txt.charAt(i) === '-') {
                t = this.lapsus * 3;
            } else {
                t = this.lapsus;
            }
            if (txt.charAt(i) === ' ') {
                this.ctx.clearRect(1, 1, this.canvas.width - 2, this.canvas.height - 2);
            } else {
                this.ctx.beginPath();
                this.ctx.fillStyle = "#2779AA";
                this.ctx.arc(75, 75, 70, 0, Math.PI * 2, true); // Outer circle
                this.ctx.fill();
            }
            this.timeout = setTimeout(function () {morseBlinker.space(i); }, t);
        },
        space: function (i) {
            i += 1;
            this.ctx.clearRect(1, 1, this.canvas.width - 2, this.canvas.height - 2);
            //      this.ctx.strokeRect(0,0, this.canvas.width, this.canvas.height);
            if (i < this.txt.length) {
                this.timeout = setTimeout(function () { morseBlinker.blink(i); }, this.lapsus);
            }
        },
        off: function () {
            if (null !== this.timeout) {
                clearTimeout(this.timeout);
            }
            this.timeout = null;
            this.ctx.clearRect(1, 1, this.canvas.width - 2, this.canvas.height - 2);
        }
    };
    $.morseUI = {
        cpage: 'translator',
        init: function () {
            morse.init();
            morseHtmlImage.init('morse_image');
            morseBlinker.init('morse_blink');
        },
        toMorse: function (input) {
            var txt;
            input = document.getElementById(input).value;
            txt = morse.toMorse(input);
            document.getElementById("source").innerHTML = input;
            document.getElementById("morse").value = txt;
            /*if (chars < input.length) {
                //TODO notifiy invalid chars
                //  output.innerHTML += "Input contains "+(input.length - chars) +" invalid characters "
            }*/
            morseHtmlImage.toImage(txt);
            morseBlinker.start(txt);
        },
        toText: function (input, output) {
            var txt;
            input = document.getElementById(input).value;
            output = document.getElementById(output);
            txt = morse.toText(input);
            document.getElementById("text").value = txt;
        },
        clear: function () {
            document.getElementById('source').innerHTML = '?';
            document.getElementById('morse').value = '';
            morseHtmlImage.clear();
            morseBlinker.off();
        },
        page: function (id) {
            var p = document.getElementById(id);
            document.getElementById(this.cpage).style.display = "none";
            document.getElementById(id).style.display = "block";
            this.cpage = id;
        },
        on: function () {
            morseBlinker.on();
        },
        off: function () {
            morseBlinker.off();
        }
    };
}(window.jQuery));