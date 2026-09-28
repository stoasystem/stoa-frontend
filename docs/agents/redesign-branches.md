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
git worktree add --no-track ../stoa-frontend-t<票号> -b redesign/planet-<票号> origin/redesign/planet
# 做完后显式推到自己的分支，再开 PR，base 选 redesign/planet
git push -u origin redesign/planet-<票号>
gh pr create --base redesign/planet
```

- 分支名是 `redesign/planet-<票号>`（方案 B 为 `redesign/cute-<票号>`），**用连字符，不要用斜杠**：
  `redesign/planet` 本身就是一个分支，git 不允许再有 `redesign/planet/<票号>`，推送会被拒。
- `--no-track` 不能省：不加的话，新分支的上游会是 `origin/redesign/planet`。这时直接 `git push` 会失败，
  git 给出的提示是推到 `HEAD:redesign/planet`，照做就会绕过门禁、直接写进集成分支。
- PR 只回自己方案的集成分支，不跨方案，不直接指向 `main`。PR 一开始就选对 base；
  开好以后再改 base 也会重新跑门禁（工作流监听了 `edited` 事件）。
- 任务分支不部署，只跑 PR 门禁；只有两条集成分支本身可以发预览（#28）。

## 门禁

`.github/workflows/redesign-gate.yml` 对 base 为 `redesign/planet` 或 `redesign/cute` 的每个 PR
依次跑，任何一步红都不能合：

```
lint → typecheck → check:api-contract → check:untranslated → check:contrast
→ test → test:release → publisher 测试 → build
```

**工作流文件必须已经在集成分支里，门禁才会跑。** GitHub 跑的是 PR 合并提交里的工作流，而 `main` 上没有这个
文件。所以 `redesign/cute` 要从已经包含 `redesign-gate.yml` 的提交切出，或者把这个工作流作为它的第一个提交；
否则指向它的 PR 一个检查都不跑，也不会有任何提示。

与 `deploy-production.yml` 的门同源（同样的 action 版本、Node 22、`npm ci` 参数，API 契约同样实时拉
`stoa-backend` main 的路由清单）。dist e2e 在 [#29](https://github.com/stoasystem/stoa-frontend/issues/29)
建好前**还没有接入**，工作流里留了占位。

门禁的已知缺口：
- API 契约只查路径与方法，不查响应字段（决议 #5 第 9 条）。星球读模型与异步 Ask 要单独做契约验证。
- API 契约只扫 `src/services`（`scripts/check-api-contract.mjs` 的 `SERVICE_ROOT`）。新代码里的后端调用要放进
  `src/services`，放在 `src/features/planet` 之类的目录里就不会被检查。
- `workflow_dispatch` 暂时用不了：GitHub 只允许手动触发默认分支上的工作流。
- 对比度门禁（`check:contrast`）只评 `scripts/contrast-pairs.json` 里声明的前景/背景对，token 从该文件
  `tokens.file` 指向的那一个文件读。在 [#18](https://github.com/stoasystem/stoa-frontend/issues/18) 落地前它指向
  `design/tokens.css`（画布 Tokens 页的誊本，应用不引用），所以**评的是画布值，不是线上样式**；#18 把
  `tokens.file` 改成 `src/styles/brand-tokens.css` 并删掉誊本。`"gate": false` 的对只打印读数、不拦，
  那是画布值本身不达标、留给 #18 定的开放问题。JSX 里的内联颜色它看不到。

## 翻译守卫：新目录要登记

`scripts/check-untranslated.mjs` 只扫顶部 `ROOTS` 里写死的目录，**不在清单里的目录一句都不查**。
新建放界面文案的目录（例如 `src/features/planet`、`src/features/ask`）时，**同一个 PR 里**把它加进
`ROOTS`，并跑一遍 `npm run check:untranslated`，**确认计数确实变了**：清单里的目录名写错了，脚本不会报错，
只会一句都不扫。把文件从已登记目录搬到未登记目录，数字会变小，
但那不算翻译改善。

## 合并

- **进集成分支**：门禁绿；碰到红线（认证、发布投递与工作流、写入边界、密钥等）的票据，合并前必须有
  独立审计记录，写票据的人不能自审。
- **进 `main`**：只在方案对比完成、**胜出方案已决议**之后，由胜出方案的集成分支整体合入。
  合并层的其余条件（冒烟打预览、红线审计记录、对比度门禁）见决议 #5 第 9 条。
  落选方案的集成分支不合。
- 胜出分支合进 `main` 的那个 PR，**不会触发本门禁**，因为本门禁只认 base 为 `redesign/*` 的 PR。
  合并前要手动跑一次 `frontend-ci.yml`，或者在集成分支上确认最后一次门禁是绿的；否则第一次检查
  要等 push 到 `main` 以后才发生。
