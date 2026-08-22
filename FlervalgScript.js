/* =========================================================
   ANTALL OPPGAVER‑VELGER (kun på index.html)
   Injiseres automatisk hvis .app-link-list finnes
   ========================================================= */
// Korte lydeffekter uten eksterne lydfiler.
// Web Audio starter først etter brukerinteraksjon, som passer fint for quiz-knappene.
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

        // Lys, positiv "pling-plong-ding"
        tone(783.99, now + 0.18, 0.28, 0.09); // G5
        tone(1046.50, now + 0.27, 0.32, 0.07); // C6

    } else if (type === "wrong") {

        // Kort og myk feil-lyd
        tone(220, now,        0.16, 0.055, "triangle");
        tone(185, now + 0.08, 0.22, 0.045, "triangle");
    }
}

function showPointPopup() {
    let popup = document.getElementById("pointPopup");

    // Opprett popup automatisk hvis den ikke finnes i HTML-en
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

    // Start animasjonen på nytt
    popup.classList.remove("show");
    void popup.offsetWidth;
    popup.classList.add("show");
}


document.addEventListener("DOMContentLoaded", () => {

    // Sett default én gang
    if (!sessionStorage.getItem("antallOppgaver")) {
        sessionStorage.setItem("antallOppgaver", "10");
    }

    const liste = document.querySelector(".app-link-list");
    if (!liste) return; // Ikke på index.html

    // Unngå duplikater ved reload/navigasjon
    if (document.querySelector(".antall-velger")) return;

    const velger = document.createElement("div");
    velger.className = "antall-velger";
    velger.innerHTML = `
        <button data-n="10">10 oppgaver</button>
        <button data-n="20">20 oppgaver</button>
        <button data-n="30">30 oppgaver</button>
    `;

    liste.parentElement.insertBefore(velger, liste);

    const aktivtAntall = sessionStorage.getItem("antallOppgaver");

    velger.querySelectorAll("button").forEach(btn => {

        if (btn.dataset.n === aktivtAntall) {
            btn.classList.add("aktiv");
        }

        btn.addEventListener("click", () => {
            velger.querySelectorAll("button")
                .forEach(b => b.classList.remove("aktiv"));

            btn.classList.add("aktiv");
            sessionStorage.setItem("antallOppgaver", btn.dataset.n);
        });
    });
});


/* =========================================================
   QUIZ‑LOGIKK
   ========================================================= */

// Finn oppgave‑ID fra filnavn
const path = window.location.pathname;
const match = path.match(/Oppgave(\d+)\.html/i);
const OPPGAVE_ID = match ? parseInt(match[1], 10) : 1;

const kategori = sessionStorage.getItem("valgtKategori") || "standard";
const STORAGE_KEY = `quizData_${kategori}`;

// Aktivt oppgavesett
let aktivtSett = JSON.parse(sessionStorage.getItem("aktivtOppgavesett"));
if (!Array.isArray(aktivtSett) || aktivtSett.length === 0) {
    aktivtSett = [OPPGAVE_ID];
}

// ✅ Hvis vi starter på Oppgave1, hopp videre til en tilfeldig første oppgave
if (
    OPPGAVE_ID === 1 &&
    !sessionStorage.getItem("harStartet") &&
    Array.isArray(aktivtSett) &&
    aktivtSett.length > 0
) {
    const tilfeldigStart =
        aktivtSett[Math.floor(Math.random() * aktivtSett.length)];

    sessionStorage.setItem("harStartet", "true");

    if (tilfeldigStart !== 1) {
        window.location.replace(`Oppgave${tilfeldigStart}.html`);
    }
}


// Reset lagret data ved nytt sett
if (OPPGAVE_ID === 1 && !sessionStorage.getItem("harStartet")) {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.setItem("harStartet", "true");
}

// Hent / lagre data
function hentData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        riktige: [],
        feil: {}
    };
}

function lagreData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Init statusfelt
function initUI() {
    document.getElementById("riktig").textContent = 0;
    document.getElementById("feil").textContent = 0;
    document.getElementById("prosent").textContent = 0;
    document.getElementById("progress").style.width = "0%";
}

// Oppdater status
function oppdaterStatus() {
    const data = hentData();

    const antallRiktig = data.riktige.length;
    const antallFeil = Object.values(data.feil)
        .reduce((sum, v) => sum + v, 0);

    const besvart = antallRiktig + antallFeil;

    document.getElementById("riktig").textContent = antallRiktig;
    document.getElementById("feil").textContent = antallFeil;

    const prosent = besvart
        ? Math.round((antallRiktig / besvart) * 100)
        : 0;

    document.getElementById("prosent").textContent = prosent;

    const progress = Math.floor(
        (antallRiktig / aktivtSett.length) * 100
    );

    document.getElementById("progress").style.width = progress + "%";
}

// Ferdig‑visning
function visFerdig() {
    const boks = document.querySelector(".box");
    if (!boks) return;

    boks.innerHTML = `
        <h2>🎉 Ferdig!</h2>
        <p>Du har klart alle oppgavene.</p>
        <a href="../index.html">Tilbake til start</a>
    `;
}


/* =========================================================
   SVARHÅNDTERING
   ========================================================= */

// Stokk svarrekkefølge
function stokkeSvar() {
    const quiz = document.getElementById("quiz");
    if (!quiz) return;

    const svar = Array.from(quiz.children);
    for (let i = svar.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [svar[i], svar[j]] = [svar[j], svar[i]];
    }

    svar.forEach(el => quiz.appendChild(el));
}

// Kjør før event listeners
stokkeSvar();

document.querySelectorAll(".svar").forEach(label => {
    label.addEventListener("click", () => {
        const data = hentData();

        // Blokker hvis allerede riktig
        if (data.riktige.includes(OPPGAVE_ID)) return;

        const input = label.querySelector("input");
        const verdi = input.value;

        label.classList.add(verdi === "riktig" ? "riktig" : "feil");

        document.querySelectorAll(".svar").forEach(l => {
            l.querySelector("input").disabled = true;
            l.style.pointerEvents = "none";
        });

        if (verdi === "riktig") {
            data.riktige.push(OPPGAVE_ID);
            playQuizSound("correct");
              // ✅ Vis tydelig +1 point
            showPointPopup();
        } else {
            data.feil[OPPGAVE_ID] = (data.feil[OPPGAVE_ID] || 0) + 1;
            playQuizSound("wrong");

        }

        lagreData(data);
        oppdaterStatus();

        if (data.riktige.length === aktivtSett.length) {
            visFerdig();
            return;
        }

        document.getElementById("neste").style.display = "inline-block";
    });
});

// Neste spørsmål
function nesteSporsmal() {
    const data = hentData();

    // Hvis denne oppgaven ikke er besvart riktig,
    // vis samme oppgave på nytt.
    if (!data.riktige.includes(OPPGAVE_ID)) {
        window.location.href = `Oppgave${OPPGAVE_ID}.html`;
        return;
    }

    // Finn oppgaver som ennå ikke er besvart riktig
    const gjenstaar = aktivtSett.filter( 
        id => !data.riktige.includes(id)
    );

    if (gjenstaar.length === 0) {
        visFerdig();
        return;
    }

    // Velg tilfeldig neste oppgave
    const neste =
        gjenstaar[Math.floor(Math.random() * gjenstaar.length)];

    window.location.href = `Oppgave${neste}.html`;
}


/* =========================================================
   INIT
   ========================================================= */

initUI();
oppdaterStatus();

// Edge‑case: reload etter ferdig
const sluttData = hentData();
if (sluttData.riktige.length === aktivtSett.length) {
    visFerdig();
}