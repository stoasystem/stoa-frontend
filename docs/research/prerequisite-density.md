# 真实课程数据里，前置关系有多密

调研工单：stoa-frontend#470（地图 #469 的子票）。日期：2026-10-22。

数据来源：stoa-backend `main`，提交
[`77e01da`](https://github.com/stoasystem/stoa-backend/tree/77e01dafc48ad1b1a44e0d12567245134e1a6837)
（下文链接都钉在这个提交上），以及 stoa-backend#56 关单评论里贴出的生产数据。
**没有读生产 DynamoDB**，原因和读法见「没能确定的事」。

## 结论

前置关系**很稀，而且浅**。目前只有一个学科（数学，ZAP 六年级备考），没有三角函数，也没有跨学科前置。

- 课程种子里有 19 个现行 unit，前置边只有 7 条。有前置的 unit 占 37%（7/19）。
- 最长的链是 4 颗星、3 条边：分数 u1 → 分数 u2 → 某个 X-u1 → X-u2，X 可以是方程、几何或百分比。
- 12 个 unit 是根，其中 11 个是孤立点，一条边都不连。
- 现在会画出来的星（有课时的 unit）有 10 颗。其中 7 颗有前置，最长链还是 4。
- 「推定掌握」能用的空间很小。19 个 unit 里只有 5 个当过别人的前置，所以不管点亮什么，最多只能推出这 5 个。往回追得最远的星是 `geometrie-u2`（含勾股定理），也只追到 3 个 unit。
- 以前（#56 时的生产数据）的图更密：10 个 unit、11 条边，「文字题」那团星云收口全部分支，`textaufgaben-u2` 能往回追到全部 9 个 unit。今天的提交
  [`d76c9a4`](https://github.com/stoasystem/stoa-backend/commit/d76c9a4b) 把这团星云退役了，图也就变成了一棵很矮的「分数 → 三条支线」，外加一堆孤立点。

对 #469 的含义：规则不能指望靠前置边自动推出一大片。要么让推定掌握承认自己是小范围的（每次最多推 1–3 颗），要么先补前置数据，要么换一个证据来源（入门小测、年级默认），后者 #469 的「学期中途加入的新生」已经提到。地图里「学完三角函数还推荐整数」「想练导数」这两个例子，在真实课程里**没有对应内容**，只能当假设场景用。

## 数据在哪

| 事实 | 来源 |
| --- | --- |
| 前置存在 `UNIT#` 行的 `prerequisite_unit_ids` 属性里，DynamoDB 表 `stoa-main`，`PK=PRACTICE`，`SK=UNIT#<id>` | [`scripts/seed_practice.py` L1036–1038](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/scripts/seed_practice.py#L1036-L1038)、[`backfill_unit_prerequisites.py`](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/scripts/backfill_unit_prerequisites.py)、stoa-backend#56 |
| 仓库里**唯一**的课程内容来源是这个种子脚本：没有 curriculum JSON/CSV，没有迁移数据文件，`schemas/` 和 `evidence/` 里也没有 unit 数据 | 全仓搜 `prerequisite_unit_ids`/`unit_id`，命中都在种子、服务代码和测试里 |
| 种子脚本自己说明：内容是苏黎世长期文理中学入学考试（ZAP）的数学，适用六年级 | [`seed_practice.py` L1–15](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/scripts/seed_practice.py#L1-L15)、[L29–41](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/scripts/seed_practice.py#L29-L41) |
| 现行 topic 由 `TOPIC_BUILDERS` 列出（7 个），退役的由 `RETIRED_BUILDERS` 列出（文字题），退役行写成 `rollout_state: archived` | [L958–963](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/scripts/seed_practice.py#L958-L963)、[L873–955](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/scripts/seed_practice.py#L873-L955) |
| 另外两个学科 id 只出现在别名表里（`deutsch→german`、`englisch→english`），没有任何内容 | [`practice_repo.py` L356–374](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/db/repositories/practice_repo.py#L356-L374) |
| 课时层有 `prerequisite_lesson_ids`，但种子里没有一个课时用到它 | [`curriculum_ops_service.py` L56–58](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/services/curriculum_ops_service.py#L56-L58)，种子的 lessons 里没有这个键 |
| 技能点（#58）之间没有前置关系，技能点只挂在 unit 下面 | [`curriculum_translations.py`](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/services/curriculum_translations.py)、`seed_practice.py` L43–51 |

### 读模型怎么用这些边（影响推定掌握的语义）

- **锁定是「与」**：只要还有一个前置没点亮，就算锁定，见 [`knowledge_mastery_service.py` L349–358](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/services/knowledge_mastery_service.py#L349-L358)、[L197–205](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/services/knowledge_mastery_service.py#L197-L205)。
- **锁定只看明确写出的前置，不看顺序**。代码原话是 locking comes only from a stated relation（L353–354）。所以 unit 的 `order` 不能拿来当前置的替代品。
- 画边时，两端都必须是星图认识的 unit，指向退役或已删除 unit 的边会被丢掉，见 [`knowledge_map_service.py` L466–485](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/services/knowledge_map_service.py#L466-L485)。
- 没有已上线课时的 unit 不会画出来（种子注释 L718–721，以及 #59 的票面）。

## 数字

计算方法：用 `ast` 静态读 `seed_practice.py`（不 import，不连 AWS），取出每个 builder 的 `units` 和 `lessons` 字面量，按 `prerequisite_unit_ids` 建有向图，再求入度、出度、根、最长链（经过的节点数）和每个 unit 的祖先集合（传递闭包）。#56 的生产快照是手抄进来的。脚本全文在文末附录。

图中的一条边 `A → B` 表示「A 是 B 的前置」。一个 unit 的「祖先」就是从它一路往回能追到的所有前置，也就是点亮它之后最多能推定掌握的那些 unit。

### 三个视角的总表

| | A. #56 生产快照（2026-10-08） | B. 种子现行版，所有现行 unit | C. 种子现行版，只算会画出来的 unit |
| --- | --- | --- | --- |
| 学科数 | 1（数学） | 1 | 1 |
| unit 数 | 10 | 19 | 10 |
| 前置边 | 11 | 7 | 7 |
| 边 / unit | 1.10 | 0.37 | 0.70 |
| 有前置的 unit | 9（90%） | 7（37%） | 7（70%） |
| 根（没有前置） | 1 | 12 | 3 |
| 其中孤立点（一条边都不连） | 0 | 11 | 2 |
| 最长链（节点数 / 边数） | 6 / 5 | 4 / 3 | 4 / 3 |
| 最大入度 | 2 | 1 | 1 |
| 最大出度 | 3（`brueche-u2`） | 3（`brueche-u2`） | 3 |
| 跨 topic 的边 | 6 | 3 | 3 |
| 跨学科的边 | 0 | 0 | 0 |
| 每个 unit 平均祖先数 | 3.10 | 0.84 | 1.60 |
| 能被推定的 unit（当过别人前置的） | 9 | 5 | 5 |

B 和 C 的区别：zahlen（4 个）、groessen-u1、geometrie-u3/u4、daten（2 个），一共 9 个 unit 今天刚加进种子，还没有课时。它们的练习要等 #106 的课程工作流来补，补上之前不会画出来。这 9 个**全是孤立点**。

### 种子现行版的边（全部 7 条）

```
brueche-u1 → brueche-u2
brueche-u2 → gleichungen-u1 → gleichungen-u2
brueche-u2 → geometrie-u1   → geometrie-u2
brueche-u2 → prozentrechnung-u1 → prozentrechnung-u2
```

其余 12 个现行 unit 没有前置。里面 `brueche-u1` 是唯一一个有后继的根，另外 11 个是孤立点：

`zahlen-u1..u4`、`geometrie-u3`、`geometrie-u4`、`groessen-u1..u3`、`daten-u1`、`daten-u2`。

退役的 `textaufgaben-u1/u2` 在种子里写的是 `prerequisite_unit_ids: []`，加上 `rollout_state: archived`。

### #56 时的生产边（全部 11 条）

上面 7 条全都在，再加上文字题收口的 4 条：

```
gleichungen-u2, prozentrechnung-u2 → textaufgaben-u1
textaufgaben-u1, geometrie-u2      → textaufgaben-u2
```

也就是 #56 评论里那句「分数是根，方程 / 几何 / 百分比三条并行支线，文字题收口」。

### 每个 unit 往回能追多远（种子现行版）

| unit | 链深（节点数） | 祖先数 | 祖先 |
| --- | --- | --- | --- |
| `geometrie-u2`（体积、勾股定理） | 4 | 3 | `brueche-u1`、`brueche-u2`、`geometrie-u1` |
| `gleichungen-u2` | 4 | 3 | `brueche-u1`、`brueche-u2`、`gleichungen-u1` |
| `prozentrechnung-u2` | 4 | 3 | `brueche-u1`、`brueche-u2`、`prozentrechnung-u1` |
| `geometrie-u1`、`gleichungen-u1`、`prozentrechnung-u1` | 3 | 2 | `brueche-u1`、`brueche-u2` |
| `brueche-u2` | 2 | 1 | `brueche-u1` |
| 其余 12 个 | 1 | 0 | — |

### 「正弦和余弦」往回追能覆盖多少

**真实课程里没有正弦和余弦**，也没有任何三角函数或导数内容。全仓搜 `trigonometr|sinus|cosinus|kosinus|ableitung`，在内容里零命中；命中的 `math.sin` 都是布局脚本在算坐标。这套课程是六年级的 ZAP 备考，三角函数要到中学高年级才学。

拿真实图里位置最接近「中段知识点」的星来代替：

- 种子现行版：`geometrie-u2` 往回追 3 个 unit，占其余 18 个现行 unit 的 17%。往回追到的只有分数和「面积与周长」，追不到同样显然是基础的「Zahlen und Rechnen」（数与计算），因为数据里没有这条边。
- #56 生产快照：最深的 `textaufgaben-u2` 能追到全部 9 个 unit（100%）。中段的 `geometrie-u2` 也是 3 个（33%）。

所以就算按「点亮一颗中段星，就把它的所有祖先推定为掌握」这种最激进的规则，在现行数据上一次最多也只能推出 3 颗星。

## 对「推定掌握」的影响

1. **可推定的范围有上限，而且很低。** 只有当过别人前置的 unit 才会被推定，现行数据里只有 5 个：`brueche-u1`、`brueche-u2`、`geometrie-u1`、`gleichungen-u1`、`prozentrechnung-u1`。19 个现行 unit 里有 14 个（74%）不管学生点亮什么都推不出来。
2. **被推定的几乎总是分数。** 7 条边里有 4 条从 `brueche-*` 出发，任何「推定掌握」在今天的数据上，基本等于「推定会分数」。
3. **孤立点占了一半以上（11/19）。** 新加的 zahlen、groessen、daten、geometrie-u3/u4 都没有前置，也不是别人的前置。在这些星云里，靠前置推定什么也推不出来，要靠别的证据，比如小测、年级默认或老师指定。
4. **图会变，而且变化不小。** 两周之内（10-08 到 10-22），边数从 11 降到 7，最长链从 6 降到 4，原因是退役了一团星云。规则如果依赖「链有多深」，就会跟着内容编辑大起大落。规则最好只看直接的前置，或者明确只追有限的几跳。
5. **边是编辑写出来的，不是从教学法推出来的。** 例如「Zahlen und Rechnen」（自然数与小数运算）没有被写成分数的前置，`groessen-u2`（钱和价格）也不以百分比为前置，后端的判定又刻意不看顺序。所以如果要让推定掌握有用，**补前置数据**本身就是一项工作，应该在 stoa-backend 开 issue，用管理端 `PATCH /admin/curriculum/units/{unit_id}`（#56）维护，而不是等前端规则自己猜。
6. **推定只能沿着「与」往回推。** 锁定要求所有前置都点亮，所以点亮 B 意味着 B 的每个前置都被跳过或掌握了。往回推所有祖先，跟锁定的语义一致。反过来不成立：点亮 A 不能推出 B。

## 没能确定的事

- **生产 DynamoDB 现在的实际内容。** 我没有用 AWS 凭据去读。有三个已知的不确定点：
  1. 今天的提交 `d76c9a4`（19 个 unit、退役文字题）有没有在生产上重跑过种子。种子要操作员的 SSO 会话才能跑，见 `seed_practice.py` L1059–1063。没跑的话，生产还是 #56 的 10 个 unit、11 条边。
  2. #56 之后有没有人用管理端 PATCH 改过前置边。
  3. #106 的课程工作流有没有给新 unit 加上课时（加上之后，它们才会进入视角 C）。

  要读真实数据，可以走以下任意一条：
  - 表 `stoa-main`（`eu-central-2`），`PK = PRACTICE`、`SK begins_with UNIT#`，读每行的 `prerequisite_unit_ids` 和 `rollout_state`。`backfill_unit_prerequisites.py` 不带 `--apply` 就是只读报告。
  - `GET /practice/knowledge-map?subjectId=math` 的 `edges[]` 和 `points[]`（#59），这是学生实际看到的图。
  - 管理端 catalog 里的 `prerequisiteUnitIds`。

  拿到数据以后，用文末的脚本换掉输入就能重算同一组数字。
- **种子重跑会覆盖人工改动。** 种子用的是 `put_item` 整行写（L1066–1068），所以重跑种子会把管理端 PATCH 过的前置边覆盖回种子里的值。这一点会影响「真实数据以谁为准」，值得在后端确认。

## 附录：计算脚本

在 stoa-backend 检出目录的上一级运行：`python -I density.py <stoa-backend 路径>`。

```python
import ast, sys
from collections import defaultdict
from functools import lru_cache
from pathlib import Path

SAFE = (ast.Dict, ast.List, ast.Constant, ast.JoinedStr, ast.FormattedValue,
        ast.Name, ast.Load, ast.Tuple)

def seed_units(backend):
    tree = ast.parse((backend / "scripts/seed_practice.py").read_text(encoding="utf-8"))
    funcs = {n.name: n for n in tree.body if isinstance(n, ast.FunctionDef)}
    builders = {n.targets[0].id: [e.id for e in n.value.elts] for n in tree.body
                if isinstance(n, ast.Assign) and isinstance(n.targets[0], ast.Name)
                and n.targets[0].id in ("TOPIC_BUILDERS", "RETIRED_BUILDERS")}
    units, lessons = [], []
    for group, names in builders.items():
        for name in names:
            env = {"RETIRED": "archived"}
            for s in funcs[name].body:
                if not (isinstance(s, ast.Assign) and isinstance(s.targets[0], ast.Name)):
                    continue
                t = s.targets[0].id
                if t in ("tid", "sid", "gl", "tt"):
                    env[t] = ast.literal_eval(s.value)
                if t in ("units", "lessons"):
                    assert all(isinstance(n, SAFE) for n in ast.walk(s.value))
                    rows = eval(compile(ast.Expression(s.value), name, "eval"), {"__builtins__": {}}, env)
                    for r in rows:
                        r["_group"] = group
                    (units if t == "units" else lessons).extend(rows)
    return units, lessons

def report(graph, topic_of, subject_of):
    nodes = sorted(graph)
    edges = [(p, u) for u in nodes for p in graph[u] if p in graph]
    dependents = defaultdict(list)
    for p, u in edges:
        dependents[p].append(u)
    @lru_cache(None)
    def ancestors(u):
        out = set()
        for p in graph[u]:
            if p in graph:
                out |= {p} | ancestors(p)
        return frozenset(out)
    @lru_cache(None)
    def depth(u):
        return 1 + max((depth(p) for p in graph[u] if p in graph), default=0)
    roots = [u for u in nodes if not graph[u]]
    print("units", len(nodes), "edges", len(edges),
          "with prerequisite", sum(1 for u in nodes if graph[u]),
          "roots", len(roots), "isolated", sum(1 for u in roots if u not in dependents),
          "longest chain (nodes)", max(depth(u) for u in nodes),
          "cross-topic", sum(topic_of[p] != topic_of[u] for p, u in edges),
          "cross-subject", sum(subject_of[p] != subject_of[u] for p, u in edges),
          "inferable", len(dependents))
    for u in nodes:
        print(u, depth(u), sorted(ancestors(u)))

units, lessons = seed_units(Path(sys.argv[1]))
topic_of = {u["unit_id"]: u["topic_id"] for u in units}
subject_of = {u["unit_id"]: u["subject_id"] for u in units}
live = {u["unit_id"]: u["prerequisite_unit_ids"] for u in units
        if u["_group"] == "TOPIC_BUILDERS" and u.get("rollout_state") != "archived"}
taught = {l["unit_id"] for l in lessons if l.get("rollout_state") != "archived"}
report(live, topic_of, subject_of)                                         # 视角 B
report({k: v for k, v in live.items() if k in taught}, topic_of, subject_of)  # 视角 C
```

视角 A 的输入是 #56 评论里那张表，手抄成 `{unit_id: [前置…]}` 后同样交给 `report`。
