const path = window.location.pathname;
const match = path.match(/Oppgave(\d+)\.html/i);
const OPPGAVE_ID = match ? parseInt(match[1], 10) : 1;

const kategori = sessionStorage.getItem("valgtKategori") || "standard";
const STORAGE_KEY = `quizData_${kategori}`;

let aktivtSett = JSON.parse(sessionStorage.getItem("aktivtOppgavesett"));
if (!Array.isArray(aktivtSett) || aktivtSett.length === 0) {
    aktivtSett = [OPPGAVE_ID];
}

// Reset ved start
if (OPPGAVE_ID === 1 && !sessionStorage.getItem("harStartet")) {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.setItem("harStartet", "true");
}

function hentData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        riktige: [],
        feil: {}
    };
}

function lagreData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function initUI() {
    document.getElementById("riktig").textContent = 0;
    document.getElementById("feil").textContent = 0;
    document.getElementById("prosent").textContent = 0;
    document.getElementById("progress").style.width = "0%";
}

function oppdaterStatus() {
    const data = hentData();

    const antallRiktig = data.riktige.length;
    const antallFeil = Object.values(data.feil).reduce((s, v) => s + v, 0);
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

function visFerdig() {
    document.querySelector(".box").innerHTML = `
        <h2>🎉 Ferdig!</h2>
        <p>Du har klart alle oppgavene!</p>
        <a href="../index.html">Tilbake til start</a>
    `;
}

/* ✅ NY: stokker svar i tilfeldig rekkefølge */
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

/* ✅ KALL FØR EVENT LISTENERS */
stokkeSvar();

document.querySelectorAll(".svar").forEach(label => {
    label.addEventListener("click", () => {
        const data = hentData();

        // ✅ Kun blokker hvis allerede riktig
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
        } else {
            data.feil[OPPGAVE_ID] =
                (data.feil[OPPGAVE_ID] || 0) + 1;
        }

        lagreData(data);
        oppdaterStatus();

        // ✅ FULLFØR UMIDDELBART
        if (data.riktige.length === aktivtSett.length) {
            visFerdig();
            return;
        }

        document.getElementById("neste").style.display = "inline-block";
    });
});

function nesteSporsmal() {
    const data = hentData();

    const gjenstaar = aktivtSett.filter(
        id => !data.riktige.includes(id)
    );

    if (gjenstaar.length === 0) {
        visFerdig();
        return;
    }

    const neste =
        gjenstaar[Math.floor(Math.random() * gjenstaar.length)];
    window.location.href = `Oppgave${neste}.html`;
}

initUI();
oppdaterStatus();

// ✅ Fjern edge‑case: reload på ferdig quiz
const sluttData = hentData();
if (sluttData.riktige.length === aktivtSett.length) {
    visFerdig();
}