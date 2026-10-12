# Destructive shell guard

Laya allows ordinary diagnostics, builds, tests, and targeted cleanup. Both standard
and admin profiles allow normal shell commands; neither bypasses this guard.

There is no universal authoritative shell denylist. This policy is our narrow,
argument-sensitive selection of well-documented destructive operations:

| Category | Blocked scope | Allowed examples |
|---|---|---|
| `rm -r`, `rm -R`, `rm --recursive` | Root/system/home/parent trees and broad current-directory globs; disabling root protection | `rm -rf ./build` |
| `chmod`, `chown`, `chgrp` with recursion | Protected root/system/home trees and broad globs | `chmod -R u+w ./build` |
| `mkfs*`, `newfs*` | Filesystem creation against a target | `mkfs --help` |
| `diskutil` | Erase, partition, zero, random, or secure-erasure subcommands | `diskutil list` |
| `dd`, output redirection, `shred` | Raw device writes or broad destruction | `dd if=input.bin of=output.bin` |
| `wipefs`, `blkdiscard` | Signature erasure or block discard | `wipefs /dev/sda` inspection |
| `find ... -delete` | Broad root/home/current-directory scope | Ordinary searches |

The parser recognizes short/long flags, absolute executable paths, common wrappers,
command separators, newlines, and explicit shell `-c`/`-lc` strings. Rules inspect
strings only: regression tests never execute destructive examples. This is an
accident guard, not a security sandbox; arbitrary scripts, aliases, dynamically
constructed commands, and interpreter code can bypass a static shell rule set.

Sources:

- [GNU rm options and root protection](https://www.gnu.org/software/coreutils/manual/html_node/rm-invocation.html)
- [GNU protection for recursive ownership and permissions](https://www.gnu.org/software/coreutils/manual/html_node/Treating-_002f-specially.html)
- [mkfs manual](https://man7.org/linux/man-pages/man8/mkfs.8.html)
- [wipefs manual](https://man7.org/linux/man-pages/man8/wipefs.8.html)
- [blkdiscard manual](https://man7.org/linux/man-pages/man8/blkdiscard.8.html)
- [Codex policy distinguishes scoped cleanup from broad destruction](https://github.com/openai/codex/blob/main/codex-rs/prompts/templates/guardian/policy.md)
- [OWASP command and argument validation guidance](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)

OWASP recommends allowlists for injection prevention; it does not endorse a
universal dangerous-command blacklist. Our scoped deny rules follow the user's
request to keep routine shell work unrestricted.
