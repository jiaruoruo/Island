Component({
  properties: {
    active: { type: String, value: 'island' },
  },
  data: {
    tabs: [
      { key: 'island', icon: '🏝️', label: '小岛' },
      { key: 'chat', icon: '💬', label: '消息' },
      { key: 'task', icon: '📋', label: '任务' },
      { key: 'profile', icon: '👤', label: '我的' },
    ],
  },
  methods: {
    onTap(e) {
      const key = e.currentTarget.dataset.key;
      if (key === this.data.active) return;
      this.triggerEvent('change', { key });
    },
  },
});
