import re

with open('src/lib/api.ts', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'export interface TrendingSkillDto \{(.*?)\}'
def repl(m):
    inner = m.group(1)
    inner = inner.replace('name: string;', 'skillName?: string;\n  name?: string;')
    inner = inner.replace('sessionCount: number;', 'sessionCount?: number;\n  totalSessions?: number;')
    return 'export interface TrendingSkillDto {' + inner + '}'

content = re.sub(pattern, repl, content, flags=re.DOTALL)

with open('src/lib/api.ts', 'w', encoding='utf-8') as f:
    f.write(content)
