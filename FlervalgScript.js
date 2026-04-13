// =======================
// IDENTIFIKASJON
// =======================
const path = window.location.pathname;
const match = path.match(/Oppgave(\d+)\.html/i);
const OPPGAVE_ID = match ? parseInt(match[1], 10) : 1;

const kategori = sessionStorage.getItem("valgtKategori") || "standard";
const STORAGE_KEY = `quizData_${kategori}`;

// tilfeldig sett (10 oppgaver)
let aktivtSett = JSON.parse(sessionStorage.getItem("aktivtOppgavesett")) || [];

// =======================
// START / RESET
// =======================
if (OPPGAVE_ID === 1 && !sessionStorage.getItem("harStartet")) {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.setItem("harStartet", "true");
}

// =======================
// DATA
// =======================
function hentData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { 
        riktige: [], 
        feil: {}
    };
}

function lagreData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// =======================
// UI
// =======================
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

    const prosent = besvart ? Math.round((antallRiktig / besvart) * 100) : 0;
    document.getElementById("prosent").textContent = prosent;

    const progress = Math.round((antallRiktig / aktivtSett.length) * 100);
    document.getElementById("progress").style.width = progress + "%";
}

// =======================
// SVARLOGIKK
// =======================
document.querySelectorAll('.svar').forEach(label => {
    label.addEventListener('click', () => {

        if (label.classList.contains('riktig') || label.classList.contains('feil')) return;

        const input = label.querySelector('input');
        const verdi = input.value;

        label.classList.add(verdi === "riktig" ? "riktig" : "feil");

        document.querySelectorAll('.svar').forEach(l => {
            l.querySelector('input').disabled = true;
            l.style.pointerEvents = 'none';
        });

        const data = hentData();

        if (verdi === "riktig") {
            if (!data.riktige.includes(OPPGAVE_ID)) {
                data.riktige.push(OPPGAVE_ID);
            }
        } else {
            data.feil[OPPGAVE_ID] = (data.feil[OPPGAVE_ID] || 0) + 1;
        }

        lagreData(data);
        oppdaterStatus();
        document.getElementById("neste").style.display = "inline-block";
    });
});

// =======================
// NESTE SPØRSMÅL
// =======================
function nesteSporsmal() {
    const data = hentData();

    const gjenstaar = aktivtSett.filter(id => !data.riktige.includes(id));

    if (gjenstaar.length === 0) {
        alert("Hipp hurra! Du har løst alle oppgavene 🤓");
        return;
    }

    const neste = gjenstaar[Math.floor(Math.random() * gjenstaar.length)];
    window.location.href = `Oppgave${neste}.html`;
}

// =======================
// INIT
// =======================
initUI();
oppdaterStatus();