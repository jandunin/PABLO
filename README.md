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
- `assets/js/menu-data.js` - **pełna karta z cenami** oraz oferta Happy Hours (łatwa edycja)
- `assets/js/main.js` - interakcje: animowana twarz Pabla (rysowanie w loaderze, oczy śledzące kursor, mruganie, reakcja na kliknięcie), : loader, płynny scroll, animacje GSAP/ScrollTrigger, poziomy spacer po wnętrzu, karta z kalkulatorem "Twój stół", status otwarte/zamknięte na żywo, formularz rezerwacji (mailto)
- `assets/img/` - zdjęcia wnętrza w WebP (wersje `-lg` 2000 px i `-sm` 1000 px)
- `assets/vendor/` - GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13 (lokalnie, bez CDN)

## Edycja treści

- **Karta i ceny** - `window.PABLO_MENU` w `assets/js/menu-data.js` (`p` cena, `p2` druga cena np. butelka, `{ h: "..." }` śródtytuł).
- **Happy Hours** - `window.PABLO_HAPPY` w tym samym pliku.
- **Logo** - twarz Pabla jest wektorem w `<template id="pablo-tpl">` w `index.html`; każdy element `<div class="pablo">` dostaje ją automatycznie. Ikony w `assets/icons/`.
- **Godziny otwarcia** - obiekt `HOURS` w `assets/js/main.js` oraz lista `.js-hours` i dane `ld+json` w `index.html`.
- **Opinie** - sekcja `#opinie` w `index.html`.

## Do weryfikacji przed publikacją

Dane zebrane z publicznych źródeł (Google, Tripadvisor, zjedz.my, Uber Eats, Facebook, Instagram, week.pl). Warto potwierdzić u właściciela:

- ceny w karcie przepisane z karty na tapasgastrobar.pl - warto potwierdzić, że są aktualne,
- rok "2014" w statystykach (start pierwszego lokalu przy Grzybowskiej 63).

Potwierdzone: godziny otwarcia oraz Instagram `@pablo_tapas`.
