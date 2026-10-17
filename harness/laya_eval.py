"""Opt-in local evaluation; ordinary tests use a fake and never load MLX."""
import argparse
import json
from pathlib import Path
from harness import laya


def evaluate(cases,classifier):
    report={}
    for case in cases:
        result=getattr(laya,case['kind'])(*case['args'],classifier=classifier)
        row=report.setdefault(case['kind'],{'total':0,'answered':0,'correct':0,'wrong_above_threshold':0,'abstained':0})
        row['total']+=1
        if result['abstained']:row['abstained']+=1
        else:
            row['answered']+=1
            if result['answer']==case['answer']:row['correct']+=1
            else:row['wrong_above_threshold']+=1
    return report


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--data',required=True);parser.add_argument('--cases',required=True);args=parser.parse_args()
    cases=json.loads(Path(args.cases).read_text())['cases']
    print(json.dumps(evaluate(cases,laya.Classifier(data=args.data)),indent=2))


if __name__=='__main__':main()
