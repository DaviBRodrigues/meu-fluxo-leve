import { useState, useEffect, useCallback } from 'react';

// Full color palette - controls ALL colors in the UI
export interface ColorPalette {
  name: string;
  label: string;
  // Core
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  // Primary
  primary: string;
  primaryForeground: string;
  // Secondary
  secondary: string;
  secondaryForeground: string;
  // Muted
  muted: string;
  mutedForeground: string;
  // Accent
  accent: string;
  accentForeground: string;
  // Destructive
  destructive: string;
  destructiveForeground: string;
  // Semantic
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  income: string;
  incomeForeground: string;
  expense: string;
  expenseForeground: string;
  // Border/Input
  border: string;
  input: string;
  ring: string;
  // Sidebar
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  // Charts
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

// Default light & dark for each palette preset
export interface PalettePreset {
  name: string;
  label: string;
  emoji: string;
  description: string;
  light: ColorPalette;
  dark: ColorPalette;
}

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    name: 'default',
    label: 'Padrão',
    emoji: '🌿',
    description: 'Verde clássico do Equilibra',
    light: {
      name: 'default', label: 'Padrão',
      background: '210 20% 98%', foreground: '222.2 84% 4.9%',
      card: '0 0% 100%', cardForeground: '222.2 84% 4.9%',
      popover: '0 0% 100%', popoverForeground: '222.2 84% 4.9%',
      primary: '142 76% 36%', primaryForeground: '0 0% 100%',
      secondary: '210 40% 96.1%', secondaryForeground: '222.2 47.4% 11.2%',
      muted: '210 40% 96.1%', mutedForeground: '215.4 16.3% 46.9%',
      accent: '210 40% 96.1%', accentForeground: '222.2 47.4% 11.2%',
      destructive: '0 84.2% 60.2%', destructiveForeground: '210 40% 98%',
      success: '142 76% 36%', successForeground: '0 0% 100%',
      warning: '38 92% 50%', warningForeground: '0 0% 100%',
      income: '142 76% 36%', incomeForeground: '0 0% 100%',
      expense: '0 84.2% 60.2%', expenseForeground: '0 0% 100%',
      border: '214.3 31.8% 91.4%', input: '214.3 31.8% 91.4%', ring: '142 76% 36%',
      sidebarBackground: '0 0% 100%', sidebarForeground: '240 5.3% 26.1%',
      sidebarPrimary: '142 76% 36%', sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '240 4.8% 95.9%', sidebarAccentForeground: '240 5.9% 10%',
      sidebarBorder: '220 13% 91%', sidebarRing: '142 76% 36%',
      chart1: '142 76% 36%', chart2: '221 83% 53%', chart3: '262 83% 58%', chart4: '38 92% 50%', chart5: '0 84% 60%',
    },
    dark: {
      name: 'default', label: 'Padrão',
      background: '224 71% 4%', foreground: '213 31% 91%',
      card: '222 47% 8%', cardForeground: '213 31% 91%',
      popover: '222 47% 8%', popoverForeground: '213 31% 91%',
      primary: '142 76% 42%', primaryForeground: '0 0% 100%',
      secondary: '215 28% 17%', secondaryForeground: '213 31% 91%',
      muted: '215 28% 17%', mutedForeground: '215 20% 65%',
      accent: '215 28% 17%', accentForeground: '213 31% 91%',
      destructive: '0 62% 50%', destructiveForeground: '0 0% 100%',
      success: '142 76% 42%', successForeground: '0 0% 100%',
      warning: '38 92% 50%', warningForeground: '0 0% 100%',
      income: '142 76% 42%', incomeForeground: '0 0% 100%',
      expense: '0 62% 50%', expenseForeground: '0 0% 100%',
      border: '215 28% 17%', input: '215 28% 17%', ring: '142 76% 42%',
      sidebarBackground: '222 47% 6%', sidebarForeground: '213 31% 91%',
      sidebarPrimary: '142 76% 42%', sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '215 28% 17%', sidebarAccentForeground: '213 31% 91%',
      sidebarBorder: '215 28% 17%', sidebarRing: '142 76% 42%',
      chart1: '142 76% 42%', chart2: '221 83% 53%', chart3: '262 83% 58%', chart4: '38 92% 50%', chart5: '0 62% 50%',
    },
  },
  {
    name: 'ocean',
    label: 'Oceano',
    emoji: '🌊',
    description: 'Azuis profundos e ciano fresco',
    light: {
      name: 'ocean', label: 'Oceano',
      background: '200 25% 97%', foreground: '210 50% 10%',
      card: '200 20% 100%', cardForeground: '210 50% 10%',
      popover: '200 20% 100%', popoverForeground: '210 50% 10%',
      primary: '200 80% 44%', primaryForeground: '0 0% 100%',
      secondary: '195 30% 94%', secondaryForeground: '210 40% 15%',
      muted: '195 30% 94%', mutedForeground: '200 15% 50%',
      accent: '185 40% 92%', accentForeground: '210 40% 15%',
      destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
      success: '162 72% 40%', successForeground: '0 0% 100%',
      warning: '38 92% 50%', warningForeground: '0 0% 100%',
      income: '162 72% 40%', incomeForeground: '0 0% 100%',
      expense: '0 84% 60%', expenseForeground: '0 0% 100%',
      border: '200 25% 88%', input: '200 25% 88%', ring: '200 80% 44%',
      sidebarBackground: '200 30% 99%', sidebarForeground: '210 30% 30%',
      sidebarPrimary: '200 80% 44%', sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '195 25% 94%', sidebarAccentForeground: '210 40% 15%',
      sidebarBorder: '200 20% 90%', sidebarRing: '200 80% 44%',
      chart1: '200 80% 44%', chart2: '175 65% 45%', chart3: '220 75% 55%', chart4: '38 92% 50%', chart5: '0 70% 55%',
    },
    dark: {
      name: 'ocean', label: 'Oceano',
      background: '210 55% 6%', foreground: '200 25% 90%',
      card: '210 45% 10%', cardForeground: '200 25% 90%',
      popover: '210 45% 10%', popoverForeground: '200 25% 90%',
      primary: '200 80% 50%', primaryForeground: '0 0% 100%',
      secondary: '210 35% 18%', secondaryForeground: '200 25% 90%',
      muted: '210 35% 18%', mutedForeground: '200 20% 60%',
      accent: '210 30% 20%', accentForeground: '200 25% 90%',
      destructive: '0 65% 52%', destructiveForeground: '0 0% 100%',
      success: '162 72% 45%', successForeground: '0 0% 100%',
      warning: '38 92% 50%', warningForeground: '0 0% 100%',
      income: '162 72% 45%', incomeForeground: '0 0% 100%',
      expense: '0 65% 52%', expenseForeground: '0 0% 100%',
      border: '210 35% 18%', input: '210 35% 18%', ring: '200 80% 50%',
      sidebarBackground: '210 50% 7%', sidebarForeground: '200 25% 85%',
      sidebarPrimary: '200 80% 50%', sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '210 35% 18%', sidebarAccentForeground: '200 25% 90%',
      sidebarBorder: '210 35% 18%', sidebarRing: '200 80% 50%',
      chart1: '200 80% 50%', chart2: '175 65% 50%', chart3: '220 75% 60%', chart4: '38 92% 50%', chart5: '0 65% 52%',
    },
  },
  {
    name: 'forest',
    label: 'Floresta',
    emoji: '🌲',
    description: 'Verdes terra e tons amadeirados',
    light: {
      name: 'forest', label: 'Floresta',
      background: '80 15% 96%', foreground: '100 30% 10%',
      card: '80 10% 100%', cardForeground: '100 30% 10%',
      popover: '80 10% 100%', popoverForeground: '100 30% 10%',
      primary: '145 50% 32%', primaryForeground: '0 0% 100%',
      secondary: '90 20% 93%', secondaryForeground: '100 25% 15%',
      muted: '90 15% 93%', mutedForeground: '100 10% 48%',
      accent: '80 20% 91%', accentForeground: '100 25% 15%',
      destructive: '0 70% 55%', destructiveForeground: '0 0% 100%',
      success: '145 50% 32%', successForeground: '0 0% 100%',
      warning: '35 80% 48%', warningForeground: '0 0% 100%',
      income: '145 50% 32%', incomeForeground: '0 0% 100%',
      expense: '0 70% 55%', expenseForeground: '0 0% 100%',
      border: '90 15% 88%', input: '90 15% 88%', ring: '145 50% 32%',
      sidebarBackground: '80 15% 99%', sidebarForeground: '100 20% 28%',
      sidebarPrimary: '145 50% 32%', sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '90 15% 93%', sidebarAccentForeground: '100 25% 15%',
      sidebarBorder: '90 12% 89%', sidebarRing: '145 50% 32%',
      chart1: '145 50% 32%', chart2: '30 60% 48%', chart3: '100 40% 42%', chart4: '50 70% 48%', chart5: '0 65% 52%',
    },
    dark: {
      name: 'forest', label: 'Floresta',
      background: '120 20% 5%', foreground: '90 15% 88%',
      card: '120 18% 9%', cardForeground: '90 15% 88%',
      popover: '120 18% 9%', popoverForeground: '90 15% 88%',
      primary: '145 50% 40%', primaryForeground: '0 0% 100%',
      secondary: '120 15% 16%', secondaryForeground: '90 15% 88%',
      muted: '120 15% 16%', mutedForeground: '90 10% 58%',
      accent: '120 12% 18%', accentForeground: '90 15% 88%',
      destructive: '0 60% 48%', destructiveForeground: '0 0% 100%',
      success: '145 50% 40%', successForeground: '0 0% 100%',
      warning: '35 80% 48%', warningForeground: '0 0% 100%',
      income: '145 50% 40%', incomeForeground: '0 0% 100%',
      expense: '0 60% 48%', expenseForeground: '0 0% 100%',
      border: '120 15% 16%', input: '120 15% 16%', ring: '145 50% 40%',
      sidebarBackground: '120 20% 6%', sidebarForeground: '90 15% 82%',
      sidebarPrimary: '145 50% 40%', sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '120 15% 16%', sidebarAccentForeground: '90 15% 88%',
      sidebarBorder: '120 15% 16%', sidebarRing: '145 50% 40%',
      chart1: '145 50% 40%', chart2: '30 60% 52%', chart3: '100 40% 48%', chart4: '50 70% 52%', chart5: '0 60% 48%',
    },
  },
  {
    name: 'sunset',
    label: 'Pôr do Sol',
    emoji: '🌅',
    description: 'Laranjas quentes e rosas suaves',
    light: {
      name: 'sunset', label: 'Pôr do Sol',
      background: '30 30% 97%', foreground: '20 50% 10%',
      card: '30 20% 100%', cardForeground: '20 50% 10%',
      popover: '30 20% 100%', popoverForeground: '20 50% 10%',
      primary: '18 85% 52%', primaryForeground: '0 0% 100%',
      secondary: '25 30% 94%', secondaryForeground: '20 40% 15%',
      muted: '25 25% 93%', mutedForeground: '20 15% 50%',
      accent: '340 25% 93%', accentForeground: '20 40% 15%',
      destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
      success: '150 60% 38%', successForeground: '0 0% 100%',
      warning: '45 95% 50%', warningForeground: '0 0% 100%',
      income: '150 60% 38%', incomeForeground: '0 0% 100%',
      expense: '0 84% 60%', expenseForeground: '0 0% 100%',
      border: '25 25% 88%', input: '25 25% 88%', ring: '18 85% 52%',
      sidebarBackground: '30 25% 99%', sidebarForeground: '20 25% 30%',
      sidebarPrimary: '18 85% 52%', sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '25 25% 94%', sidebarAccentForeground: '20 40% 15%',
      sidebarBorder: '25 20% 90%', sidebarRing: '18 85% 52%',
      chart1: '18 85% 52%', chart2: '340 70% 55%', chart3: '45 90% 50%', chart4: '200 65% 50%', chart5: '0 75% 58%',
    },
    dark: {
      name: 'sunset', label: 'Pôr do Sol',
      background: '15 40% 5%', foreground: '25 25% 90%',
      card: '15 35% 9%', cardForeground: '25 25% 90%',
      popover: '15 35% 9%', popoverForeground: '25 25% 90%',
      primary: '18 85% 55%', primaryForeground: '0 0% 100%',
      secondary: '15 25% 17%', secondaryForeground: '25 25% 90%',
      muted: '15 25% 17%', mutedForeground: '20 15% 60%',
      accent: '15 20% 19%', accentForeground: '25 25% 90%',
      destructive: '0 65% 50%', destructiveForeground: '0 0% 100%',
      success: '150 60% 42%', successForeground: '0 0% 100%',
      warning: '45 95% 50%', warningForeground: '0 0% 100%',
      income: '150 60% 42%', incomeForeground: '0 0% 100%',
      expense: '0 65% 50%', expenseForeground: '0 0% 100%',
      border: '15 25% 17%', input: '15 25% 17%', ring: '18 85% 55%',
      sidebarBackground: '15 40% 6%', sidebarForeground: '25 20% 85%',
      sidebarPrimary: '18 85% 55%', sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '15 25% 17%', sidebarAccentForeground: '25 25% 90%',
      sidebarBorder: '15 25% 17%', sidebarRing: '18 85% 55%',
      chart1: '18 85% 55%', chart2: '340 70% 58%', chart3: '45 90% 52%', chart4: '200 65% 55%', chart5: '0 65% 50%',
    },
  },
  {
    name: 'midnight',
    label: 'Meia-Noite',
    emoji: '🌙',
    description: 'Roxos escuros e violetas elegantes',
    light: {
      name: 'midnight', label: 'Meia-Noite',
      background: '260 20% 97%', foreground: '260 50% 10%',
      card: '260 15% 100%', cardForeground: '260 50% 10%',
      popover: '260 15% 100%', popoverForeground: '260 50% 10%',
      primary: '262 72% 50%', primaryForeground: '0 0% 100%',
      secondary: '260 25% 94%', secondaryForeground: '260 35% 15%',
      muted: '260 20% 94%', mutedForeground: '260 12% 50%',
      accent: '280 20% 93%', accentForeground: '260 35% 15%',
      destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
      success: '150 60% 38%', successForeground: '0 0% 100%',
      warning: '38 92% 50%', warningForeground: '0 0% 100%',
      income: '150 60% 38%', incomeForeground: '0 0% 100%',
      expense: '0 84% 60%', expenseForeground: '0 0% 100%',
      border: '260 20% 89%', input: '260 20% 89%', ring: '262 72% 50%',
      sidebarBackground: '260 20% 99%', sidebarForeground: '260 20% 28%',
      sidebarPrimary: '262 72% 50%', sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '260 20% 94%', sidebarAccentForeground: '260 35% 15%',
      sidebarBorder: '260 15% 90%', sidebarRing: '262 72% 50%',
      chart1: '262 72% 50%', chart2: '290 60% 55%', chart3: '230 70% 55%', chart4: '38 92% 50%', chart5: '0 70% 55%',
    },
    dark: {
      name: 'midnight', label: 'Meia-Noite',
      background: '265 50% 4%', foreground: '260 20% 90%',
      card: '265 40% 8%', cardForeground: '260 20% 90%',
      popover: '265 40% 8%', popoverForeground: '260 20% 90%',
      primary: '262 72% 56%', primaryForeground: '0 0% 100%',
      secondary: '265 30% 16%', secondaryForeground: '260 20% 90%',
      muted: '265 30% 16%', mutedForeground: '260 15% 60%',
      accent: '265 25% 18%', accentForeground: '260 20% 90%',
      destructive: '0 62% 50%', destructiveForeground: '0 0% 100%',
      success: '150 60% 42%', successForeground: '0 0% 100%',
      warning: '38 92% 50%', warningForeground: '0 0% 100%',
      income: '150 60% 42%', incomeForeground: '0 0% 100%',
      expense: '0 62% 50%', expenseForeground: '0 0% 100%',
      border: '265 30% 16%', input: '265 30% 16%', ring: '262 72% 56%',
      sidebarBackground: '265 50% 5%', sidebarForeground: '260 20% 85%',
      sidebarPrimary: '262 72% 56%', sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '265 30% 16%', sidebarAccentForeground: '260 20% 90%',
      sidebarBorder: '265 30% 16%', sidebarRing: '262 72% 56%',
      chart1: '262 72% 56%', chart2: '290 60% 60%', chart3: '230 70% 60%', chart4: '38 92% 50%', chart5: '0 62% 50%',
    },
  },
  {
    name: 'rose',
    label: 'Rosé',
    emoji: '🌸',
    description: 'Rosas delicados e tons suaves',
    light: {
      name: 'rose', label: 'Rosé',
      background: '340 20% 97%', foreground: '340 40% 10%',
      card: '340 15% 100%', cardForeground: '340 40% 10%',
      popover: '340 15% 100%', popoverForeground: '340 40% 10%',
      primary: '340 75% 52%', primaryForeground: '0 0% 100%',
      secondary: '340 25% 94%', secondaryForeground: '340 30% 15%',
      muted: '340 20% 94%', mutedForeground: '340 12% 50%',
      accent: '320 20% 93%', accentForeground: '340 30% 15%',
      destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
      success: '150 60% 38%', successForeground: '0 0% 100%',
      warning: '38 92% 50%', warningForeground: '0 0% 100%',
      income: '150 60% 38%', incomeForeground: '0 0% 100%',
      expense: '0 84% 60%', expenseForeground: '0 0% 100%',
      border: '340 20% 89%', input: '340 20% 89%', ring: '340 75% 52%',
      sidebarBackground: '340 20% 99%', sidebarForeground: '340 20% 28%',
      sidebarPrimary: '340 75% 52%', sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '340 20% 94%', sidebarAccentForeground: '340 30% 15%',
      sidebarBorder: '340 15% 90%', sidebarRing: '340 75% 52%',
      chart1: '340 75% 52%', chart2: '280 55% 55%', chart3: '10 70% 55%', chart4: '38 92% 50%', chart5: '200 65% 50%',
    },
    dark: {
      name: 'rose', label: 'Rosé',
      background: '340 35% 5%', foreground: '340 15% 90%',
      card: '340 30% 9%', cardForeground: '340 15% 90%',
      popover: '340 30% 9%', popoverForeground: '340 15% 90%',
      primary: '340 75% 58%', primaryForeground: '0 0% 100%',
      secondary: '340 25% 16%', secondaryForeground: '340 15% 90%',
      muted: '340 25% 16%', mutedForeground: '340 12% 58%',
      accent: '340 20% 18%', accentForeground: '340 15% 90%',
      destructive: '0 62% 50%', destructiveForeground: '0 0% 100%',
      success: '150 60% 42%', successForeground: '0 0% 100%',
      warning: '38 92% 50%', warningForeground: '0 0% 100%',
      income: '150 60% 42%', incomeForeground: '0 0% 100%',
      expense: '0 62% 50%', expenseForeground: '0 0% 100%',
      border: '340 25% 16%', input: '340 25% 16%', ring: '340 75% 58%',
      sidebarBackground: '340 35% 6%', sidebarForeground: '340 15% 85%',
      sidebarPrimary: '340 75% 58%', sidebarPrimaryForeground: '0 0% 100%',
      sidebarAccent: '340 25% 16%', sidebarAccentForeground: '340 15% 90%',
      sidebarBorder: '340 25% 16%', sidebarRing: '340 75% 58%',
      chart1: '340 75% 58%', chart2: '280 55% 60%', chart3: '10 70% 58%', chart4: '38 92% 50%', chart5: '200 65% 55%',
    },
  },
];

