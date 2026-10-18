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
 'app_block':('Which App Block card should Pi use?',['Continue without a card']),
}
# Plan 266 item 7: a card is help, never a question for the person: an abstained pick attaches nothing.
NO_CARD=('app_block',)

PHASE_NOTICE='Pi cannot change the phase. To move the work, use the phase button: Discussion, Planning or Implementation.'
# Round 12 (R12_Conversation, HarnessNotice): without Laya the harness says so once, in its own voice, with how to install it.
NO_CLASSIFIER_NOTICE='Laya isn’t installed, so the phase button can’t suggest the next phase. Everything else works.'


class Judgements:
    def __init__(self,paperwork,classifier=None):
        self.paperwork=paperwork;self.classifier=classifier or laya.Classifier(data=paperwork.data)
    def decide(self,request,kind,args,*,code_answer=_UNDECIDED):
        if kind not in QUESTIONS:raise ValueError('Unknown typed judgement.')
        advisory=kind in ('phase_intent','waiting_reply','shell_risk')
        if code_answer is not _UNDECIDED:
            if isinstance(self.paperwork.data,(str,Path)):record(self.paperwork.data,request,kind,'code',code_answer,rule='judgement.code')
            return {'answer':code_answer,'confidence':1.,'abstained':False,'who':'code','advisory':advisory}
        item=self.paperwork.requests.get(request)
        digest=hashlib.sha256(json.dumps(args[-1] if kind=='assumed_value' else args,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
        if kind=='assumed_value' and isinstance(item,dict) and self.paperwork.confirmed_value(item['root'],digest) is True:
            if isinstance(self.paperwork.data,(str,Path)):record(self.paperwork.data,request,kind,'code',False,rule='judgement.confirmed_value')
            return {'answer':False,'confidence':1.,'abstained':False,'who':'code','advisory':False}
        result=getattr(laya,kind)(*args,classifier=self.classifier)
        if isinstance(self.paperwork.data,(str,Path)):
            record(self.paperwork.data,request,kind,'laya','abstained' if result['abstained'] else result['answer'],confidence=result['confidence'],abstained=bool(result['abstained']))
        if kind in NO_CARD:return {**result,'answer':None if result['abstained'] or result['answer']=='none' else result['answer'],'who':'laya','advisory':True}
        if kind=='phase_intent':
            # Task 290 (review P2): the phase is the person's button; a phase word, read by Laya or by a keyword alone
            # (no Laya), gets an inline notice that says where the button is, never a blocking card.
            missing=result['abstained'] and not getattr(self.classifier,'available',lambda:True)()
            return {**result,'who':'laya' if not result['abstained'] else 'code','advisory':True,'notice':NO_CLASSIFIER_NOTICE if missing else PHASE_NOTICE}
        if not result['abstained'] and not (kind=='assumed_value' and result['answer'] is True):return {**result,'who':'laya','advisory':advisory}
        item=self.paperwork.requests.get(request)
        waiting=self.paperwork.waiting_choice(item['root']) if isinstance(item,dict) else None
        if isinstance(waiting,dict):return {**result,'who':'person','advisory':advisory,'choice':waiting}
        question,labels=QUESTIONS[kind]
        choice={'question':question,'options':[{'label':label} for label in labels],'recommended':0,'allow_other':True,'system_owned':True,'judgement':{'kind':kind,'digest':digest}}
        self.paperwork.choice_pending(request,choice,system=True)
        return {**result,'who':'person','advisory':advisory,'choice':choice}
