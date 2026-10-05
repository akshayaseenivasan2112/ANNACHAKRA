import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Users,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

const README_CONTENT = `# AnnaChakra — AI-Powered Food-Waste Loop (SIH 2026, PS SIH26234)

**Team Ananta** • Smart India Hackathon 2026 • Problem Statement: SIH26234

AnnaChakra runs the complete closed-loop food waste reduction cycle: **Predict, Track, Route, Prove, Learn**. It is designed around the **Food Safety and Standards Authority of India (FSSAI) Recovery and Distribution of Surplus Food Regulations, 2019**, eliminating institutional and industrial food waste through dynamic biochemical modeling, cascade matching, and cryptographic auditability.

---

## 1. How to Run the Demo in 5 Steps

1. **Step 1: Check Demand Forecast (Predict — Plan Tab)**
   - View 8 weeks of synthetic canteen data.
   - Observe Friday's explainable advice card: *"Cook 12% less rice due to lower expected attendance and rain forecast."*
   - Change tomorrow's expected attendance or weather toggles to watch the forecast and MAPE update in real time.

2. **Step 2: Track Live Food Passports (Track — Batches Tab)**
   - Click *"Load demo batch"* to load the official Vegetable curry batch (40 kg, Cooked).
   - Inspect the live **Arrhenius Mean Kinetic Temperature (MKT)** Spoilage Clock countdown.
   - Use the **Time Warp (60x or 600x)** control in the header to simulate fast-forwarding time and watch safe hours deplete.
   - Click *"Add photo"* to test the Gemini 2.5 Flash visual freshness check (or use the one-click sample photo button).

3. **Step 3: Route via the 5-Tier Cascade (Route — Match Tab)**
   - Review the live 5-tier evaluation:
     - **T1 In-house reuse**
     - **T2 People (shelter, community kitchen, orphanage)**
     - **T3 Secondary buyer**
     - **T4 Animal feed**
     - **T5 Biogas/compost**
   - Notice why the nearest shelter (2 km) loses to the top-scoring receiver due to capacity and reliability.
   - View the **Pooled-Pickup Route Map** saving 46% vehicle mileage across 3 donors and 2 shelters.

4. **Step 4: Dispatch & Verify Handover (Route / Prove — Handover Tab)**
   - Launch the interactive smartphone dispatch preview (simulated WhatsApp alert).
   - Test the *"Decline"* flow to observe automatic fallback escalation, then click *"Accept"*.
   - At the Handover Desk, verify the 4-digit pickup code, log core food temperature (with supervisor safety override if breached), and generate a signed digital receipt.

5. **Step 5: Verify Audit Ledger & ESG Impact (Prove / Learn — Trust Log, Factory & Impact Tabs)**
   - Open **Trust Log**: Verify the SHA-256 cryptographic hash chain and Trust Score (90+). Click *"Simulate Tampering"* to watch tampered blocks turn red, then click *"Restore Original"*.
   - Open **Factory**: Monitor the 10,000 biscuit packet/day line with rolling 3-sigma control charts. Route near-date stock directly into the cascade.
   - Open **Impact**: Review avoided CO2e, meals served, and export the SEBI BRSR-aligned sustainability PDF report.

---

## 2. Real vs. Simulated in this Demo

| Subsystem | What is REAL in this Demo | What is SIMULATED for Browser Demo |
| :--- | :--- | :--- |
| **Spoilage Clock** | **REAL**: Exact Arrhenius differential equation and Mean Kinetic Temperature (MKT) integration across temperature intervals. | Ambient room temperatures can be stepped manually or fast-forwarded via Time Warp. |
| **Vision Freshness** | **REAL**: Live @google/genai (Gemini 2.5 Flash) vision inference with structured JSON output + local downscaling. | Works offline with sample fallback images if no API key is provided. |
| **Cascade Matching** | **REAL**: 5-tier multi-factor ranking algorithm evaluating time slack, capacity, hunger need, reliability, and distance. | 9 fictional Bengaluru receivers clearly labelled *"Fictional demo data"*. |
| **Trust Log Ledger** | **REAL**: Cryptographic SHA-256 hash chaining, HMAC-SHA256 signatures, and live tampering detection in JavaScript. | Client-side in-memory & localStorage persistence rather than distributed nodes. |
| **WhatsApp Dispatch** | **REAL**: Exact message copywriting, URL encoding for WhatsApp Web API, pickup verification logic. | Interactive modal smartphone preview simulates receiver and donor phones. |
| **Factory Telemetry** | **REAL**: Rolling mean and standard deviation (3-sigma) statistical control charts, anomaly flagging. | Browser simulation loop updates telemetry every 3 seconds (pilot connects via MQTT). |
| **Vehicle Routing** | **REAL**: Nearest-neighbour cluster heuristic calculating separate vs. pooled trip mileage savings. | Pilot uses Google OR-Tools VRP engine with real-world OpenStreetMap road networks. |

---

## 3. Technology Stack

### A. Demo Tech Stack (Current Browser Applet)
- **Frontend Framework**: React 19 SPA with TypeScript
- **Styling & Design System**: Tailwind CSS (clean institutional theme, #0F5132 emerald / #D97706 amber palette)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (ComposedChart, Control Charts, Line & Area)
- **Computer Vision**: Google Gen AI SDK (@google/genai, Gemini 2.5 Flash) with offline fallback
- **Cryptographic Security**: Web Crypto API (SubtleCrypto SHA-256 & HMAC-SHA-256)
- **PDF Generation**: Client-side jsPDF with tabular formatting
- **State Management**: React Hooks + LocalStorage offline-first synchronization

### B. Pilot Tech Stack (Production Roadmap from SIH Deck)
- **IoT Edge Sensing**: ESP32 microcontrollers with DS18B20 digital waterproof probes & DHT22 sensors; TFLite Micro for on-device edge anomaly classification.
- **Predictive AI**: Prophet & LightGBM trained on 12+ months institutional POS canteen data.
- **Anomaly Detection Engine**: Isolation Forest & autoencoders for complex multi-sensor industrial plants.
- **Vehicle Routing Engine (VRP)**: Google OR-Tools Vehicle Routing Problem with OpenStreetMap routing and traffic matrices.
- **Backend & Database**: FastAPI (Python 3.11) + PostgreSQL / TimescaleDB on Google Cloud SQL.
- **Messaging Integration**: Meta WhatsApp Business Cloud API with interactive reply buttons and SMS failover.
- **Mobile Client**: Progressive Web App (PWA) with offline Service Worker support and biometric authentication.

---

## 4. Hardware Levels (L0 to L2)

- **Level 0 (L0) — Zero Hardware**: Standard smartphone browser manual entry + existing kitchen probe thermometer. (Cost: ₹0)
- **Level 1 (L1) — Smartphone Camera**: Staff phone camera for visual freshness scoring & plate-waste estimation. (Cost: ₹0)
- **Level 2 (L2) — IoT Telemetry**: Continuous ESP32 microcontrollers logging cold storage temperatures over MQTT. (Cost: < ₹1,200/unit)

---

## 5. Team Ananta Credits
- **Event**: Smart India Hackathon (SIH 2026)
- **Problem Statement**: SIH26234
- **Team**: Team Ananta
- **Core Principle**: AI gives decision support. A human confirms every donation. Handover before spoilage, storage checks logged.
`;

