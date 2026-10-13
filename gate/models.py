from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Optional
from datetime import datetime

class ActionOutcome(Enum):
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"
    REVISE = "REVISE"
    ESCALATE = "ESCALATE"

class ToolRiskCategory(Enum):
    READ_ONLY = "read_only"
    REVERSIBLE_WRITE = "reversible_write"
    EXTERNAL_SIDE_EFFECT = "external_side_effect"
    HIGH_RISK = "high_risk"

@dataclass
class ActionProposal:
    tool_name: str
    args: Dict[str, Any]
    reason: str
    evidence: Optional[str] = None
    authorization: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass
class ExecutionResult:
    tool_name: str
    args: Dict[str, Any]
    output: Any
    exit_code: int
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass
class JudgmentEvent:
    timestamp: datetime
    proposal: ActionProposal
    execution: Optional[ExecutionResult] = None
    status: str = "PENDING"
    reasoning: Optional[str] = None
    drift_detected: bool = False
