# 判断「这个模块还有没有人用」

本仓只认一种方法：

```bash
node scripts/dead-code-scan.mjs                  # 全量报告
node scripts/dead-code-scan.mjs --check <路径>…  # 逐个候选给结论，也可 --check-file <清单>
node scripts/dead-code-scan.mjs --json           # 同一份报告，JSON
node scripts/dead-code-scan.mjs --self-test      # 在生成的小仓上验证脚本本身
```

**退出码 1 = 自检失败，这次输出的结论一律不可信**，先修自检再谈删除。

`tsc` 的 `noUnusedLocals` 只管文件内部，不管「整个模块没人 import」，所以它不是答案。
裸 `grep` 也不是答案，原因见下文。

## 脚本做了什么

脚本不调用任何 shell 搜索工具。它用 `git ls-files` 列出已跟踪文件（外加未忽略的新文件），
用 `fs` 读内容，然后对 `src/` 下每个模块做两次互不依赖的判断：

- **import 图**：用 TypeScript 编译器解析所有 JS/TS，跟 `import` / re-export / 字面量
  `import()` / `vi.mock` / `import.meta.glob` / `new URL(..., import.meta.url)` / 指向已跟踪
  文件的路径字符串，从 `index.html` 加载的入口开始走图。
- **整词计数**：模块名作为整词出现在多少个其它文件里，相当于 `command grep -rlw`。
  `docs/`、`.planning/` 和 `*.md` 里的提及不算引用。

两条都说没人用，才判 `DEAD`。结论的含义：

| 结论 | 含义 | 能不能直接删 |
| --- | --- | --- |
| `LIVE` | 从入口可达 | 不能 |
| `DEAD` | 没有任何文件 import，名字也不在别处出现 | 是删除候选 |
| `DISPUTED` | 两条路径说法不一，报告里附证据 | 人看过再说 |
| `TEST-ONLY` | 只有 `tests/` 在 import | 连同测试一起判 |
| `UNREACHABLE` | 有人 import，但入口走不到（例如只被死模块引用） | 先处理它的引用方 |
| `EXEMPT` | `*.test-d.ts` / `*.d.ts`，靠 `tsc -b` 生效，本来就没人 import | 永远不判 |

报告还列出死 export、只被测试用的 export、导出对象字面量里没人读的成员。

每次运行都会自检，任一项失败就 exit 1：

- **二进制字节守卫**：已跟踪的文本类文件里不得有 `file(1)` 会判成二进制的字节（NUL 等控制字符）；
- **阴性对照**：`src/components/chat/ChatInput.tsx` 必须判为 `LIVE`，且看得见 `ChatPage.tsx:9` 这条 import；
- **阳性对照**：内存里临时加一个谁都不引用的探针模块，必须两条路径都判 `DEAD`；
- **豁免对照**：`src/types/billing.contract.test-d.ts` 不得被判。

## 它看不见什么

- 参数不是字面量的 `import()`（报告的 Blind spots 一节会逐条列出，目前都在 `tests/release/`）；
- 只在别的仓里被提到的文件，例如后端证据链会摘要 `tests/e2e/billing-paid-access.spec.ts`；
- 用 `readdirSync` 整目录读取的文件；
- 通过计算出来的 key 访问的对象成员。

所以脚本的 `DEAD` 只算一条路径。删除前按 `stoa-docs` 的规矩再补独立路径取交集：
至少在仓库根目录跑一次 `command grep -rlw '<名字>' .`（去掉自身后为 0；注意是
`command grep`，见下文），涉及跨仓引用时去 `stoa-backend` 再查一次；删完跑
`npm run typecheck`、`npm test`、`npm run build`。

## 裸 `grep` 在本仓的坑

死代码判定曾不止一次建立在「grep 没搜到」上，而 grep 静默漏掉了一个文件：
`src/pages/chat/ChatPage.tsx` 里曾有一个裸 NUL 字节，`file(1)` 把整份文件判成 `data`，
它的 import 从 grep 结果里消失，`ChatInput` 这类活模块看起来就成了死代码。

两种 grep 的表现不同，都会误导：

- **agent shell 里的 `grep`** 不是系统 grep，而是一个 shell 函数（`type grep` 可见），实际
  跑的是 ugrep，带 `-I --ignore-files`。`-I` 让它把「二进制」文件**直接跳过，不提示，退出码 0**。
  `--ignore-files` 还会按 `.gitignore` 跳过文件。
- **`command grep`（macOS 的 BSD grep 2.6.0）** 用 `-l` 时仍会列出这个文件；但 `-n` 或默认输出
  只打印一行 `Binary file … matches`，看不到 import 行本身；加 `-I` 则同样静默跳过。

在本机复现（把修复前的 ChatPage.tsx 取到临时目录）：

```text
$ git show 8208d9b^:src/pages/chat/ChatPage.tsx > tmp/src/ChatPageNul.tsx
$ file tmp/src/ChatPageNul.tsx
tmp/src/ChatPageNul.tsx: data
$ grep -rl ChatInput tmp/src           # shell 函数：ChatPageNul.tsx 不在结果里，exit 0
$ command grep -rl ChatInput tmp/src   # 列出了 ChatPageNul.tsx
$ command grep -n "import { ChatInput" tmp/src/ChatPageNul.tsx
Binary file tmp/src/ChatPageNul.tsx matches
```

**现状**：`8208d9b` 已把那个 NUL 改写成 `\u0000` 转义，今天已跟踪的文本文件里没有二进制字节。
但这类字节随时可能再混进来（粘贴、生成代码），所以脚本每次运行都检查，混进来就 exit 1 并指出
`文件:行`。在它之外手工搜索时：

- 用 `command grep`，不用裸 `grep`；
- 要看匹配行时加 `-a`（把所有文件当文本），不要加 `-I`；
- 「零命中」只能当线索，不能当删除依据。