export const ReadmeTab: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleDownload = () => {
    try {
      const blob = new Blob([README_CONTENT], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'AnnaChakra-README.md');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download README.md', e);
    }
  };

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(README_CONTENT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#0F5132]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                System Documentation & Evaluation Guide
              </h2>
              <span className="text-xs text-gray-500 font-medium">
                SIH 2026 • PS SIH26234 • Team Ananta
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gray-600" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-[#0F5132] hover:bg-[#14663f] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>Export README.md</span>
          </button>
        </div>
      </div>

      {/* Structured Card View */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 sm:p-10 space-y-8 text-gray-800 leading-relaxed text-sm">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-emerald-100 text-[#0F5132] font-black text-xs uppercase tracking-wider font-mono">
            SECTION 01
          </div>
          <h3 className="text-lg font-black text-gray-900">
            How to Run the Demo in 5 Steps (Judge Quick Guide)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
              <span className="text-xs font-black text-[#0F5132] block">1. Predict (Plan Tab)</span>
              <p className="text-xs text-gray-600">
                Check Friday's advice card to cook 12% less rice. Tweak tomorrow's attendance or weather to watch live recalculations with 6.8% MAPE.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
              <span className="text-xs font-black text-[#0F5132] block">2. Track (Batches Tab)</span>
              <p className="text-xs text-gray-600">
                Inspect the Vegetable curry batch (40 kg). Use Header Time Warp (60x/600x) to observe rapid Arrhenius kinetic depletion. Test camera freshness.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
              <span className="text-xs font-black text-[#0F5132] block">3. Route (Match Tab)</span>
              <p className="text-xs text-gray-600">
                Observe the 5-tier Cascade Ladder. See why nearest shelter (2 km) loses to best fit due to capacity/reliability. Inspect the Pooled Route map.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
              <span className="text-xs font-black text-[#0F5132] block">4. Handover (Handover Tab)</span>
              <p className="text-xs text-gray-600">
                Test WhatsApp dispatch, trigger Decline to watch backup escalation, then Accept with 4-digit code and core temperature verification.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 md:col-span-2 space-y-1">
              <span className="text-xs font-black text-[#0F5132] block">5. Prove & Learn (Trust Log, Factory & Impact)</span>
              <p className="text-xs text-gray-600">
                Test SHA-256 tamper detection on Trust Log. Route near-date stock from Factory 3-sigma control charts. Download BRSR ESG sustainability PDF.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Real vs Simulated */}
        <section className="space-y-3 pt-4 border-t border-gray-100">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-black text-xs uppercase tracking-wider font-mono">
            SECTION 02
          </div>
          <h3 className="text-lg font-black text-gray-900">
            What is REAL in this Demo vs. SIMULATED for Prototype
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200 rounded-2xl overflow-hidden">
              <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Feature</th>
                  <th className="p-3 text-emerald-800">Real in this Demo</th>
                  <th className="p-3 text-amber-800">Simulated in Prototype</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr>
                  <td className="p-3 font-bold text-gray-900">Arrhenius Spoilage Clock</td>
                  <td className="p-3 text-emerald-700">Calculates exact kinetic decay from temperature readings</td>
                  <td className="p-3 text-gray-500">Accelerated clock speeds (Time Warp 60x/600x)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-gray-900">Vision Freshness & Waste</td>
                  <td className="p-3 text-emerald-700">Gemini 2.5 Flash visual inference API with JSON parsing</td>
                  <td className="p-3 text-gray-500">Offline sample fallback buttons for offline evaluation</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-gray-900">Cascade Redistribution</td>
                  <td className="p-3 text-emerald-700">Live 5-tier multi-factor score (time, capacity, need, distance)</td>
                  <td className="p-3 text-gray-500">9 fictional Bengaluru receivers</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-gray-900">Cryptographic Trust Log</td>
                  <td className="p-3 text-emerald-700">SHA-256 hash chaining, HMAC-SHA256, tamper detection</td>
                  <td className="p-3 text-gray-500">In-memory & localStorage store (production uses distributed DB)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-gray-900">WhatsApp Dispatch</td>
                  <td className="p-3 text-emerald-700">Interactive phone preview, real WhatsApp Web URL generator</td>
                  <td className="p-3 text-gray-500">Simulated WhatsApp phone preview modal</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-gray-900">Factory Telemetry</td>
                  <td className="p-3 text-emerald-700">Rolling 3-sigma control charts and anomaly flagging</td>
                  <td className="p-3 text-gray-500">Browser simulator updating every 3 seconds (pilot uses MQTT)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-gray-900">Pooled Pickup Route</td>
                  <td className="p-3 text-emerald-700">Nearest-neighbour heuristic calculating 46% mileage cut</td>
                  <td className="p-3 text-gray-500">Pilot uses Google OR-Tools VRP with OpenStreetMap</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Tech Stacks */}
        <section className="space-y-4 pt-4 border-t border-gray-100">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-black text-xs uppercase tracking-wider font-mono">
            SECTION 03
          </div>
          <h3 className="text-lg font-black text-gray-900">
            Technology Stack: Demo vs Pilot Roadmap
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Current Applet Stack
              </h4>
              <ul className="text-xs space-y-1.5 text-gray-600">
                <li>• <strong>React 19 & TypeScript:</strong> Single-page architecture</li>
                <li>• <strong>Tailwind CSS:</strong> Institutional high-contrast design system</li>
                <li>• <strong>Recharts:</strong> Interactive time-series & control charts</li>
                <li>• <strong>@google/genai:</strong> Gemini 2.5 Flash for vision intelligence</li>
                <li>• <strong>Web Crypto API:</strong> Native browser SHA-256 hashing</li>
                <li>• <strong>jsPDF:</strong> In-browser BRSR ESG PDF report rendering</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                Pilot Production Stack (SIH Deck)
              </h4>
              <ul className="text-xs space-y-1.5 text-emerald-900">
                <li>• <strong>Edge Hardware:</strong> ESP32 microcontrollers + DS18B20 digital probes</li>
                <li>• <strong>Edge ML:</strong> TensorFlow Lite Micro for on-device anomaly classification</li>
                <li>• <strong>Predictive Models:</strong> LightGBM & Prophet on institutional order data</li>
                <li>• <strong>Logistics Engine:</strong> Google OR-Tools VRP + OpenStreetMap</li>
                <li>• <strong>Backend & DB:</strong> FastAPI (Python) + TimescaleDB on Cloud SQL</li>
                <li>• <strong>Notifications:</strong> Meta WhatsApp Business Cloud API with SMS fallback</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Credits & Regulatory Note */}
        <section className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-gray-500">
          <div className="space-y-1">
            <span className="font-extrabold text-gray-900 block">
              Developed by Team Ananta • SIH 2026 (Problem Statement SIH26234)
            </span>
            <p className="text-[11px] text-gray-500">
              Designed around the Food Safety and Standards Authority of India (FSSAI) Recovery and Distribution of Surplus Food Regulations, 2019.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#0F5132] font-extrabold text-[11px]">
              AI Decision Support • Human Handover
            </span>
          </div>
        </section>

      </div>
    </div>
  );
};
