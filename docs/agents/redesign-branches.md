# 改版分支的工作方式

两套改版方案各有一条集成分支，代码先在集成分支上攒齐，**不直接进 `main`**。背景见
地图 [#3](https://github.com/stoasystem/stoa-frontend/issues/3) 与决议
[#5](https://github.com/stoasystem/stoa-frontend/issues/5)。

| 方案 | 集成分支 | 预览主机名 |
| --- | --- | --- |
| A | `redesign/planet` | `planet.stoaedu.ch` |
| B | `redesign/cute` | `cute.stoaedu.ch` |

## 一张票据一条分支

```bash
git fetch origin
git worktree add ../stoa-frontend-t<票号> -b redesign/planet-<票号> origin/redesign/planet
# 做完后 push，开 PR，base 选 redesign/planet
gh pr create --base redesign/planet
```

- 分支名是 `redesign/planet-<票号>`（方案 B 为 `redesign/cute-<票号>`），**用连字符，不要用斜杠**：
  `redesign/planet` 本身就是一个分支，git 不允许再有 `redesign/planet/<票号>`，推送会被拒。
- PR 只回自己方案的集成分支，不跨方案，不直接指向 `main`。
- 任务分支不部署，只跑 PR 门禁；只有两条集成分支本身可以发预览（#28）。

## 门禁

`.github/workflows/redesign-gate.yml` 对 base 为 `redesign/planet` 或 `redesign/cute` 的每个 PR
依次跑，任何一步红都不能合：

```
lint → typecheck → check:api-contract → check:untranslated
→ test → test:release → publisher 测试 → build
```

与 `deploy-production.yml` 的门同源（同样的 action 版本、Node 22、`npm ci` 参数，API 契约同样实时拉
`stoa-backend` main 的路由清单）。dist e2e 在 [#29](https://github.com/stoasystem/stoa-frontend/issues/29)
建好前**还没有接入**，工作流里留了占位。

门禁的已知缺口（决议 #5 第 9 条）：API 契约只查路径与方法，不查响应字段；星球读模型与异步 Ask
要单独做契约验证。

## 翻译守卫：新目录要登记

`scripts/check-untranslated.mjs` 只扫顶部 `ROOTS` 里写死的目录，**不在清单里的目录一句都不查**。
新建放界面文案的目录（例如 `src/features/planet`、`src/features/ask`）时，**同一个 PR 里**把它加进
`ROOTS`，并跑一遍 `npm run check:untranslated`。把文件从已登记目录搬到未登记目录，数字会变小，
但那不算翻译改善。

## 合并

- **进集成分支**：门禁绿；碰到红线（认证、发布投递与工作流、写入边界、密钥等）的票据，合并前必须有
  独立审计记录，写票据的人不能自审。
- **进 `main`**：只在方案对比完成、**胜出方案已决议**之后，由胜出方案的集成分支整体合入。
  合并层的其余条件（冒烟打预览、红线审计记录、对比度门禁）见决议 #5 第 9 条。
  落选方案的集成分支不合。
