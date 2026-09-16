<div align="center">

# onyx-mun

**A static HTML/CSS/JS project for the ONYX MUN 2026 website, showcasing the conference brand and committees, collecting delegate/OC/EB/priority applications, handling UPI payment instructions, and providing policy and allocation information.**

This project solves the problem of creating a website for the ONYX MUN 2026 conference, which requires a clean and modern design, easy-to-use application forms, and a seamless payment experience. The project uses a combination of HTML, CSS, and JavaScript to create a responsive and interactive website.

[Source](https://github.com/ruthwwikreddy/onyx-mun) · Built by [Ruthwik Reddy](https://www.ruthwikreddy.live/)

MIT licensed · Utilizes Supabase for form submissions and data management

</div>

---

## Table of contents

1. [What onyx-mun does](#1-what-onyx-mun-does)
2. [Architecture](#2-architecture)
3. [Key Features](#3-key-features)
4. [Prerequisites](#4-prerequisites)
5. [Quick start](#5-quick-start)
6. [Environment variables](#6-environment-variables)
7. [Project Structure](#7-project-structure)
8. [Known Limitations](#8-known-limitations)
9. [Future Improvements](#9-future-improvements)
10. [License and credits](#10-license-and-credits)

---

## 1. What onyx-mun does

| Capability | Detail |
|---|---|
| Collects delegate applications | Uses HTML forms and JavaScript to collect delegate information |
| Handles UPI payment instructions | Utilizes Supabase to manage payment data and instructions |
| Provides policy and allocation information | Displays relevant information to delegates and organizers |

## 2. Architecture

```
+---------------+
|  HTML/CSS    |
+---------------+
       |
       |
       v
+---------------+
|  JavaScript  |
|  (onyx.js)    |
+---------------+
       |
       |
       v
+---------------+
|  Supabase    |
|  (form submissions) |
+---------------+
```

## 3. Key Features
- Responsive design for easy viewing on various devices
- Easy-to-use application forms for delegates and organizers
- Seamless payment experience using UPI

## 4. Prerequisites
- Node.js for development and testing
- Supabase account for form submissions and data management

## 5. Quick start

```bash
git clone https://github.com/ruthwwikreddy/onyx-mun.git
cd onyx-mun
npm install
npm start
```

## 6. Environment variables
None required

## 7. Project Structure
```
onyx-mun/
index.html
committees.html
allocations.html
policy.html
round-1.html
oc-application.html
eb-application.html
priority-round.html
admin.html
404.html
committees/
disec.html
ccc.html
unhrc.html
uncsw.html
loksabha.html
press.html
illuminati.html
hcc.html
supabase/
config.toml
migrations/
20260524_fix_delegate_applications.sql
20260621_rate_limiting.sql
assets/
onyx.css
onyx-hifi.css
onyx-forms.css
onyx-embed.css
onyx-embed.js
onyx.js
onyx-upi.js
...
```

## 8. Known Limitations
- Limited customization options for the Supabase form submissions
- No support for multiple payment gateways

## 9. Future Improvements
- Implementing a more robust payment gateway integration
- Adding more customization options for the Supabase form submissions

## 10. License and credits

Released under the **MIT License**.

Designed and engineered by **[Ruthwik Reddy](https://www.ruthwikreddy.live/)** · [github.com/ruthwwikreddy/onyx-mun](https://github.com/ruthwwikreddy/onyx-mun)
