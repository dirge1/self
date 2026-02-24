#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
echo "正在启动任务奖励 App..."
echo "启动后请在浏览器打开: http://localhost:4173"
python3 -m http.server 4173
