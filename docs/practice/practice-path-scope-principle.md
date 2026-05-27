# Practice Path Scope Principle

## English

Practice Path is designed as a general middle-school and high-school learning challenge system.

The equation path is only the first demo content package. It is used to demonstrate the interaction model, lesson structure, hint flow, Learning Chat transition, teacher support escalation, and parent visibility.

All frontend types, routes, components, mock data, and API contracts must remain subject-agnostic and topic-agnostic. They must not hard-code equations as the only possible learning path.

## Chinese

Practice Path 的目标是成为覆盖初高中主要学科知识点的学习闯关系统。

方程路径只是第一套 demo 内容包，用于演示 lesson 结构、hint flow、Learning Chat 转化、老师接入和家长可见性。

前端类型、路由、组件、mock data 和 API contract 必须保持学科无关、主题无关，不允许把方程硬编码为唯一学习路径。

## Canonical Content Hierarchy

```text
Practice Path
  -> Subject
  -> Grade level
  -> Topic
  -> Unit
  -> Lesson
  -> Challenge
```

## Current Demo Hierarchy

```text
Practice Path
  -> Mathematics
  -> Lower Secondary
  -> Equations
  -> Linear equations
  -> Solving two-step equations
  -> Challenge 1 / Challenge 2 / Challenge 3
```

## Future Expansion Examples

These examples describe intended future expansion areas. They are not implemented content.

Mathematics:

- Equations
- Functions
- Geometry
- Fractions
- Probability
- Statistics
- Trigonometry

Physics:

- Motion
- Force
- Energy
- Electricity
- Waves

Chemistry:

- Atoms
- Reactions
- Acids and bases
- Stoichiometry

Biology:

- Cells
- Genetics
- Human body
- Ecology

## Implementation Rule

Use subject/topic-based structures such as:

```text
subjectId: mathematics
gradeLevel: lower_secondary
topicId: equations
```

Avoid product architecture such as:

```text
Practice Path = Equations
EquationPracticePage
EquationPath
/equations
```

