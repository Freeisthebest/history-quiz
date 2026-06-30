# 近代史选择题刷题网站

这是一个纯静态刷题网站，可以直接部署到 GitHub Pages、Cloudflare Pages、Netlify 或 Vercel。

## 本地文件

- `index.html`：网页入口。
- `styles.css`：页面样式。
- `quiz-core.js`：组卷、判分、错题记录核心逻辑。
- `questions.js`：题库数据，后续加题或改题主要编辑这个文件。
- `app.js`：页面交互逻辑。

## GitHub Pages 发布

1. 在 GitHub 新建一个公开仓库，例如 `history-quiz`。
2. 上传本目录中的全部文件到仓库根目录。
3. 进入仓库的 `Settings` -> `Pages`。
4. `Source` 选择 `Deploy from a branch`。
5. `Branch` 选择 `main`，目录选择 `/root`，保存。
6. 等待 1-2 分钟后，GitHub 会给出公开访问地址。

## 使用规则

网站提供两种刷题模式：

- 打开网站后先选择刷题模式，再进入对应练习。
- 模拟试卷：每次重新组卷会随机抽取 40 道单选题和 20 道多选题。
- 即时刷题：随机从完整题库抽取题目，答完一道题后立即显示正确答案，类似驾考科一刷题。

错题记录保存在每个访问者自己的浏览器中，互不影响。
