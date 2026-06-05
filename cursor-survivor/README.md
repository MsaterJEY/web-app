# Cursor Survivor RPG

เกม Survivor RPG ที่ใช้ Cursor เมาส์เป็นอาวุธ — สร้างด้วย React + TypeScript + Vite

## วิธีรัน

```bash
npm install
npm run dev
```

## วิธี build

```bash
npm run build
```

## Deploy บน Vercel

1. Push code ขึ้น GitHub
2. Import repo ใน [vercel.com](https://vercel.com)
3. Vercel จะ auto-detect Vite และ deploy ให้อัตโนมัติ

## วิธีเล่น

- เคลื่อนเมาส์ → อาวุธตาม cursor โจมตีศัตรูที่อยู่ในระยะ
- ศัตรูตาย → ดรอป XP orb → เก็บ XP
- เต็ม XP → เลเวลอัพ → เลือก Skill Card 1 ใบ
- กด ESC หรือ P → Pause

## เทคโนโลยี

- React 18 + TypeScript
- Vite 5
- TailwindCSS
- Zustand (state management)
- Framer Motion (animations)
- HTML5 Canvas (game rendering)
