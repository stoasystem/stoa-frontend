# 改版分支的工作方式

两套改版方案各有一条集成分支，代码先在集成分支上攒齐，**不直接进 `main`**。背景见
地图 [#3](https://github.com/stoasystem/stoa-frontend/issues/3) 与决议
[#5](https://github.com/stoasystem/stoa-frontend/issues/5)。

| 方案 | 集成分支 | 预览主机名 |
| --- | --- | --- |
| A | `redesign/planet` | `app-planet.stoaedu.ch` |
| B | `redesign/cute`（暂缓，尚未建） | 暂缓；重启时照此命名，如 `app-cute.stoaedu.ch` |

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

`.github/workflows/redesign-gate.yml` 对 base 为 `redesign/planet`、`redesign/cute` 或 `main` 的每个 PR
依次跑，任何一步红都不能合（`main` 那一项只对合并提交里带着这个文件的 PR 生效，见下方「合并」）：

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
  `tokens.file` 指向的那一个文件读，自 [#18](https://github.com/stoasystem/stoa-frontend/issues/18) 起就是
  应用真正引用的 `src/styles/brand-tokens.css`。浅色主题读 `:root`，深色（「天空」表面：星球、练习舞台、登录页）
  读 `:root` + `[data-surface="sky"]`；深色 token 只在带这个属性的元素内部存在。两个主题读同一组块、或者某个
  没被任何主题读的块定义了 pairs 用到的 token、或者 token 文件里有嵌套规则，都 exit 2；`src/` 下任何别的
  `.css` / `.ts` / `.tsx` / `.html`（以及根目录 `index.html`）只要声明了 pairs 用到的 token（含 var() 链上经过的），
  也 exit 2，因为那样屏幕上显示的就不是门禁评的值（识别哪些写法见 `scripts/contrast-guard.mjs`，
  每种写法在 `tests/component/contrastGuard.test.ts` 里都有投毒用例）。
  `"gate": false` 的对只打印读数、不拦；它的 `why` 必须引用票号（`#n`），每个主题至少留一对受门禁，豁免的对一旦
  达标就 exit 1，要求删掉豁免。现在只剩 `--on-sky-text-muted`（仅限禁用、不可交互控件的标签）一对豁免。
  旧页面用的 `--stoa-brand-*`、`--platform-*` 等旧名在 `src/styles/legacy-bridge.css` 里映射到新 token，门禁不读
  那个文件，它也不许定义画布 token 名。JSX 里的内联颜色门禁看不到。

## 翻译守卫：新目录要登记

`scripts/check-untranslated.mjs` 只扫顶部 `ROOTS` 里写死的目录，**不在清单里的目录一句都不查**。
新建放界面文案的目录（例如 `src/features/planet`、`src/features/ask`）时，**同一个 PR 里**把它加进
`ROOTS`，并跑一遍 `npm run check:untranslated`，**确认计数确实变了**：清单里的目录名写错了，脚本不会报错，
只会一句都不扫。把文件从已登记目录搬到未登记目录，数字会变小，
但那不算翻译改善。

## 合并

- **进集成分支**：门禁绿；碰到红线（认证、发布投递与工作流、写入边界、密钥等）的票据，合并前必须有
  独立审计记录，写票据的人不能自审。
- **进 `main`**：`redesign/planet` 满足决议 [#84](https://github.com/stoasystem/stoa-frontend/issues/84)
  的条件后，以一个 merge commit 整体合入（方案 B 暂缓，A 不等 B）。硬条件与执行顺序见
  [#86](https://github.com/stoasystem/stoa-frontend/issues/86)。合并到 `main` 即部署生产，逐次得到用户确认。
- 集成分支合进 `main` 的那个 PR **会触发本门禁**（[#85](https://github.com/stoasystem/stoa-frontend/issues/85)
  把 `main` 加进了 PR 目标）。以那个 PR **确切 head** 上的这次运行为准，合并前手动核对它是绿的。
- 从 `main` 切出的热修 PR 不受影响：`main` 上还没有这个工作流文件，GitHub 用的是合并提交里的工作流，
  所以这些 PR 不会触发。集成分支合入以后，文件进了 `main`，本门禁就成了 `main` 的 PR 门禁。
