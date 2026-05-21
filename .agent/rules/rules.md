# GLOBAL RULES

This file defines global rules for all agents.

These rules override any role definition.

All agents must follow RULES.md.


--------------------------------------------------

## 1. Source of Truth

Priority order:

1. PRD.md
2. ARCH.md
3. TASK.md
4. RULES.md
5. DEVLOG.md
6. REVIEWLOG.md
7. TESTLOG.md


Rules:

- PRD defines requirements
- ARCH defines architecture
- TASK defines execution
- DEVLOG defines implementation
- REVIEWLOG defines review result
- TESTLOG defines test result


Agents must NOT invent requirements.


--------------------------------------------------

## 2. No Unauthorized Changes

No agent may modify files outside task scope.

Forbidden:

- Change architecture without task
- Change API without task
- Change DB without task
- Change folder structure
- Change framework
- Change config
- Change dependency


If change needed:

→ report to PM


--------------------------------------------------

## 3. Task Driven Development

All development must follow TASK.md.

Rules:

- No task → no code
- No task → no change
- No task → no refactor


Allowed:

Implement only current TaskID


--------------------------------------------------

## 4. One Task At A Time

Agents must not do multiple tasks.

Wrong:

Implement T003 + T004 + T005

Correct:

Implement T003 only


--------------------------------------------------

## 5. No Self Design

Agents must not redesign system.

Forbidden:

- redesign API
- redesign UI
- redesign database
- redesign architecture

If design conflict:

→ ask PM


--------------------------------------------------

## 6. File Scope Rule

Agents must modify only files listed in TASK.md.

If file not listed:

Do not modify.


--------------------------------------------------

## 7. Architecture Protection Rule

ARCH.md is locked.

No agent may change architecture unless TASK says so.

Forbidden:

- change layer structure
- change module structure
- change communication method
- change runtime environment


--------------------------------------------------

## 8. API Protection Rule

API must follow ARCH.md.

Forbidden:

- change URL
- change method
- change request format
- change response format

Unless TASK allows.


--------------------------------------------------

## 9. Database Protection Rule

Database cannot change without task.

Forbidden:

- create table
- drop table
- alter column
- change type
- change index

Unless TASK allows.


--------------------------------------------------

## 10. Reviewer Authority

Reviewer result must be respected.

If REVIEWLOG = FAIL

→ task not finished

If REVIEWLOG = PASS

→ QA may test


Agents must not ignore reviewer.


--------------------------------------------------

## 11. QA Authority

Human QA decision is final.

If TESTLOG says FAIL

→ PM must create fix task

Agents must not argue.


--------------------------------------------------

## 12. PM Authority

Only PM agent may change TASK.md.

Forbidden for others:

- change task
- reorder task
- mark done
- delete task


--------------------------------------------------

## 13. Logging Required

Every task must generate DEVLOG.md

Format:

TaskID
FilesChanged
Description
Status


No DEVLOG = task not done


--------------------------------------------------

## 14. Review Required

Every DEVLOG must be reviewed.

DEV → REVIEW → TEST

Never skip review.


--------------------------------------------------

## 15. No Hidden Changes

Agents must not make hidden changes.

All changes must appear in:

DEVLOG.md


--------------------------------------------------

## 16. Stop On Conflict

If conflict detected:

Stop.

Do not guess.

Do not auto fix.

Report.


--------------------------------------------------

## 17. Long Term Stability Rule

Agents must prefer stability over optimization.

Forbidden without task:

- refactor
- rename
- move files
- rewrite code
- optimize structure


--------------------------------------------------

## 18. Human Control Rule

Human decisions override all agents.

Human may:

- change PRD
- change ARCH
- change TASK
- cancel task
- rewrite task


Agents must obey.


--------------------------------------------------

## 19. Session Independence Rule

Agents must not rely on chat history.

All state must come from files:

PRD.md
ARCH.md
TASK.md
DEVLOG.md
TESTLOG.md
REVIEWLOG.md


--------------------------------------------------

## 20. Golden Rule

No TASK → No change
No PRD → No feature
No ARCH → No structure
No REVIEW → No test
No TEST → No done


--------------------------------------------------

## 21. User Preferred Python Environment

All python execution, dependency management, and test suite commands in this repository must use the user's pre-configured virtual environment:
`/Users/xiangfang/Developer/soft/venv_3.11.9/bin/python` (pip: `/Users/xiangfang/Developer/soft/venv_3.11.9/bin/pip`)