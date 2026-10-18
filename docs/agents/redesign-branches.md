# 前端分支与门禁

**现状（2026-10-18）**：方案 A 的集成分支 `redesign/planet` 已经合回 `main` 并删除（2026-10-17），
app-planet 预览站 2026-10-11 停用，它的预览工作流也已随 [#245](https://github.com/stoasystem/stoa-frontend/pull/245)
删除。**前端修复一律从最新的 `main` 切分支，PR 直接回 `main`**，合入即部署生产。下文「方案 B」一节只在
`redesign/cute` 重启时才用得上。背景见地图 [#3](https://github.com/stoasystem/stoa-frontend/issues/3)。

| 方案 | 集成分支 | 状态 |
| --- | --- | --- |
| A | `redesign/planet` | 已合回 `main` 并删除；预览站 `app-planet.stoaedu.ch` 停用 |
| B | `redesign/cute` | 暂缓，尚未建 |

## 一张票据一条分支

```bash
git fetch origin
git worktree add --no-track ../stoa-frontend-t<票号> -b fix/<票号>-<简述> origin/main
# 做完后推到自己的分支，开 PR，base 是 main
git push -u origin fix/<票号>-<简述>
gh pr create --base main
```

- 开 PR 前再 `git fetch` 一次：另一位开发者也直接提交到 `main`，先确认同一处没有被别人改过。
- `--no-track` 不能省：不加的话，新分支的上游是 `origin/main`，直接 `git push` 会提示推到 `HEAD:main`，
  照做就绕过了 PR 和门禁。

## 门禁

`.github/workflows/redesign-gate.yml` 对 base 为 `main`（以及将来的 `redesign/cute`）的每个 PR
依次跑，任何一步红都不能合：

```
lint → typecheck → check:api-contract → check:untranslated → check:contrast
→ test → test:release → publisher 测试 → build → dist e2e
```

与 `deploy-production.yml` 的门同源（同样的 action 版本、Node 22、`npm ci` 参数，API 契约同样实时拉
`stoa-backend` main 的路由清单）。dist e2e（[#29](https://github.com/stoasystem/stoa-frontend/issues/29)）打刚 build 出来的 dist，后端是 mock，
每个 mock 的响应和页面发出的每个请求体都按后端 OpenAPI 校验；OpenAPI 从 `stoa-backend` main 实时拉取
（[stoa-backend#80](https://github.com/stoasystem/stoa-backend/issues/80)）。用法和盲区见 `tests/e2e-dist/README.md`。

门禁的已知缺口：
- API 契约只查路径与方法，不查响应字段（决议 #5 第 9 条）。星球读模型与异步 Ask 要单独做契约验证。
- API 契约只扫 `src/services`（`scripts/check-api-contract.mjs` 的 `SERVICE_ROOT`）。新代码里的后端调用要放进
  `src/services`，放在 `src/features/planet` 之类的目录里就不会被检查。
- **PR 有合并冲突时门禁一次都不跑**，也不会显示红：GitHub 生成不了合并提交，`pull_request` 工作流就不触发。
  看不到这个检查时，先看 PR 是不是冲突了。
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

- 门禁要在 PR 的**最新提交**上跑完并且是绿的，再合。仓库没有设必需检查，所以**不要用 `gh pr merge --auto`**：
  它会立刻合入，不等门禁。门禁测的是合并提交，`main` 移动时不会重新触发；`main` 在这期间变过的话，
  先重跑一次（Actions 里 Re-run，或推一次 head）。
- 碰到红线（认证、路由守卫、发布投递与工作流、写入边界、密钥等）的改动，合并前必须有不共享上下文的独立审计，
  结论贴在 PR 上，写改动的人不能自审。
- 合入 `main` 即部署生产，每次都要先得到用户确认。部署跑完后再关票。

## 方案 B（`redesign/cute`）重启时

- 从当前 `main` 切出 `redesign/cute`，票据分支叫 `redesign/cute-<票号>`（用连字符：`redesign/cute` 本身就是分支，
  git 不允许再有 `redesign/cute/<票号>`）。PR 只回 `redesign/cute`。
- 门禁已经把 `redesign/cute` 列为 PR 目标；它从 `main` 切出，工作流文件自然就在。
- 预览站要重新做：工作流、GitHub Environment、stoa-infra 里的 bucket 与分发都要新建。可以参考 #245 删除前的
  `deploy-preview.yml` 和它在 `tests/release/publish-web-release.test.mjs` 里的结构测试（`git show 9df454b1^1:<路径>`）。
