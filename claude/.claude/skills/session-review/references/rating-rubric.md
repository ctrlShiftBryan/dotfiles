# Session Rating Rubric

5 dimensions, weighted composite mapped to 1-5 stars.

## Dimensions

| Dimension | Weight | Metric | What It Measures |
|-----------|--------|--------|-----------------|
| Engagement | 0.25 | Prompt count | How much interaction occurred |
| Tool Depth | 0.20 | Total tool uses | How much actual work was done |
| Output Impact | 0.25 | Git commits | Tangible output produced |
| Cost Efficiency | 0.15 | Prompts per dollar | Value for money |
| Duration Ratio | 0.15 | API time / session time | Active vs idle ratio |

## Thresholds

### Engagement (prompts)
| Range | Score |
|-------|-------|
| 1-5 | 0.2 |
| 6-15 | 0.4 |
| 16-30 | 0.6 |
| 31-50 | 0.8 |
| 51+ | 1.0 |

### Tool Depth (total uses)
| Range | Score |
|-------|-------|
| 1-10 | 0.2 |
| 11-30 | 0.4 |
| 31-60 | 0.6 |
| 61-100 | 0.8 |
| 101+ | 1.0 |

### Output Impact (commits)
| Range | Score |
|-------|-------|
| 0 | 0.0 |
| 1-2 | 0.4 |
| 3-5 | 0.6 |
| 6-10 | 0.8 |
| 11+ | 1.0 |

### Cost Efficiency (prompts/$)
| Range | Score |
|-------|-------|
| <1 | 0.2 |
| 1-3 | 0.4 |
| 3-6 | 0.6 |
| 6-10 | 0.8 |
| 10+ | 1.0 |

### Duration Ratio (api/total)
| Range | Score |
|-------|-------|
| <0.01 | 0.2 |
| 0.01-0.03 | 0.4 |
| 0.03-0.06 | 0.6 |
| 0.06-0.1 | 0.8 |
| 0.1+ | 1.0 |

## Star Mapping

| Raw Score | Stars | Label |
|-----------|-------|-------|
| 0-0.2 | 1 | Minimal |
| 0.2-0.4 | 2 | Light |
| 0.4-0.6 | 3 | Moderate |
| 0.6-0.8 | 4 | High Impact |
| 0.8-1.0 | 5 | Deep Work |
