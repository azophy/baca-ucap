#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

PROMPT="@PRD.md @PLAN.md @progress.txt \
1. Find the highest-priority task and implement it. \
2. Run your tests and type checks. \
3. Update the PRD with what was done. \
4. Append your progress to progress.txt. \
5. Commit your changes. \
ONLY WORK ON A SINGLE TASK. \
If the PRD is complete, output <promise>COMPLETE</promise>."

for ((i=1; i<=$1; i++)); do
  echo "=== Iteration $i ==="

  #result=$(docker sandbox run claude --permission-mode acceptEdits -p "@PRD.md @progress.txt \
  result=$(claude --permission-mode acceptEdits -p " | tee /dev/tty)

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo ""
    echo "=== PRD complete after $i iterations ==="
    exit 0
  fi
  echo ""
done
