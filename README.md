# Pablo's TAPAS Gastrobar - strona www

Nowoczesna, animowana strona restauracji Pablo's TAPAS Gastrobar (ul. Grzybowska 5A, Warszawa).

## Uruchomienie

To statyczna strona bez kroku budowania. Wystarczy dowolny serwer plików, np.:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Na produkcję można wrzucić całość na dowolny hosting (Netlify, Vercel, GitHub Pages, zwykły FTP).

## Struktura

- `index.html` - treść strony (sekcje: hero, historia, wnętrze, karta, klimat, opinie, Instagram, imprezy, kontakt)
- `assets/css/style.css` - wygląd i animacje CSS
- `assets/js/main.js` - interakcje: loader, płynny scroll, animacje GSAP/ScrollTrigger, poziomy spacer po wnętrzu, karta z kalkulatorem "Twój stół", status otwarte/zamknięte na żywo, formularz rezerwacji (mailto)
- `assets/img/` - zdjęcia wnętrza w WebP (wersje `-lg` 2000 px i `-sm` 1000 px)
- `assets/vendor/` - GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13 (lokalnie, bez CDN)

## Edycja treści

- **Karta i ceny** - tablica `MENU` w `assets/js/main.js` (`p: null` = "cena na miejscu").
- **Godziny otwarcia** - obiekt `HOURS` w `assets/js/main.js` oraz lista `.js-hours` i dane `ld+json` w `index.html`.
- **Opinie** - sekcja `#opinie` w `index.html`.

## Do weryfikacji przed publikacją

Dane zebrane z publicznych źródeł (Google, Tripadvisor, zjedz.my, Uber Eats, Facebook, Instagram, week.pl). Warto potwierdzić u właściciela:

- godziny otwarcia (pn-czw 12-22, pt-sob 12-23, nd 12-21:30),
- ceny w karcie (pochodzą z menu dostawowego),
- konto Instagram (`@pablo_tapas`) i liczbę obserwujących,
- rok "2014" w statystykach (start pierwszego lokalu przy Grzybowskiej 63).
