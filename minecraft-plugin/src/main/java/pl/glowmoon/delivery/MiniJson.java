package pl.glowmoon.delivery;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Minimalny parser JSON bez zewnetrznych bibliotek (zero zaleznosci).
 * Wystarczajacy dla formatu odpowiedzi poll i zadan ack.
 */
final class MiniJson {

  private MiniJson() {}

  /** Parsuje odpowiedz poll: {"commands":[{"id":"...","command":"..."}]} */
  static List<Command> parseCommands(String json) {
    List<Command> out = new ArrayList<>();
    Object root = parse(json);
    if (!(root instanceof Map)) return out;
    Object arr = ((Map<?, ?>) root).get("commands");
    if (!(arr instanceof List)) return out;
    for (Object o : (List<?>) arr) {
      if (!(o instanceof Map)) continue;
      Map<?, ?> m = (Map<?, ?>) o;
      Object id = m.get("id");
      Object cmd = m.get("command");
      if (id != null && cmd != null) {
        out.add(new Command(String.valueOf(id), String.valueOf(cmd)));
      }
    }
    return out;
  }

  /** Buduje cialo ack: {"token":"...","results":[{"id":"...","ok":true,"error":"..."}]} */
  static String buildAck(String token, List<Result> results) {
    StringBuilder sb = new StringBuilder();
    sb.append("{\"token\":\"").append(escape(token)).append("\",\"results\":[");
    for (int i = 0; i < results.size(); i++) {
      if (i > 0) sb.append(',');
      Result r = results.get(i);
      sb.append("{\"id\":\"").append(escape(r.id)).append("\",\"ok\":").append(r.ok);
      if (r.error != null && !r.error.isEmpty()) {
        sb.append(",\"error\":\"").append(escape(r.error)).append('"');
      }
      sb.append('}');
    }
    sb.append("]}");
    return sb.toString();
  }

  private static String escape(String s) {
    if (s == null) return "";
    return s.replace("\\", "\\\\").replace("\"", "\\\"");
  }

  // ---------- parser ----------

  static Object parse(String json) {
    Parser p = new Parser(json);
    Object v = p.value();
    p.skipWs();
    return v;
  }

  private static final class Parser {
    private final String s;
    private int i;

    Parser(String s) {
      this.s = s;
    }

    Object value() {
      skipWs();
      if (i >= s.length()) return null;
      char c = s.charAt(i);
      if (c == '{') return object();
      if (c == '[') return array();
      if (c == '"') return string();
      if (s.startsWith("true", i)) { i += 4; return Boolean.TRUE; }
      if (s.startsWith("false", i)) { i += 5; return Boolean.FALSE; }
      if (s.startsWith("null", i)) { i += 4; return null; }
      return number();
    }

    private Map<String, Object> object() {
      Map<String, Object> map = new LinkedHashMap<>();
      i++; // '{'
      skipWs();
      if (i < s.length() && s.charAt(i) == '}') { i++; return map; }
      while (i < s.length()) {
        skipWs();
        String key = string();
        skipWs();
        if (i < s.length() && s.charAt(i) == ':') i++;
        map.put(key, value());
        skipWs();
        if (i < s.length() && s.charAt(i) == ',') { i++; continue; }
        if (i < s.length() && s.charAt(i) == '}') { i++; break; }
        break;
      }
      return map;
    }

    private List<Object> array() {
      List<Object> list = new ArrayList<>();
      i++; // '['
      skipWs();
      if (i < s.length() && s.charAt(i) == ']') { i++; return list; }
      while (i < s.length()) {
        list.add(value());
        skipWs();
        if (i < s.length() && s.charAt(i) == ',') { i++; continue; }
        if (i < s.length() && s.charAt(i) == ']') { i++; break; }
        break;
      }
      return list;
    }

    private String string() {
      i++; // '"'
      StringBuilder sb = new StringBuilder();
      while (i < s.length()) {
        char c = s.charAt(i);
        if (c == '\\') {
          i++;
          if (i < s.length()) {
            char e = s.charAt(i);
            switch (e) {
              case 'n': sb.append('\n'); break;
              case 't': sb.append('\t'); break;
              case 'r': sb.append('\r'); break;
              case 'b': sb.append('\b'); break;
              case 'f': sb.append('\f'); break;
              case 'u':
                if (i + 4 < s.length()) {
                  sb.append((char) Integer.parseInt(s.substring(i + 1, i + 5), 16));
                  i += 4;
                }
                break;
              default: sb.append(e);
            }
          }
          i++;
          continue;
        }
        if (c == '"') { i++; break; }
        sb.append(c);
        i++;
      }
      return sb.toString();
    }

    private Number number() {
      int start = i;
      while (i < s.length()) {
        char c = s.charAt(i);
        if ((c >= '0' && c <= '9') || c == '-' || c == '+' || c == '.' || c == 'e' || c == 'E') i++;
        else break;
      }
      String num = s.substring(start, i);
      try {
        if (num.contains(".") || num.contains("e") || num.contains("E")) {
          return Double.parseDouble(num);
        }
        return Long.parseLong(num);
      } catch (NumberFormatException ex) {
        return null;
      }
    }

    private void skipWs() {
      while (i < s.length()) {
        char c = s.charAt(i);
        if (c == ' ' || c == '\t' || c == '\n' || c == '\r') i++;
        else break;
      }
    }
  }
}
