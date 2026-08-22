// =========================================================
// LYD
// =========================================================

function playQuizSound(type) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!window.quizAudioCtx) {
        window.quizAudioCtx = new AudioCtx();
    }

    const ctx = window.quizAudioCtx;

    if (ctx.state === "suspended") {
        ctx.resume();
    }

    const now = ctx.currentTime;

    function tone(freq, start, duration, volume, wave = "sine") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = wave;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(
            volume,
            start + 0.015
        );
        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            start + duration
        );

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration + 0.03);
    }

    if (type === "correct") {
        tone(783.99, now + 0.18, 0.28, 0.09);
        tone(1046.50, now + 0.27, 0.32, 0.07);
    } else if (type === "wrong") {
        tone(220, now, 0.16, 0.055, "triangle");
        tone(185, now + 0.08, 0.22, 0.045, "triangle");
    }
}


// =========================================================
// Riktig
// =========================================================

function showPointPopup() {
    let popup = document.getElementById("pointPopup");

    if (!popup) {
        popup = document.createElement("div");
        popup.id = "pointPopup";
        popup.textContent = "Riktig!";

        const box = document.querySelector(".box");

        if (box) {
            box.appendChild(popup);
        } else {
            document.body.appendChild(popup);
        }
    }

    popup.classList.remove("show");
    void popup.offsetWidth;
    popup.classList.add("show");
}


// =========================================================
// QUIZ-LOGIKK
// =========================================================

// Finn oppgavenummer fra filnavnet.
// Eksempel: Oppgave17.html gir OPPGAVE_ID = 17.

const path = window.location.pathname;
const match = path.match(/Oppgave(\d+)\.html/i);
const OPPGAVE_ID = match ? parseInt(match[1], 10) : 1;


// Hvilket kapittel/emne brukeren arbeider med

const kategori =
    sessionStorage.getItem("valgtKategori") || "standard";

const STORAGE_KEY = `quizData_${kategori}`;


// Hent hele oppgavesettet som index.html har laget.
// Dette skal være:
// [1, 2, 3, 4, 5, ...]

let aktivtSett =
    JSON.parse(sessionStorage.getItem("aktivtOppgavesett"));


// Sikkerhet hvis siden åpnes direkte uten index.html

if (!Array.isArray(aktivtSett) || aktivtSett.length === 0) {
    aktivtSett = [OPPGAVE_ID];
}


// =========================================================
// NULLSTILL VED NY RUNDE
// =========================================================

if (
    OPPGAVE_ID === 1 &&
    !sessionStorage.getItem("harStartet")
) {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.setItem("harStartet", "true");
}


// =========================================================
// LAGRING
// =========================================================

function hentData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        riktige: [],
        feil: {}
    };
}


function lagreData(data) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


// =========================================================
// STATUS
// =========================================================

function initUI() {
    document.getElementById("riktig").textContent = 0;
    document.getElementById("feil").textContent = 0;
    document.getElementById("prosent").textContent = 0;
    document.getElementById("progress").style.width = "0%";
}


function oppdaterStatus() {
    const data = hentData();

    const antallRiktig = data.riktige.length;

    const antallFeil =
        Object.values(data.feil)
            .reduce((sum, v) => sum + v, 0);

    const besvart = antallRiktig + antallFeil;

    document.getElementById("riktig").textContent =
        antallRiktig;

    document.getElementById("feil").textContent =
        antallFeil;

    const prosent = besvart
        ? Math.round((antallRiktig / besvart) * 100)
        : 0;

    document.getElementById("prosent").textContent =
        prosent;

    const progress =
        Math.floor(
            (antallRiktig / aktivtSett.length) * 100
        );

    document.getElementById("progress").style.width =
        progress + "%";
}


// =========================================================
// FERDIG
// =========================================================

function visFerdig() {
    const boks = document.querySelector(".box");

    if (!boks) return;

    boks.innerHTML = `
        <h2>🎉 Ferdig!</h2>
        <p>Du har klart alle oppgavene.</p>
        <a href="../index.html">Tilbake til start</a>
    `;
}


// =========================================================
// SVAR
// =========================================================

document.querySelectorAll(".svar").forEach(label => {

    label.addEventListener("click", () => {

        const data = hentData();

        // Ikke svar på nytt hvis oppgaven allerede er riktig.
        if (data.riktige.includes(OPPGAVE_ID)) return;

        const input = label.querySelector("input");
        const verdi = input.value;

        label.classList.add(
            verdi === "riktig" ? "riktig" : "feil"
        );


        // Lås svaralternativene etter at eleven har svart.

        document.querySelectorAll(".svar").forEach(l => {
            l.querySelector("input").disabled = true;
            l.style.pointerEvents = "none";
        });


        if (verdi === "riktig") {

            data.riktige.push(OPPGAVE_ID);

            playQuizSound("correct");
            showPointPopup();

        } else {

            data.feil[OPPGAVE_ID] =
                (data.feil[OPPGAVE_ID] || 0) + 1;

            playQuizSound("wrong");
        }


        lagreData(data);
        oppdaterStatus();


        // Vis Neste spørsmål-knappen.
        document.getElementById("neste").style.display =
            "inline-block";
    });
});


// =========================================================
// NESTE SPØRSMÅL
// =========================================================

function nesteSporsmal() {

    const data = hentData();


    // Hvis svaret var feil:
    // vis samme oppgave igjen.

    if (!data.riktige.includes(OPPGAVE_ID)) {

        window.location.href =
            `Oppgave${OPPGAVE_ID}.html`;

        return;
    }


    // Finn hvor denne oppgaven ligger i settet.

    const posisjon =
        aktivtSett.indexOf(OPPGAVE_ID);


    // Hvis dette var siste oppgave:
    // vis ferdig-siden.

    if (
        posisjon === -1 ||
        posisjon === aktivtSett.length - 1
    ) {
        visFerdig();
        return;
    }


    // Gå til neste oppgave i kronologisk rekkefølge.

    const neste =
        aktivtSett[posisjon + 1];

    window.location.href =
        `Oppgave${neste}.html`;
}


// =========================================================
// START
// =========================================================

initUI();
oppdaterStatus();


// Hvis ferdig-siden lastes på nytt

const sluttData = hentData();

if (
    aktivtSett.length > 0 &&
    sluttData.riktige.length >= aktivtSett.length
) {
    visFerdig();
}