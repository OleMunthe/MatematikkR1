# Reparerer norske bokstaver og piler i alle HTML-filer
# i samme mappe som scriptet og alle undermapper.
# Lager IKKE backup.
# Kan kjoeres flere ganger.

$utf8 = New-Object System.Text.UTF8Encoding($false)

# Korrekte sma bokstaver
$smallAE = [char]0x00E6
$smallOE = [char]0x00F8
$smallAA = [char]0x00E5

# Korrekte store bokstaver
$capitalAE = [char]0x00C6
$capitalOE = [char]0x00D8
$capitalAA = [char]0x00C5

# Feilaktige sekvenser for sma bokstaver
$badSmallAE = ([char]0x00C3).ToString() + [char]0x00A6
$badSmallOE = ([char]0x00C3).ToString() + [char]0x00B8
$badSmallAA = ([char]0x00C3).ToString() + [char]0x00A5

# Feilaktige sekvenser for store bokstaver
$badCapitalAE = ([char]0x00C3).ToString() + [char]0x0086
$badCapitalOE = ([char]0x00C3).ToString() + [char]0x0098
$badCapitalAA = ([char]0x00C3).ToString() + [char]0x0085

# Feilaktig venstrepil
$badLeftArrow =
    ([char]0x00E2).ToString() +
    [char]0x2020 +
    [char]0x0090

$leftArrow = [char]0x2190


# Finn alle HTML-filer i denne mappen og alle undermapper
$htmlFiler = Get-ChildItem `
    -Path $PSScriptRoot `
    -Filter "*.html" `
    -Recurse `
    -File

Write-Host ""
Write-Host "Fant $($htmlFiler.Count) HTML-filer." -ForegroundColor Cyan
Write-Host ""

foreach ($item in $htmlFiler) {

    $fil = $item.FullName

    try {

        $tekst = [System.IO.File]::ReadAllText(
            $fil,
            [System.Text.Encoding]::UTF8
        )

        $original = $tekst

        # Reparer sma norske bokstaver
        $tekst = $tekst.Replace($badSmallAE, $smallAE)
        $tekst = $tekst.Replace($badSmallOE, $smallOE)
        $tekst = $tekst.Replace($badSmallAA, $smallAA)

        # Reparer store norske bokstaver
        $tekst = $tekst.Replace($badCapitalAE, $capitalAE)
        $tekst = $tekst.Replace($badCapitalOE, $capitalOE)
        $tekst = $tekst.Replace($badCapitalAA, $capitalAA)

        # Reparer venstrepil
        $tekst = $tekst.Replace($badLeftArrow, $leftArrow)

        if ($tekst -ne $original) {

            [System.IO.File]::WriteAllText(
                $fil,
                $tekst,
                $utf8
            )

            Write-Host "Reparert: $fil" -ForegroundColor Green
        }
        else {
            Write-Host "Ingen feil funnet: $fil" -ForegroundColor DarkGray
        }
    }
    catch {

        Write-Host "FEIL: $fil" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Ferdig!" -ForegroundColor Cyan
Read-Host "Trykk Enter for aa lukke"