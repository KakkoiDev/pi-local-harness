#!/usr/bin/env python3
"""Send two prompts to one Ollama model at the same time and report whether they generated in parallel.

Usage: python3 experiments/parallel_inference/run.py [--model M] [--ctx N] [--tokens N] [--url URL]
Read experiments/parallel_inference/README.md first: Ollama must be restarted with OLLAMA_NUM_PARALLEL=2."""
import argparse
import json
import threading
import time
import urllib.request
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from harness.capability import generate, overlap  # noqa: E402  (the harness's /models check uses the same measurement)

MODEL = json.loads((Path(__file__).resolve().parents[2] / 'harness/model.json').read_text())['model']

PROMPTS = ['Write a 300-word story about a lighthouse keeper.', 'Explain, in 300 words, how a hash table works.']

def verdict(a, b):
    value = overlap(a, b)
    return 'parallel' if value >= 0.5 else 'partial' if value > 0.05 else 'serialized'

def run(url, model, ctx, tokens, prompts):
    start = threading.Event(); results = [{} for _ in prompts]; errors = []
    def worker(prompt, result):
        try: generate(url, model, prompt, ctx, tokens, start, result)
        except Exception as error: errors.append(error)
    threads = [threading.Thread(target=worker, args=pair) for pair in zip(prompts, results)]
    for thread in threads: thread.start()
    origin = time.monotonic(); start.set()
    for thread in threads: thread.join()
    if errors: raise errors[0]
    return origin, results

def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--url', default='http://127.0.0.1:11434')
    parser.add_argument('--model', default=MODEL)
    parser.add_argument('--ctx', type=int, default=8192, help='num_ctx per request; Ollama reserves ctx x OLLAMA_NUM_PARALLEL')
    parser.add_argument('--tokens', type=int, default=300)
    args = parser.parse_args()
    print(f'Warm-up (loads the model, not measured): {args.model} num_ctx={args.ctx}')
    run(args.url, args.model, args.ctx, 8, PROMPTS[:1])
    print('Baseline: one request alone')
    origin, (alone,) = run(args.url, args.model, args.ctx, args.tokens, PROMPTS[:1])
    print('Experiment: two requests at once')
    origin2, pair = run(args.url, args.model, args.ctx, args.tokens, PROMPTS)
    rate = lambda r: r['tokens'] / (r['end'] - r['first_token'])
    print(f"\nalone:  {rate(alone):.1f} tok/s, first token {alone['first_token'] - origin:.1f}s")
    for index, result in enumerate(pair, 1):
        print(f"req {index}: {rate(result):.1f} tok/s, first token {result['first_token'] - origin2:.1f}s, done {result['end'] - origin2:.1f}s")
    total = sum(r['tokens'] for r in pair) / (max(r['end'] for r in pair) - min(r['first_token'] for r in pair))
    print(f"combined: {total:.1f} tok/s vs {rate(alone):.1f} alone ({total / rate(alone):.2f}x)")
    print(f"overlap: {overlap(*pair):.0%} -> {verdict(*pair).upper()}")
    print('Record these lines in experiments/parallel_inference/README.md under Results, with the date and Ollama version.')

if __name__ == '__main__':
    main()
