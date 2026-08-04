package pl.glowmoon.delivery;

/** Pojedyncza komenda pobrana z backendu do wykonania na serwerze. */
final class Command {
  final String id;
  final String command;

  Command(String id, String command) {
    this.id = id;
    this.command = command;
  }
}
