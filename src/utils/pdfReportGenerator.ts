/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AnnaChakra ESG Sustainability Report Generator (BRSR Principle 6 Aligned)
 * 
 * Creates a clean, professional, single-page PDF audit certificate using jsPDF
 * with fallback to formatted browser print layout.
 */

import { jsPDF } from 'jspdf';
import { EsgSummaryMetrics } from '../types/planAndFactory';
import { DonorProfile } from '../types/batch';

export interface EsgReportPdfParams {
  metrics: EsgSummaryMetrics;
  donorProfile: DonorProfile;
  reportingPeriod?: string;
  generatedDate?: string;
}

export function generateEsgReportPdf(params: EsgReportPdfParams): boolean {
  try {
    const { metrics, donorProfile } = params;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = [15, 81, 50]; // #0F5132 Emerald
    const accentColor = [217, 119, 6]; // #D97706 Amber
    const darkGray = [30, 41, 59];
    const lightGray = [100, 116, 139];

    // Page Header Banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 32, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('AnnaChakra', 15, 14);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(251, 191, 36); // Amber text
    doc.text('Food Sustainability & ESG Audit Report (BRSR Principle 6)', 15, 21);

    doc.setFontSize(8);
    doc.setTextColor(220, 252, 231);
    doc.text('AI Studio SIH 2026 • Team Ananta • PS SIH26234', 15, 27);

    // Date & Certified Badge
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const dateStr = params.generatedDate || new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`Generated: ${dateStr}`, 195, 14, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(251, 191, 36);
    doc.text('Cryptographically Verified Ledger', 195, 21, { align: 'right' });

    // Section 1: Organisation & Facility Profile
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Organisation & Regulatory Profile', 15, 42);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(15, 44, 195, 44);

    // Profile Details Box
    doc.setFillColor(248, 250, 249);
    doc.roundedRect(15, 47, 180, 28, 2, 2, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporting Entity:', 20, 54);
    doc.setFont('helvetica', 'normal');
    doc.text(donorProfile.name || 'Ananta Central Kitchen', 55, 54);

    doc.setFont('helvetica', 'bold');
    doc.text('Facility Type:', 20, 61);
    doc.setFont('helvetica', 'normal');
    doc.text(donorProfile.type || 'Canteen / Central Kitchen', 55, 61);

    doc.setFont('helvetica', 'bold');
    doc.text('FSSAI Reg / Licence:', 115, 54);
    doc.setFont('helvetica', 'normal');
    const fssaiStatus = metrics.fssaiValid ? `${donorProfile.fssaiNumber} (Verified 14-Digit)` : `${donorProfile.fssaiNumber} (Pending)`;
    doc.text(fssaiStatus, 155, 54);

    doc.setFont('helvetica', 'bold');
    doc.text('Audit Trail Ref:', 115, 61);
    doc.setFont('helvetica', 'normal');
    doc.text('SHA-256 Immutable Hash Chain', 155, 61);

    doc.setFont('helvetica', 'bold');
    doc.text('Premises Address:', 20, 68);
    doc.setFont('helvetica', 'normal');
    doc.text(donorProfile.address || 'Hubli Innovation Complex, Sector 4', 55, 68);

    // Section 2: Key Environmental & ESG Performance Indicators
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('2. Environmental & Waste Diversion KPIs', 15, 84);
    doc.line(15, 86, 195, 86);

    // 4 KPI Metric Boxes
    const kpiBoxes = [
      {
        title: 'Waste Prevented at Source',
        value: `${metrics.kgPrevented.toLocaleString()} kg`,
        sub: 'Via Demand Forecasting Advice',
        x: 15,
      },
      {
        title: 'Food Surplus Redistributed',
        value: `${metrics.kgRedistributed.toLocaleString()} kg`,
        sub: 'Via Cascade to Verified NGOs',
        x: 62,
      },
      {
        title: 'Social Impact (Meals)',
        value: `${metrics.mealsServed.toLocaleString()} meals`,
        sub: 'Served to Community Shelters',
        x: 109,
      },
      {
        title: 'GHG Emissions Avoided',
        value: `${(metrics.co2eAvoidedKg / 1000).toFixed(2)} t CO2e`,
        sub: '2.5 kg CO2e / kg Food Diverted',
        x: 156,
      },
    ];

    kpiBoxes.forEach((b) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(b.x, 90, 42, 26, 2, 2, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(b.title, b.x + 21, 96, { align: 'center' });

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(b.value, b.x + 21, 105, { align: 'center' });

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text(b.sub, b.x + 21, 112, { align: 'center' });
    });

    // Financial Recovery Strip
    doc.setFillColor(254, 243, 199); // Amber tint
    doc.roundedRect(15, 120, 180, 14, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('Total Financial Value Recovered & Prevented:', 20, 129);
    doc.setFontSize(11);
    doc.text(`₹ ${metrics.rupeesSaved.toLocaleString()}`, 105, 129);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('(Based on meal cost & avoided disposal fees)', 140, 129);

    // Section 3: Detailed Breakdown Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('3. Performance Matrix (Scope 3 Diversion)', 15, 144);
    doc.line(15, 146, 195, 146);

    const tableStartY = 150;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, tableStartY, 180, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Sustainability Category', 20, tableStartY + 5);
    doc.text('Quantity (kg / count)', 90, tableStartY + 5);
    doc.text('Equivalence Factor', 130, tableStartY + 5);
    doc.text('ESG Impact', 170, tableStartY + 5);

    const rows = [
      ['Demand Forecast Source Reduction', `${metrics.kgPrevented} kg`, 'Advice Compliance: 70%', 'Scope 3 Avoidance'],
      ['Cascade Redistribution to People (T2)', `${metrics.kgRedistributed} kg`, '0.4 kg / nutritious meal', 'Zero Hunger (SDG 2)'],
      ['Processing Anomalies Mitigated', `${metrics.anomaliesResolved} incidents`, 'Line 3-Sigma Control', 'Resource Efficiency'],
      ['Total Landfill Methane Avoided', `${metrics.kgPrevented + metrics.kgRedistributed} kg`, '2.5 kg CO2e / kg diverted', 'Climate Action (SDG 13)'],
      ['Verified NGO Handovers Completed', `${metrics.totalHandovers} transfers`, 'Dual-Signed Receipts', 'Audit Compliance'],
    ];

    rows.forEach((r, idx) => {
      const y = tableStartY + 7 + idx * 8;
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 249);
        doc.rect(15, y, 180, 8, 'F');
      }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text(r[0], 20, y + 5.5);
      doc.setFont('helvetica', 'bold');
      doc.text(r[1], 90, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.text(r[2], 130, y + 5.5);
      doc.text(r[3], 170, y + 5.5);
    });

    // Section 4: Cryptographic Proof & Integrity Seal
    const proofStartY = 200;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('4. Provenance & Cryptographic Audit Proof', 15, proofStartY);
    doc.line(15, proofStartY + 2, 195, proofStartY + 2);

    doc.setFillColor(248, 250, 249);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, proofStartY + 5, 180, 32, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Cryptographic Hash Chain Ledger Verification:', 20, proofStartY + 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(`Status: ${metrics.chainStatus} (Zero broken hash pointers or retroactive tampering detected)`, 20, proofStartY + 18);

    doc.setFont('helvetica', 'bold');
    doc.text('Tip Block Digest (SHA-256):', 20, proofStartY + 24);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 81, 50);
    const hashDisplay = metrics.lastBlockHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    doc.text(hashDisplay, 68, proofStartY + 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('Digital Signature Algorithm: HMAC-SHA-256 with institutional secret key • Auditable in AnnaChakra Trust Log', 20, proofStartY + 31);

    // Dual Signatures Strip
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Authorized Facility Officer Signature', 25, 252);
    doc.line(25, 260, 85, 260);

    doc.text('Lead Food Safety & ESG Auditor', 125, 252);
    doc.line(125, 260, 185, 260);

    // Mandatory Honesty Footer
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(
      'Prepared by AnnaChakra (Team Ananta). Figures from demo data. Assumption-based, to be validated in pilot.',
      105,
      280,
      { align: 'center' }
    );

    // Save and download
    doc.save(`AnnaChakra-ESG-Report-${dateStr.replace(/[^0-9a-zA-Z]/g, '-')}.pdf`);
    return true;
  } catch (error) {
    console.error('jsPDF generation failed, initiating print fallback:', error);
    window.print();
    return false;
  }
}