const CSS_VAR_MAP: Record<keyof ColorPalette, string> = {
  name: '', label: '',
  background: '--background', foreground: '--foreground',
  card: '--card', cardForeground: '--card-foreground',
  popover: '--popover', popoverForeground: '--popover-foreground',
  primary: '--primary', primaryForeground: '--primary-foreground',
  secondary: '--secondary', secondaryForeground: '--secondary-foreground',
  muted: '--muted', mutedForeground: '--muted-foreground',
  accent: '--accent', accentForeground: '--accent-foreground',
  destructive: '--destructive', destructiveForeground: '--destructive-foreground',
  success: '--success', successForeground: '--success-foreground',
  warning: '--warning', warningForeground: '--warning-foreground',
  income: '--income', incomeForeground: '--income-foreground',
  expense: '--expense', expenseForeground: '--expense-foreground',
  border: '--border', input: '--input', ring: '--ring',
  sidebarBackground: '--sidebar-background', sidebarForeground: '--sidebar-foreground',
  sidebarPrimary: '--sidebar-primary', sidebarPrimaryForeground: '--sidebar-primary-foreground',
  sidebarAccent: '--sidebar-accent', sidebarAccentForeground: '--sidebar-accent-foreground',
  sidebarBorder: '--sidebar-border', sidebarRing: '--sidebar-ring',
  chart1: '--chart-1', chart2: '--chart-2', chart3: '--chart-3', chart4: '--chart-4', chart5: '--chart-5',
};

