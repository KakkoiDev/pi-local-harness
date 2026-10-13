# 50: Pin the model in one place

Request 2026-10-13: pin `gemma4:26b-mlx` as the project's model while other models are
not being tested, and make it clear how that works. The id was repeated in six source
files and `config.json` or `PI_WEB_MODEL` could replace it.

- [x] Red: `config.json` with another model must stop `plh`; web workers must ignore `PI_WEB_MODEL`/`PI_WEB_PROVIDER`.
- [x] Add `harness/model.json` and `harness/model.py`; read the pin in `plh.py`, `web_chat.py`, `provider.mjs`, `media.mjs`.
- [x] New `config.json` files no longer contain `model`; an equal legacy value is accepted.
- [x] Green: Python 68/68, Node 22/22; README and operations guide explain the pin.

`harness/install.py` keeps its literal `gemma4:26b-mlx` values: they recognize settings
written by older installs and must not follow future pin changes.
