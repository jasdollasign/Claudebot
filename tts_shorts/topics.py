"""Topic queue — reads from a text file, pops the next unused topic."""

from pathlib import Path

_DEFAULT_FILE = Path(__file__).parent / "topics_queue.txt"
_DONE_FILE = Path(__file__).parent / "topics_done.txt"


def _read_lines(path: Path) -> list[str]:
    if not path.exists():
        return []
    return [
        line.strip()
        for line in path.read_text().splitlines()
        if line.strip() and not line.startswith("#")
    ]


def _write_lines(path: Path, lines: list[str]) -> None:
    path.write_text("\n".join(lines) + "\n" if lines else "")


def pop_next_topic(queue_file: str | None = None) -> str | None:
    """
    Return and remove the first topic from the queue file.

    Returns None if the queue is empty (caller should let AI pick a topic).
    """
    path = Path(queue_file) if queue_file else _DEFAULT_FILE
    topics = _read_lines(path)

    if not topics:
        return None

    topic = topics[0]
    _write_lines(path, topics[1:])

    # Archive to done file
    done = _read_lines(_DONE_FILE)
    _write_lines(_DONE_FILE, done + [topic])

    return topic


def queue_length(queue_file: str | None = None) -> int:
    path = Path(queue_file) if queue_file else _DEFAULT_FILE
    return len(_read_lines(path))


def add_topic(topic: str, queue_file: str | None = None) -> None:
    path = Path(queue_file) if queue_file else _DEFAULT_FILE
    topics = _read_lines(path)
    _write_lines(path, topics + [topic])