function applyPalette(palette: ColorPalette) {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
    if (!cssVar) continue;
    const value = palette[key as keyof ColorPalette];
    if (typeof value === 'string') {
      root.style.setProperty(cssVar, value);
    }
  }
}

function clearPalette() {
  const root = document.documentElement;
  for (const cssVar of Object.values(CSS_VAR_MAP)) {
    if (cssVar) root.style.removeProperty(cssVar);
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  const [paletteName, setPaletteNameState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('palette-name') || 'default';
    }
    return 'default';
  });

  const [customPalette, setCustomPaletteState] = useState<{ light: ColorPalette; dark: ColorPalette } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('custom-palette');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  // Get active palette colors
  const getActivePalette = useCallback((): ColorPalette => {
    const isDark = theme === 'dark';
    if (paletteName === 'custom' && customPalette) {
      return isDark ? customPalette.dark : customPalette.light;
    }
    const preset = PALETTE_PRESETS.find(p => p.name === paletteName) || PALETTE_PRESETS[0];
    return isDark ? preset.dark : preset.light;
  }, [theme, paletteName, customPalette]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    applyPalette(getActivePalette());
  }, [theme, paletteName, customPalette, getActivePalette]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const setTheme = useCallback((t: 'dark' | 'light') => setThemeState(t), []);

  const setPalette = useCallback((name: string) => {
    setPaletteNameState(name);
    localStorage.setItem('palette-name', name);
  }, []);

  const setCustom = useCallback((light: ColorPalette, dark: ColorPalette) => {
    const value = { light, dark };
    setCustomPaletteState(value);
    setPaletteNameState('custom');
    localStorage.setItem('custom-palette', JSON.stringify(value));
    localStorage.setItem('palette-name', 'custom');
  }, []);

  const resetPalette = useCallback(() => {
    setPaletteNameState('default');
    setCustomPaletteState(null);
    localStorage.removeItem('custom-palette');
    localStorage.setItem('palette-name', 'default');
    clearPalette();
  }, []);

  return {
    theme, toggleTheme, setTheme,
    paletteName, setPalette,
    customPalette, setCustom,
    activePalette: getActivePalette(),
    resetPalette,
  };
}
