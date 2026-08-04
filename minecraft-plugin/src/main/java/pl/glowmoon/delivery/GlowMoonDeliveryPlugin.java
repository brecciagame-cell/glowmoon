package pl.glowmoon.delivery;

import org.bukkit.Bukkit;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * GlowMoonDelivery - dostawa produktow w trybie "pull".
 *
 * Hostingi Minecraft (np. gamehost.pl) czesto blokuja port RCON z internetu,
 * wiec nie da sie wyslac komendy z bramki platnosci bezposrednio przez RCON.
 * Ten plugin nie nasluchuje zadnego portu - sam co poll-interval-seconds
 * odpytuje backend (GET /api/delivery/poll), wykonuje komendy przez konsole
 * serwera (np. `case give <nick> <klucz> <ilosc>`) i potwierdza wykonanie
 * (POST /api/delivery/ack). Polaczenia wychodzace dzialaja zawsze.
 *
 * Ochrona przed podwojna dostawa: zapamietujemy id juz wykonanych komend
 * (w pliku executed.txt). Jesli ack zginie w sieci i backend wznowi komende
 * po 3 minutach, plugin ja rozpozna, NIE wykona drugi raz i po prostu
 * potwierdzi (ack ok) - gracz nie dostanie podwojnego klucza.
 */
public final class GlowMoonDeliveryPlugin extends JavaPlugin {

  private static final int MAX_EXECUTED = 5000; // ile id komend pamietamy (FIFO)

  private String apiUrl;
  private String token;
  private int pollIntervalSec;
  private int timeoutMs;
  private boolean logSuccesses;
  private boolean debug;
  private long lastPollWarn;

  // id komend juz wykonanych (LinkedHashSet = kolejnosc wstawiania, do FIFO)
  private final Set<String> executedIds = new LinkedHashSet<>();

  @Override
  public void onEnable() {
    saveDefaultConfig();
    reloadConfig();

    apiUrl = trim(getConfig().getString("api-url"));
    token = trim(getConfig().getString("token"));
    pollIntervalSec = Math.max(2, getConfig().getInt("poll-interval-seconds", 5));
    timeoutMs = Math.max(1000, getConfig().getInt("timeout-ms", 8000));
    logSuccesses = getConfig().getBoolean("log-successes", true);
    debug = getConfig().getBoolean("debug", false);

    if (apiUrl.isEmpty() || token.isEmpty()) {
      getLogger().severe("Brak api-url lub token w config.yml! Uzupelnij plik i przeladuj serwer.");
      Bukkit.getPluginManager().disablePlugin(this);
      return;
    }

    loadExecuted();
    getLogger().info("Aktywny - poll: " + apiUrl + "/api/delivery/poll co " + pollIntervalSec + " s"
        + " (zapamietane wykonane komendy: " + executedIds.size() + ")");
    Bukkit.getScheduler().runTaskTimerAsynchronously(this, this::pollOnce, 20L, pollIntervalSec * 20L);
  }

  @Override
  public void onDisable() {
    saveExecuted();
    getLogger().info("Wylaczony");
  }

  /** Jedna runda poll -> wykonanie komend -> ack. */
  private void pollOnce() {
    final List<Command> commands;
    try {
      commands = DeliveryClient.poll(apiUrl, token, timeoutMs);
    } catch (Exception e) {
      getLogger().warning("Blad poll (" + e.getMessage() + ") - sprobuje za " + pollIntervalSec + " s");
      return;
    }
    if (commands == null) {
      // poll zwrocil nie-200 (np. 401 - zly token). Logujemy maks. raz na minute, zeby nie zalac logu.
      long now = System.currentTimeMillis();
      if (now - lastPollWarn > 60_000) {
        lastPollWarn = now;
        getLogger().warning("Poll zwrocil blad (prawdopodobnie 401) - sprawdz czy token w config.yml = DELIVERY_TOKEN w Vercel");
      }
      return;
    }
    if (commands.isEmpty()) {
      if (debug) {
        getLogger().info("Poll OK - brak komend do wykonania");
      }
      return;
    }

    // Komendy wykonujemy na glownym watku (wymagane przez Bukkit), potem ack async
    Bukkit.getScheduler().runTask(this, () -> {
      final List<Result> results = new ArrayList<>();
      final List<String> newlyExecuted = new ArrayList<>();

      for (Command c : commands) {
        boolean already;
        synchronized (executedIds) {
          already = executedIds.contains(c.id);
        }
        if (already) {
          // juz wykonano (ack sie zgubil) - nie nadajemy drugi raz, tylko potwierdzamy
          results.add(new Result(c.id, true, null));
          continue;
        }

        boolean ok;
        String error = null;
        try {
          ok = Bukkit.dispatchCommand(Bukkit.getConsoleSender(), c.command);
          if (!ok) {
            error = "komenda zwrocila false (brak uprawnien?)";
          }
        } catch (Exception e) {
          ok = false;
          error = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
        }

        if (ok) {
          if (logSuccesses) {
            getLogger().info("OK  " + c.command);
          }
          newlyExecuted.add(c.id);
        } else {
          getLogger().warning("BLAD " + c.command + (error != null ? ": " + error : ""));
        }
        results.add(new Result(c.id, ok, error));
      }

      final List<Result> toAck = results;
      Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
        for (String id : newlyExecuted) {
          rememberExecuted(id);
        }
        try {
          DeliveryClient.ack(apiUrl, token, toAck, timeoutMs);
        } catch (Exception e) {
          // ack nie przeszedl -> backend wznowi komende po 3 min, ale lista executed
          // ja rozpozna i nie nada drugi raz
          getLogger().warning("Blad ack (" + e.getMessage() + ") - ponowne nadanie zablokowane lista wykonanych");
        }
      });
    });
  }

  private void rememberExecuted(String id) {
    synchronized (executedIds) {
      executedIds.add(id);
      while (executedIds.size() > MAX_EXECUTED) {
        Iterator<String> it = executedIds.iterator();
        if (it.hasNext()) {
          it.next();
          it.remove();
        }
      }
      saveExecuted();
    }
  }

  private void loadExecuted() {
    File f = new File(getDataFolder(), "executed.txt");
    if (!f.exists()) {
      return;
    }
    try (BufferedReader r = new BufferedReader(new InputStreamReader(new FileInputStream(f), StandardCharsets.UTF_8))) {
      String line;
      while ((line = r.readLine()) != null) {
        if (!line.trim().isEmpty()) {
          executedIds.add(line.trim());
        }
      }
    } catch (IOException e) {
      getLogger().warning("Nie udalo sie wczytac executed.txt: " + e.getMessage());
    }
  }

  private void saveExecuted() {
    try {
      if (!getDataFolder().exists()) {
        getDataFolder().mkdirs();
      }
      File f = new File(getDataFolder(), "executed.txt");
      try (BufferedWriter w = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(f), StandardCharsets.UTF_8))) {
        for (String id : executedIds) {
          w.write(id);
          w.newLine();
        }
      }
    } catch (IOException e) {
      getLogger().warning("Nie udalo sie zapisac executed.txt: " + e.getMessage());
    }
  }

  private static String trim(String v) {
    return v == null ? "" : v.trim();
  }
}
