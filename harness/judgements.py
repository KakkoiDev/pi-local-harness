"""The decision ladder. Interpretations of phase and approval never perform those actions."""
import hashlib
import json
from pathlib import Path
from harness import laya
from harness.decision_log import record

_UNDECIDED=object()
QUESTIONS={
 'waiting_reply':('How should Pi handle this reply?',['Use the explicit approval controls','Revise the proposal']),
 'phase_intent':('Which phase would you like to choose with the phase control?',['Discussion','Planning','Implementation']),
 'assumed_value':('Should Pi ask before using a value that was not given?',['Ask before using the value','Continue with the stated value']),
 'applicable_guide':('Which guide should Pi use?',['Continue without a guide','Use the planning guide']),
 'shell_risk':('How should Pi proceed with this unclassified command?',['Keep the command blocked','Use a checked read-only command']),
}


class Judgements:
    def __init__(self,paperwork,classifier=None):
        self.paperwork=paperwork;self.classifier=classifier or laya.Classifier(data=paperwork.data)
    def decide(self,request,kind,args,*,code_answer=_UNDECIDED):
        if kind not in QUESTIONS:raise ValueError('Unknown typed judgement.')
        advisory=kind in ('phase_intent','waiting_reply','shell_risk')
        if code_answer is not _UNDECIDED:return {'answer':code_answer,'confidence':1.,'abstained':False,'who':'code','advisory':advisory}
        item=self.paperwork.requests.get(request)
        digest=hashlib.sha256(json.dumps(args[-1] if kind=='assumed_value' else args,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
        if kind=='assumed_value' and isinstance(item,dict) and self.paperwork.confirmed_value(item['root'],digest) is True:
            return {'answer':False,'confidence':1.,'abstained':False,'who':'code','advisory':False}
        result=getattr(laya,kind)(*args,classifier=self.classifier)
        if isinstance(self.paperwork.data,(str,Path)):
            record(self.paperwork.data,request,kind,'laya','abstained' if result['abstained'] else result['answer'],confidence=result['confidence'])
        if not result['abstained'] and not (kind=='assumed_value' and result['answer'] is True):return {**result,'who':'laya','advisory':advisory}
        item=self.paperwork.requests.get(request)
        waiting=self.paperwork.waiting_choice(item['root']) if isinstance(item,dict) else None
        if isinstance(waiting,dict):return {**result,'who':'person','advisory':advisory,'choice':waiting}
        question,labels=QUESTIONS[kind]
        choice={'question':question,'options':[{'label':label} for label in labels],'recommended':0,'allow_other':True,'system_owned':True,'judgement':{'kind':kind,'digest':digest}}
        self.paperwork.choice_pending(request,choice,system=True)
        return {**result,'who':'person','advisory':advisory,'choice':choice}
