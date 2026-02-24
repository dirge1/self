const KEY = "motivation-app-state-v1";

const state = loadState();

const pointsEl = document.getElementById("points");
const taskListEl = document.getElementById("task-list");
const rewardListEl = document.getElementById("reward-list");

const taskForm = document.getElementById("task-form");
const rewardForm = document.getElementById("reward-form");
const exportBtn = document.getElementById("export-data");
const importBtn = document.getElementById("import-data");
const importFileEl = document.getElementById("import-file");

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.getElementById("task-title").value.trim();
  const points = Number(document.getElementById("task-points").value);
  if (!title || points <= 0) return;

  state.tasks.push({ id: crypto.randomUUID(), title, points });
  taskForm.reset();
  saveAndRender();
});

rewardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.getElementById("reward-title").value.trim();
  const cost = Number(document.getElementById("reward-cost").value);
  if (!title || cost <= 0) return;

  state.rewards.push({ id: crypto.randomUUID(), title, cost });
  rewardForm.reset();
  saveAndRender();
});

exportBtn.addEventListener("click", () => {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `motivation-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => {
  importFileEl.click();
});

importFileEl.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const content = await file.text();
    const parsed = JSON.parse(content);
    const next = normalizeState(parsed);

    state.points = next.points;
    state.tasks = next.tasks;
    state.rewards = next.rewards;
    saveAndRender();
    alert("导入成功，数据已更新。");
  } catch {
    alert("导入失败：文件格式不正确，请选择导出的 JSON 文件。");
  } finally {
    importFileEl.value = "";
  }
});

function render() {
  pointsEl.textContent = String(state.points);

  const taskTemplate = document.getElementById("task-item-template");
  taskListEl.innerHTML = "";

  if (state.tasks.length === 0) {
    taskListEl.innerHTML = `<li><p class="meta">先添加一个超级小的任务，哪怕只是“喝一杯水”。</p></li>`;
  }

  for (const task of state.tasks) {
    const node = taskTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".title").textContent = task.title;
    node.querySelector(".meta").textContent = `完成后 +${task.points} 分`;

    node.querySelector(".done").addEventListener("click", () => {
      state.points += task.points;
      state.tasks = state.tasks.filter((item) => item.id !== task.id);
      saveAndRender();
    });

    node.querySelector(".delete").addEventListener("click", () => {
      state.tasks = state.tasks.filter((item) => item.id !== task.id);
      saveAndRender();
    });

    taskListEl.append(node);
  }

  const rewardTemplate = document.getElementById("reward-item-template");
  rewardListEl.innerHTML = "";

  if (state.rewards.length === 0) {
    rewardListEl.innerHTML = `<li><p class="meta">添加你真心期待的小奖励，例如“喝一杯奶茶”。</p></li>`;
  }

  for (const reward of state.rewards) {
    const node = rewardTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".title").textContent = reward.title;
    node.querySelector(".meta").textContent = `需要 ${reward.cost} 分`;

    node.querySelector(".redeem").addEventListener("click", () => {
      if (state.points < reward.cost) {
        alert("积分不够，先完成一个小任务吧。");
        return;
      }
      state.points -= reward.cost;
      alert(`已兑换：${reward.title}`);
      saveAndRender();
    });

    node.querySelector(".delete").addEventListener("click", () => {
      state.rewards = state.rewards.filter((item) => item.id !== reward.id);
      saveAndRender();
    });

    rewardListEl.append(node);
  }
}

function saveAndRender() {
  localStorage.setItem(KEY, JSON.stringify(state));
  render();
}

function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return normalizeState();
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch {
    return normalizeState();
  }
}

function normalizeState(input = {}) {
  const tasks = Array.isArray(input.tasks)
    ? input.tasks
      .filter((item) => item && typeof item.title === "string" && Number(item.points) > 0)
      .map((item) => ({
        id: typeof item.id === "string" && item.id ? item.id : crypto.randomUUID(),
        title: item.title.trim(),
        points: Number(item.points)
      }))
    : [];

  const rewards = Array.isArray(input.rewards)
    ? input.rewards
      .filter((item) => item && typeof item.title === "string" && Number(item.cost) > 0)
      .map((item) => ({
        id: typeof item.id === "string" && item.id ? item.id : crypto.randomUUID(),
        title: item.title.trim(),
        cost: Number(item.cost)
      }))
    : [];

  return {
    points: Math.max(0, Number(input.points) || 0),
    tasks,
    rewards
  };
}

render();
