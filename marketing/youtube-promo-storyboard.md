# ONYX MUN 2026 — YouTube Promo (30–45s)

**Embed source:** https://onyxmunhyd.in/embed/promo (390×780)  
**Render:** Remotion / Gathrly pipeline · screen-record embed or export frames  
**postMessage API:** `{ type: 'gathrly-promo', scene: 'checkout' }` to switch scenes  
**Upload channel:** @onyxmunhyd (ONYX MUN Hyderabad) or Gathrly YouTube

---

## Video specs

| Field | Value |
|-------|--------|
| **Title** | ONYX MUN 2026 \| Best MUN in Hyderabad \| Register Now |
| **Length** | 35 seconds |
| **Aspect** | 9:16 (1080×1920) primary · 16:9 cut optional |
| **Audio** | Minimal cinematic pulse · no vocals · fade out at 0:33 |
| **Brand** | Black background · gold accent (#c9a227 / #D4AF37) · Cormorant Garamond + Outfit |

---

## Storyboard

| Time | Scene | Visual | On-screen text | Embed scene |
|------|-------|--------|----------------|-------------|
| 0:00–0:05 | **Hero** | Black + gold logo reveal, subtle grain | ONYX MUN 2026 | `landing` (default) |
| 0:05–0:10 | **Tagline** | Hero panel from embed — stats row visible | Best MUN in Hyderabad | `landing` |
| 0:10–0:18 | **Committees** | Fast cuts: 7 committee names over gold divider lines | 7 Committees · DISEC · UNHRC · Lok Sabha · CCC · UNCSW · Press · Illuminati | `landing` → scroll committees |
| 0:18–0:24 | **Dates & venue** | Conference card from embed + map pin | 12–14 June 2026 · Laurus The Universal School, Bowrampet | `landing` |
| 0:24–0:30 | **CTA** | Gold button pulse on Round 1 Apply | Applications Open · Round 1 | `checkout` via postMessage |
| 0:30–0:35 | **End card** | Logo centred on black, gold underline | Register now — **onyxmunhyd.in/round-1** | custom end frame |

---

## Production script (voiceover optional — omit for music-only cut)

```
[0:00] ONYX MUN 2026.
[0:05] Hyderabad's best Model United Nations conference.
[0:10] Seven committees. DISEC. UNHRC. Lok Sabha. Crisis. Press. And more.
[0:18] Twelve to fourteen June. Laurus The Universal School, Bowrampet.
[0:24] Delegate applications are open. Round one.
[0:30] Register now at onyxmunhyd.in slash round-one.
```

---

## Remotion / screen-record workflow

1. Open `https://onyxmunhyd.in/embed/promo` in a 390×780 viewport (Chrome DevTools device mode).
2. Record 0:00–0:24 on scene `landing` (hero auto-animates).
3. At 0:24, postMessage: `iframe.contentWindow.postMessage({ type: 'gathrly-promo', scene: 'checkout' }, '*')`.
4. Composite to 1080×1920 with letterbox or scale-up; add end card at 0:30.
5. Export H.264 · upload to YouTube with metadata below.

---

## YouTube description (paste as-is)

```
ONYX MUN 2026 is Hyderabad's premier Model United Nations conference — 7 committees, 12–14 June at Laurus The Universal School, Bowrampet.

🏛 Best MUN in Hyderabad
📅 12–14 June 2026
📍 Laurus The Universal School, Bowrampet, Hyderabad, Telangana
🎯 7 committees: UNGA-DISEC, CCC, UNHRC, UNCSW, Lok Sabha, International Press, Illuminati

Register now:
→ Delegate Round 1: https://onyxmunhyd.in/round-1
→ Full guide: https://onyxmunhyd.in/best-mun-hyderabad
→ Conference site: https://onyxmunhyd.in

Follow ONYX MUN:
Instagram: https://instagram.com/onyx.mun
X: https://x.com/ONYXMUN
Facebook: https://www.facebook.com/onyx.mun.hyd

Registration powered by Gathrly (https://www.gathrly.in/clients/onyx-mun-2026) · Platform by Ruthwik Reddy (https://www.ruthwikreddy.live/) · onyxmun.hyd@gmail.com

#ONYXMUN #BestMUNHyderabad #MUN2026 #ModelUN #HyderabadMUN #StudentLeadership
```

---

## Tags

ONYX MUN, best MUN Hyderabad, MUN 2026, Model United Nations Telangana, MUN Hyderabad, student MUN India, ONYX MUN 2026, debate conference Hyderabad
