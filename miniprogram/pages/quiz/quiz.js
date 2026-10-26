const { request } = require('../../utils/request');

const TYPES = [
  { key: 'compatibility', label: '默契考验', icon: '🤝', color: '#FF7E9D' },
  { key: 'sweetness', label: '甜度打分', icon: '🍬', color: '#9B8CFF' },
  { key: 'personality', label: '性格适配', icon: '🧩', color: '#4FD1C5' },
];

Page({
  data: {
    coupleId: '',
    TYPES,
    quizId: '',
    questions: [],
    answers: {},
    report: null,
    label: '',
  },
  onLoad(options) {
    this.setData({ coupleId: options.coupleId || '' });
  },
  async start(e) {
    const type = e.currentTarget.dataset.type;
    try {
      const res = await request('/api/quiz/' + this.data.coupleId, {
        method: 'POST',
        data: { type },
      });
      this.setData({
        quizId: res.quiz.id,
        questions: res.questions,
        answers: {},
        report: null,
        label: res.label,
      });
    } catch (err) {
      wx.showToast({ title: (err && err.error) || '发起失败', icon: 'none' });
    }
  },
  choose(e) {
    const { qi, opt } = e.currentTarget.dataset;
    this.setData({ ['answers.' + qi]: opt });
  },
  async submit() {
    const qs = this.data.questions;
    if (Object.keys(this.data.answers).length < qs.length) {
      wx.showToast({ title: '还有题目没答完哦', icon: 'none' });
      return;
    }
    try {
      await request('/api/quiz/' + this.data.coupleId + '/' + this.data.quizId + '/answer', {
        method: 'POST',
        data: { answers: this.data.answers },
      });
      const res = await request(
        '/api/quiz/' + this.data.coupleId + '/' + this.data.quizId + '/report',
      );
      this.setData({ report: res.report });
    } catch (err) {
      wx.showToast({ title: (err && err.error) || '生成失败', icon: 'none' });
    }
  },
  restart() {
    this.setData({ questions: [], answers: {}, report: null, quizId: '' });
  },
});
