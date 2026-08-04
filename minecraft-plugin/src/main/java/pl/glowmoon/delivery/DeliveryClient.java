package pl.glowmoon.delivery;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/** Komunikacja HTTP z backendem (poll + ack). Uzywa tylko JDK - zero zewnetrznych bibliotek. */
final class DeliveryClient {

  private DeliveryClient() {}

  /**
   * Pobiera komendy oczekujace w kolejce.
   * @return lista komend, lub null gdy backend niedostepny / blad / 401
   */
  static List<Command> poll(String apiUrl, String token, int timeoutMs) throws Exception {
    String url = apiUrl + "/api/delivery/poll?token=" + URLEncoder.encode(token, "UTF-8");
    HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
    c.setConnectTimeout(timeoutMs);
    c.setReadTimeout(timeoutMs);
    c.setRequestMethod("GET");
    c.setRequestProperty("Accept", "application/json");
    int code = c.getResponseCode();
    if (code != 200) {
      c.disconnect();
      return null;
    }
    String body = readAll(c.getInputStream());
    c.disconnect();
    return MiniJson.parseCommands(body);
  }

  /** Wysyla potwierdzenie wykonania komend (ack). */
  static void ack(String apiUrl, String token, List<Result> results, int timeoutMs) throws Exception {
    String url = apiUrl + "/api/delivery/ack";
    HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
    c.setConnectTimeout(timeoutMs);
    c.setReadTimeout(timeoutMs);
    c.setRequestMethod("POST");
    c.setRequestProperty("Content-Type", "application/json");
    c.setDoOutput(true);
    byte[] body = MiniJson.buildAck(token, results).getBytes(StandardCharsets.UTF_8);
    c.setFixedLengthStreamingMode(body.length);
    try (OutputStream os = c.getOutputStream()) {
      os.write(body);
    }
    int code = c.getResponseCode();
    c.disconnect();
    if (code >= 300) {
      throw new IllegalStateException("ack HTTP " + code);
    }
  }

  private static String readAll(InputStream in) throws Exception {
    try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      byte[] buf = new byte[4096];
      int n;
      while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
      return new String(out.toByteArray(), StandardCharsets.UTF_8);
    }
  }
}
