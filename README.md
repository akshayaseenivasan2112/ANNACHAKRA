AI-powered, software-first platform for **institutional kitchens and food processing units** that reduces food waste and redistributes surplus safely, in one loop: **Predict → Track → Route → Prove → Learn**.

| **Event** | Smart India Hackathon 2026 |
| **Problem Statement ID** | SIH26234 |
| **Problem Statement** | AI-Powered Smart Food Waste Reduction and Sustainable Redistribution Ecosystem for Institutional Kitchens and Food Processing Units |
| **Theme** | Agriculture, FoodTech & Rural Development |
| **Category** | Software |
| **Team** | Anantha (Team ID 153558) |


## 1. The problem

Food is wasted when surplus is noticed too late and nobody knows where to send it safely. Food processing units also lose raw material, machine time and energy that never show up as leftovers. Most tools stop at an expiry date or at "send to the nearest NGO".

## 2. Our idea

AnnaChakra treats each batch of food as a living object with a **Food Passport** and a **Spoilage Clock**, then decides its best use while it is still safe.

| Stage | What it does |

| **1. Predict** | Forecasts demand and surplus, with plain advice such as "Cook 12% less rice on Friday" |
| **2. Track** | Live Spoilage Clock per batch from time at temperature, plus a photo freshness check |
| **3. Route** | 5-tier best-use cascade, NGO matching beyond distance, pooled pickups |
| **4. Prove** | Tamper-evident Trust Log, kg saved, meals served, CO2e avoided, ESG-style report |
| **5. Learn** | Outcomes retrain forecasts; factory anomaly and energy insights |

### What makes it different

- **Spoilage Clock**: safety decided by *time at temperature* (Mean Kinetic Temperature / Arrhenius model), not just a printed date.
- **Best-use cascade**: T1 Shelter/NGO → T2 Community kitchen → T3 Discount buyer → T4 Animal feed → T5 Compost/biogas. Zero dumping.
- **Matching beyond distance**: time left, NGO capacity, need, allergen limits, reliability and road time.
- **Food Passport**: temperature, prepared time, expiry, storage, allergens, quantity, nutrition.
- **Multi-donor pooling**: nearby surpluses combined into one pickup.
- **Processing-unit intelligence**: raw-material loss, overproduction, near-date stock, machine downtime, excess energy.
- **Trust Log**: hash-chained handover and temperature records; editing one record breaks the chain.
- **Built for India**: offline-first, WhatsApp/SMS alerts so NGOs need no app, Indian languages, phone-first (no mandatory hardware).

## 3. Architecture

```
 CAPTURE            EDGE                CLOUD AI                  ACT & PROVE
 ───────            ────                ────────                  ───────────
 Phone camera  ──►  Freshness     ──►   Demand forecast     ──►   React PWA dashboard
 QR / manual        classifier          Anomaly detection         WhatsApp / SMS alerts
 Probe thermometer  Spoilage Clock      NGO reliability score     Signed Trust Log
 POS / CSV import   (works offline)     Route optimisation        ESG report (PDF)
 Optional ESP32                         Carbon engine             REST API
        ▲                                                              │
        └──────────────── Learning loop: outcomes retrain models ◄─────┘
```

**Spoilage Clock** = remaining safe shelf-life ÷ time-to-handover

## 4. What is in this repository

This repo contains a **working prototype of the decision logic**. The production architecture (FastAPI, PostgreSQL, OR-Tools, MQTT) is the roadmap and is **not** claimed as built.

| Module | Status | Notes |
|---|---|---|
| Food Passport + live Spoilage Clock | Arrhenius / MKT time-at-temperature accounting, time-warp demo control |
| Photo freshness check (Gemini vision)  | Decision support only; human confirms |
| Best-use cascade + NGO matching  | Weighted scoring, backup NGO if one declines |
| WhatsApp 1-tap accept (simulated) + Trust Log  | Tamper test breaks the hash chain |
| Factory view (anomalies + forecast) |  Synthetic data |
| Pooled route + ESG report  | Illustrative |


## 5. Tech stack

| Layer | Prototype | Production plan |
|---|---|---|
| Frontend | React + Tailwind (AI Studio app) | React PWA with offline cache, Recharts |
| Vision | Gemini vision API | TensorFlow Lite (MobileNetV2) on device |
| Forecasting | Simple model on synthetic data | LightGBM, Prophet |
| Anomaly detection | Rules / Isolation Forest on sample CSV | Isolation Forest, control charts |
| Routing | Simulated | Google OR-Tools (VRP), OpenStreetMap/OSRM |
| Backend | In-browser state + localStorage | FastAPI, PostgreSQL, MQTT |
| Alerts | Simulated WhatsApp screen | WhatsApp Business API / SMS |
| Trust | Hash-chained log | Signed hash-chain log |


## 6. Quick demo test

| Action | Expected result |
|---|---|
| Load demo batch (Vegetable curry, 40 kg, 28 °C) | Clock shows roughly 2 h 36 min left |
| Add a 35 °C reading | Clock drops about 3× faster |
| Add a 5 °C reading | Clock drops much more slowly |
| Time warp ×600 | Safe → Use soon → Urgent → Unsafe within seconds |

## 7. Who pays (business model)

| Party | Pays? | Why |
|---|---|---|
| Factories and large kitchens | Yes, per-site subscription | Less overproduction, yield loss, energy and disposal cost; audit-ready records |
| CSR / listed companies | Yes, per-kg rescue fee | Verified meals-served and CO2e for ESG reporting; covers transport |
| Secondary buyers (feed, biogas, compost) | Yes | Cheap input; small commission |
| **NGOs** | **Free** | They are the outlet, not the customer |

## 9. Safety and honesty notes

- AI freshness scores are **decision support, not a validated safety test**. A human confirms every donation.
- Spoilage thresholds in the prototype are **illustrative defaults**, configurable and to be calibrated against FSSAI guidance in a pilot.
- All data is **synthetic or public sample data**. Impact numbers are assumption-based and to be validated in the pilot.
- Designed around the FSSAI Recovery and Distribution of Surplus Food Regulations, 2019.

## 10. Impact (illustrative)

1,000-meal/day kitchen: 12% surplus of ~0.5 kg per meal × 300 days ≈ 18 t/year → 30% prevented by forecasting ≈ 5.4 t → half of the remainder redirected ≈ 6.3 t ≈ **12,600 meals/year**. To be validated in pilot.

## 11. Roadmap

- **Phase 1 (0–3 months):** pilot with 1 canteen, 1 processing unit, 3 NGOs
- **Phase 2 (3–9 months):** district rollout: hostels, hospitals, caterers
- **Phase 3 (9–18 months):** state level with Food Safety Department and CSR partners
- Edge TFLite freshness model, real ESP32 sensors, real WhatsApp Business API, plate-waste video analysis

## 12. References

- UNEP Food Waste Index Report 2024
- FAO Platform on Food Loss and Waste
- FSSAI: Recovery and Distribution of Surplus Food Regulations, 2019
- SEBI Business Responsibility and Sustainability Reporting (BRSR)
- Google OR-Tools vehicle routing
- Mean kinetic temperature and Q10 shelf-life models (van Boekel, 2008)
- Datasets: Food-101, Fruits-360, open weather and holiday calendars
- IPCC / WRAP emission factors

## 13. Team

**Ananta** — Smart India Hackathon 2026  

