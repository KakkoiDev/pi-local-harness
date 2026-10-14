# 182: /gate rules shows how often each rule fired

Kind: code

For task 178 ("learn lessons from the errors the local AI is doing"): which weaknesses actually show up.

- [x] Red (python): `/gate rules` counts the decisions in Gate's history per rule (FIRED).
- [x] The list shows RULE, WHEN, OUTCOME, FIRED; `/gate rules <id>` explains one (what it checks, its lesson and test).
  Decisions recorded before plan 179 carry no rule id and are not counted.
