# Endrer alle store norske bokstaver til sma:
# Æ -> æ
# Ø -> ø
# Å -> å
#
# Behandler alle .html-filer i samme mappe som scriptet
# og alle undermapper.
# Lager IKKE backup.

function Replace-Utf8Bytes {
    param (
        [byte[]]$Bytes
    )

    $endret = $false

    for ($i = 0; $i -lt ($Bytes.Length - 1); $i++) {

        # Æ = C3 86  ->  æ = C3 A6
        if ($Bytes[$i] -eq 0xC3 -and $Bytes[$i + 1] -eq 0x86) {
            $Bytes[$i + 1] = 0xA6
            $endret = $true
            continue
        }

        # Ø = C3 98  ->  ø = C3 B8
        if ($Bytes[$i] -eq 0xC3 -and $Bytes[$i + 1] -eq 0x98) {
            $Bytes[$i + 1] = 0xB8
            $endret = $true
            continue
        }

        # Å = C3 85  ->  å = C3 A5
        if ($Bytes[$i] -eq 0xC3 -and $Bytes[$i + 1] -eq 0x85) {
            $Bytes[$i + 1] = 0xA5
            $endret = $true
            continue
        }
    }

    return @{
        Bytes   = $Bytes
        Endret  = $endret
    }
}


# Finn absolutt alle filer med .html-endelse
$htmlFiler = Get-ChildItem `
    -LiteralPath $PSScriptRoot `
    -Recurse `
    -File |
    Where-Object { $_.Extension -ieq ".html" }


Write-Host ""
Write-Host "Scriptmappe:" -ForegroundColor Cyan
Write-Host $PSScriptRoot

Write-Host ""
Write-Host "Fant $($htmlFiler.Count) HTML-filer." -ForegroundColor Cyan
Write-Host ""


$antallEndret = 0
$antallUendret = 0
$antallFeil = 0


foreach ($item in $htmlFiler) {

    $fil = $item.FullName

    try {

        # Les filen som RA bytes
        $bytes = [System.IO.File]::ReadAllBytes($fil)

        $resultat = Replace-Utf8Bytes -Bytes $bytes

        if ($resultat.Endret) {

            [System.IO.File]::WriteAllBytes(
                $fil,
                $resultat.Bytes
            )

            Write-Host "ENDRET: $fil" -ForegroundColor Green
            $antallEndret++
        }
        else {

            Write-Host "Ingen store AE/OE/AA: $fil" -ForegroundColor DarkGray
            $antallUendret++
        }

    }
    catch {

        Write-Host "FEIL: $fil" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        $antallFeil++
    }
}


Write-Host ""
Write-Host "----------------------------------------"
Write-Host "Ferdig!" -ForegroundColor Cyan
Write-Host "Endret:        $antallEndret" -ForegroundColor Green
Write-Host "Uendret:       $antallUendret"
Write-Host "Feil:          $antallFeil" -ForegroundColor Red
Write-Host "Totalt funnet: $($htmlFiler.Count)"
Write-Host "----------------------------------------"
Write-Host ""

Read-Host "Trykk Enter for aa lukke"