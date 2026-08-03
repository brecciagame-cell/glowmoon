# Panel Administratora - Konfiguracja Email

> **Zalecana metoda: EmailJS** — wysylka kodu 2FA prosto z przegladarki, bez backendu.
> Dziala na kazdym hostingu statycznym. Sekcje nizej dotycza opcjonalnego backendu `server.js`.

## Wysylka kodu przez EmailJS (zalecane, bez serwera)

1. Zaloż darmowe konto na https://www.emailjs.com (darmowy plan: 200 maili / miesiac, 2 szablony)
2. **Email Services** -> „Add New Service" -> wybierz Gmail i polacz konto
   (Gmail z wlaczona weryfikacja 2-etapowa: utworz „Haslo aplikacji" i uzyj go)
3. Skopiuj **Service ID** nowej uslugi
4. **Email Templates** -> „Create New Template":
   - Subject np.: `Kod weryfikacji - Panel Admina GlowMoon`
   - W tresci umiesc zmienna `{{code}}`
   - W polu „To Email" wpisz `{{to_email}}`
   - **Wazne: nie wlaczaj reCAPTCHA w szablonie** — w przeciwnym razie wysylka z przegladarki bedzie odrzucana bledem 400
   - Zapisz i skopiuj **Template ID**
5. **Account** -> zapisz **Public Key**
6. Utworz w projekcie plik `.env` (lokalnie) oraz `.env.production` (przed buildem na hosting):

```
VITE_EMAILJS_SERVICE_ID=twoje_service_id
VITE_EMAILJS_TEMPLATE_ID=twoj_template_id
VITE_EMAILJS_PUBLIC_KEY=twoj_public_key
VITE_ADMIN_EMAIL=twoj@email.com  # adres odbiorcy kodu 2FA (opcjonalny)
```

7. `npm run build` i wgraj zawartosc `dist/` na hosting

> Bez skonfigurowanych kluczy panel dziala w trybie DEV — kod 2FA pokaze sie od razu w oknie alertu.

## Opcjonalnie: backend server.js (Express + SMTP/Mailjet)

Ponizej stare instrukcje dla backendu `server.js`. Nie sa wymagane, gdy uzywasz EmailJS.

## Wymagania

1. Skonfiguruj zmienne środowiskowe w pliku `.env`
2. Uruchom serwer backendu
3. Zaloguj się do panelu

## Konfiguracja Gmail (najprostsza)

1. Wejdź w ustawienia Google → Bezpieczeństwo → Weryfikacja dwuetapowa
2. Włącz 2FA
3. Wygeneruj "Hasło do aplikacji" (App Password)
4. Użyj tego hasła w `.env`

Plik `.env`:

```
ADMIN\_EMAIL=twoj.gmail@gmail.com
ADMIN\_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Hasło aplikacji, nie zwykłe hasło!
```

## Uruchomienie

W terminalu 1 (backend):

```bash
npm run server
```

W terminalu 2 (frontend):

```bash
npm run dev
```

## Logowanie

1. Wejdź na `http://localhost:5174/admin`
2. Wpisz: **admin / admin123**
3. Kliknij "Zaloguj"
4. Kod 2FA wyśle się na email administratora
5. Wpisz kod z emaila
6. Gotowe!

## Testowanie bez emaila

Jeśli nie masz skonfigurowanego SMTP, kod będzie widoczny w:

* Konsoli przeglądarki (F12 → Console)
* Albo w terminalu serwera

## Inni providerzy SMTP

### Outlook/Hotmail:

```
SMTP\_HOST=smtp.office365.com
SMTP\_PORT=587
SMTP\_USER=admin@example.com
SMTP\_PASS=haslo
```

### Własny serwer:

```
SMTP\_HOST=smtp.twojadomena.pl
SMTP\_PORT=587
SMTP\_USER=admin@twojadomena.pl
SMTP\_PASS=haslo
```

## Bezpieczeństwo

* Blokada po 3 nieudanych próbach (5 minut)
* Kod 2FA ważny tylko podczas sesji
* Hasła nigdy nie są wyświetlane w konsoli

