"""python3 -m bench list | check | run [ids…] [--model M] [--effort E] [--repeat N] | report (see bench/__init__.py)."""
import argparse
import json
import sys
from pathlib import Path

from bench import runner


def main(argv=None):
    parser = argparse.ArgumentParser(prog='python3 -m bench')
    parser.add_argument('command', choices=['list', 'check', 'run', 'report'])
    parser.add_argument('ids', nargs='*')
    parser.add_argument('--model'); parser.add_argument('--effort')
    parser.add_argument('--repeat', type=int, default=1)
    parser.add_argument('--prompt', choices=runner.LEVELS, default='everyday', help='how the request is worded (default: everyday)')
    parser.add_argument('--bare', action='store_true', help='plain Pi with Gate safety only: the baseline that shows what the harness adds')
    parser.add_argument('--out', default=str(runner.results_dir()))
    args = parser.parse_args(argv)
    chosen = runner.scenarios(args.ids)
    if args.command == 'list':
        for item in chosen:
            print(f"{item['id']:22} {item['kind']:13} {' '.join(level for level in runner.LEVELS if runner.prompt(item, level))}")
            print(f"    {runner.prompt(item, args.prompt) or '(no ' + args.prompt + ' prompt)'}")
        return 0
    if args.command == 'check':
        bad = 0
        for item in chosen:
            verdict = runner.fair(item); ok = verdict['fails_at_start'] and verdict['passes_with_solution']; bad += not ok
            print(f"{'✓' if ok else '✗'} {item['id']}: fails at start {verdict['fails_at_start']}, passes with the solution {verdict['passes_with_solution']}" + ('' if ok else f"\n    {verdict['said'][-300:]}"))
        return 1 if bad else 0
    if args.command == 'run':
        try: saved = json.loads((Path(runner.os.getenv('PI_AGENT_DATA', str(Path.home() / 'pi-local-harness-data'))) / 'model.json').read_text())
        except (OSError, ValueError): saved = {}
        model, effort = args.model or saved.get('model') or 'gemma4:26b-mlx', args.effort or saved.get('effort') or 'high'
        skipped = [item['id'] for item in chosen if not runner.prompt(item, args.prompt)]; chosen = [item for item in chosen if runner.prompt(item, args.prompt)]
        if skipped: print(f"No {args.prompt} prompt (skipped): {', '.join(skipped)}")
        print(f'Bench: {len(chosen)} scenario(s) × {args.repeat}, {args.prompt} prompts, with {model} ({effort}); results in {args.out}', flush=True)
        for _ in range(args.repeat):
            for item in chosen:
                result = runner.run_one(item, model, effort, args.out, log=lambda text: print(text, flush=True), level=args.prompt, bare=args.bare)
                print(f"  {'✓ resolved' if result['resolved'] else ('✗ solved but broke tests' if result['solved'] else '✗ not solved')}{' (first try)' if result['first_try'] else ''} · {'verified, committed' if result['verified'] else 'not verified'} · {result['status']} · {result['seconds'] // 60} min · "
                      f"{result['tool_calls']} tool calls · wake-ups {result['reports'].get('wake-up', 0)} · refusals {sum(result['rules'].values())}", flush=True)
        return 0
    results = runner.read_jsonl(Path(args.out) / 'results.jsonl')
    for row in runner.summary(results):
        print(f"{row['model']} ({row['effort']}) · {row['mode']} {row['harness']} · {row['prompt_level']} prompts: {row['solved']}/{row['runs']} resolved, {row['first_try']} first try, {row['verified']} verified, pass^k {row['pass_k']}, {row['minutes']} min, wake-ups {row['wake_ups']}, refusals {row['refusals']} per run")
    return 0


if __name__ == '__main__':
    sys.exit(main())
