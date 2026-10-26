Page({
  data: {
    coupleId: '',
    tasks: [],
    input: '',
  },
  onLoad(options) {
    this.setData({ coupleId: options.coupleId || 'default' });
  },
  onShow() {
    this.load();
  },
  load() {
    const tasks = wx.getStorageSync('tasks_' + this.data.coupleId) || [];
    this.setData({ tasks });
  },
  save(tasks) {
    wx.setStorageSync('tasks_' + this.data.coupleId, tasks);
    this.setData({ tasks });
  },
  onInput(e) {
    this.setData({ input: e.detail.value });
  },
  add() {
    const text = this.data.input.trim();
    if (!text) return;
    const task = { id: String(Date.now()), text, done: false };
    this.save([...this.data.tasks, task]);
    this.setData({ input: '' });
  },
  toggle(e) {
    const id = e.currentTarget.dataset.id;
    const tasks = this.data.tasks.map((t) =>
      t.id === id ? { ...t, done: !t.done } : t,
    );
    this.save(tasks);
  },
  remove(e) {
    const id = e.currentTarget.dataset.id;
    const tasks = this.data.tasks.filter((t) => t.id !== id);
    this.save(tasks);
  },
});
