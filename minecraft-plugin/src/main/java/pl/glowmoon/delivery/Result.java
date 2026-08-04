package pl.glowmoon.delivery;

/** Wynik wykonania komendy - wysylany do backendu jako potwierdzenie (ack). */
final class Result {
  final String id;
  final boolean ok;
  final String error;

  Result(String id, boolean ok, String error) {
    this.id = id;
    this.ok = ok;
    this.error = error;
  }
}
