# 186: Ask Pi to Retry… for a request that genuinely stopped

Kind: code

Plan 184 part 3: "I want to have a button in the web ui when the model genuinely stopped, like crashed or something."
Built from the designer's A_Retry board and its IMPLEMENTATION.md spec.

- [x] Red (python): `WorkQueue.retry` queues a failed, stopped or interrupted request again, with "Note from the person:
  …" when a note is given and `retry_of`; the stopped run keeps its record; anything else is refused. The "Harness
  settled" signal is not shown as a phase.
- [x] Red (browser, chat.cjs): a stopped request in Activity offers **Ask Pi to Retry…**; the dialog quotes the request,
  takes an optional note, says "Queues the request again in <project>. The failed run stays in its record."; Queue
  Again queues it (toast "Queued again in <project>."), the stopped run stays.
- [x] `#retry-dialog`, `askRetry`, the button in the Activity detail, `POST /api/jobs/<id>/retry {note}`.
