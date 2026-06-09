/**
 * Fine Computers Portal — Design System Constants
 * All visual tokens as plain JS. Import and use as inline style values.
 * Nothing here depends on any build tool.
 */
import type React from 'react'

/* ── Palette ──────────────────────────────────────────────────── */
export const C = {
  bg:          '#FAFAF8',
  sidebar:     '#0A0A0A',
  orange:      '#F97316',
  orangeDark:  '#EA580C',
  orangeLight: '#FFF7ED',
  orangeMid:   '#FFEDD5',
  teal:        '#0D9488',
  tealLight:   '#CCFBF1',
  white:       '#FFFFFF',
  border:      '#F0EEE8',
  inputBorder: '#E4E2DC',
  text:        '#0A0A0A',
  body:        '#3F3F46',
  muted:       '#A1A1AA',
  muted2:      '#F5F2EC',
  destructive: '#EF4444',
  destructiveBg: '#FEE2E2',
  successBg:   '#ECFDF5',
  successText: '#047857',
  warningBg:   '#FFFBEB',
  warningText: '#B45309',
} as const

/* ── Typography sizes ─────────────────────────────────────────── */
export const T = {
  xs:   { fontSize: '11px', lineHeight: '16px' } as React.CSSProperties,
  sm:   { fontSize: '13px', lineHeight: '18px' } as React.CSSProperties,
  base: { fontSize: '14px', lineHeight: '20px' } as React.CSSProperties,
  md:   { fontSize: '15px', lineHeight: '22px' } as React.CSSProperties,
  lg:   { fontSize: '16px', lineHeight: '24px' } as React.CSSProperties,
  xl:   { fontSize: '18px', lineHeight: '26px' } as React.CSSProperties,
  '2xl':{ fontSize: '22px', lineHeight: '30px' } as React.CSSProperties,
  '3xl':{ fontSize: '28px', lineHeight: '36px' } as React.CSSProperties,
} as const

/* ── Reusable style objects ───────────────────────────────────── */
export const S: Record<string, React.CSSProperties> = {
  /* Cards */
  card: {
    backgroundColor: '#FFFFFF',
    border:          '1px solid #F0EEE8',
    borderRadius:    '20px',
    boxShadow:       '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardPad: {
    backgroundColor: '#FFFFFF',
    border:          '1px solid #F0EEE8',
    borderRadius:    '20px',
    boxShadow:       '0 2px 8px rgba(0,0,0,0.06)',
    padding:         '20px',
  },
  cardSm: {
    backgroundColor: '#FFFFFF',
    border:          '1px solid #F0EEE8',
    borderRadius:    '14px',
    boxShadow:       '0 2px 8px rgba(0,0,0,0.06)',
    padding:         '16px',
  },

  /* Page header strip */
  pageHeader: {
    backgroundColor: '#FFFFFF',
    borderBottom:    '1px solid #F0EEE8',
    padding:         '20px 24px 16px',
    flexShrink:      0,
  },
  pageTitle: {
    fontSize:   '20px',
    fontWeight: 700,
    color:      '#0A0A0A',
    lineHeight: 1.2,
  },
  pageSubtitle: {
    fontSize:   '13px',
    color:      '#A1A1AA',
    marginTop:  '3px',
    lineHeight: 1.4,
  },

  /* Buttons */
  btn: {
    display:         'inline-flex',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             '6px',
    height:          '36px',
    padding:         '0 16px',
    borderRadius:    '8px',
    fontSize:        '13px',
    fontWeight:      600,
    cursor:          'pointer',
    transition:      'background-color 150ms, box-shadow 150ms, transform 100ms',
    whiteSpace:      'nowrap',
    border:          '1px solid transparent',
  },
  btnPrimary: {
    backgroundColor: '#F97316',
    color:           '#FFFFFF',
    boxShadow:       '0 2px 8px rgba(249,115,22,0.25)',
  },
  btnOutline: {
    backgroundColor: '#FFFFFF',
    color:           '#3F3F46',
    border:          '1px solid #E4E2DC',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    color:           '#3F3F46',
  },
  btnSm: {
    height:   '30px',
    padding:  '0 10px',
    fontSize: '12px',
  },
  btnLg: {
    height:   '44px',
    padding:  '0 20px',
    fontSize: '15px',
  },
  btnIcon: {
    width:   '32px',
    height:  '32px',
    padding: 0,
  },

  /* Inputs */
  input: {
    width:           '100%',
    height:          '40px',
    padding:         '0 12px',
    borderRadius:    '8px',
    border:          '1px solid #E4E2DC',
    backgroundColor: '#FFFFFF',
    fontSize:        '14px',
    color:           '#0A0A0A',
    outline:         'none',
    transition:      'border-color 150ms, box-shadow 150ms',
  },
  inputLg: {
    height: '44px',
    fontSize: '15px',
  },
  textarea: {
    width:           '100%',
    padding:         '10px 12px',
    borderRadius:    '8px',
    border:          '1px solid #E4E2DC',
    backgroundColor: '#FFFFFF',
    fontSize:        '14px',
    color:           '#0A0A0A',
    outline:         'none',
    resize:          'vertical',
    lineHeight:      1.5,
    transition:      'border-color 150ms, box-shadow 150ms',
  },

  /* Badges */
  badge: {
    display:      'inline-flex',
    alignItems:   'center',
    gap:          '3px',
    padding:      '2px 8px',
    borderRadius: '99px',
    fontSize:     '11px',
    fontWeight:   600,
    whiteSpace:   'nowrap',
  },

  /* Loading / empty states */
  centered: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '64px 24px',
    textAlign:      'center',
    gap:            '12px',
  },

  /* Divider */
  divider: {
    height:          '1px',
    backgroundColor: '#F0EEE8',
    border:          'none',
    flexShrink:      0,
  },
}
