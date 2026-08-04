# GlowMoonDelivery — plugin dostawy produktów (tryb "pull")

Ten plugin dostarcza produkty ze sklepu na serwer Minecraft **bez RCON**.
Działa nawet wtedy, gdy hosting (np. gamehost.pl) **blokuje port RCON z internetu**.

## Jak to działa

1. Po opłaceniu zamówienia backend (Vercel) odkłada komendy do kolejki
   (tabela `delivery_queue` w Supabase), np. `case give <nick> <klucz> <ilość>`.
2. Plugin **co 5 sekund odpytuje** `GET https://<adres>/api/delivery/poll?token=...`.
3. Jeśli są komendy — wykonuje je z **konsoli serwera** (`case give ...`).
4. Potwierdza wykonanie przez `POST /api/delivery/ack` → strona sukcesu
   pokazuje „Przedmioty zostały dostarczone”.

Wszystkie połączenia są **wychodzące** (plugin → Vercel), więc hosting nie może ich zablokować.

## Instalacja (jeśli masz gotowy `.jar`)

1. Skopiuj `GlowMoonDelivery.jar` do folderu `plugins/` na serwerze
   (panel gamehost.pl → Pliki → `plugins`).
2. Zrestartuj serwer (lub `reload`).
3. Wejdź do `plugins/GlowMoonDelivery/config.yml` i **sprawdź token**:
   - `token` musi być **identyczny** z `DELIVERY_TOKEN` ustawionym w Vercel.
   - `api-url` — adres backendu (domyślnie `https://glowmoon-kgj7.vercel.app`).
4. Po zmianie config.yml zrestartuj serwer ponownie.
5. W konsoli powinno być: `GlowMoonDelivery: Aktywny - poll: ... co 5 s`.

## Budowa własnego `.jar` (Maven)

Wymaga: Java 17+ i Maven.

```bash
cd minecraft-plugin
mvn clean package
# wynik: target/GlowMoonDelivery.jar
```

Alternatywnie (bez Mavena, sam `javac`):
```bash
javac --release 8 -cp paper-api.jar -d classes src/main/java/pl/glowmoon/delivery/*.java
cp -r src/main/resources/* classes/
jar cf GlowMoonDelivery.jar -C classes .
```

> **Uwaga:** `--release 8` kompiluje plugin tak, by dzialal na kazdym serwerze
> (Java 8+). Zbudowany w repo `GlowMoonDelivery.jar` juz tak jest skompilowany.

## Bezpieczeństwo

- **Zmień token** z domyślnego na własny (losowy) i ustaw ten sam w Vercel
  (Settings → Environment Variables → `DELIVERY_TOKEN`).
- Bez tokenu nikt nie może pobrać ani potwierdzić komend (endpoint zwraca 401).

## Rozwiązywanie problemów

- **„Blad poll" w konsoli serwera** — backend nie odpowiada: sprawdź `api-url`,
  czy Vercel ma `DELIVERY_TOKEN` (redeploy po zmianie env!).
- **„401"** — token w `config.yml` nie zgadza się z `DELIVERY_TOKEN` w Vercel.
- **Komenda nie wykonuje się** — sprawdź, czy plugin `/case` rozpoznaje nazwę
  klucza (wielkość liter!). Klucze w sklepie: `Rzadka`, `Epicka`, `Legendarna`, `Survival`.
