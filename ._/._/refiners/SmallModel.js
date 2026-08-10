import PageRefiner from "../../PageRefiner.js";

class SmallModel extends PageRefiner.Func {
constructor(){
    super(
        async () => {
            this.Text(`
                <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Universal Web Framework - Complete Pattern Library</title>
    <style>
        /* ============================================
           CSS CUSTOM PROPERTIES (DESIGN TOKENS)
           ============================================ */
        :root {
            /* Color System - Primary Palette */
            --primary-50: #eff6ff;
            --primary-100: #dbeafe;
            --primary-200: #bfdbfe;
            --primary-300: #93c5fd;
            --primary-400: #60a5fa;
            --primary-500: #3b82f6;
            --primary-600: #2563eb;
            --primary-700: #1d4ed8;
            --primary-800: #1e40af;
            --primary-900: #1e3a8a;
            --primary-950: #172554;

            /* Secondary Palette */
            --secondary-50: #f8fafc;
            --secondary-100: #f1f5f9;
            --secondary-200: #e2e8f0;
            --secondary-300: #cbd5e1;
            --secondary-400: #94a3b8;
            --secondary-500: #64748b;
            --secondary-600: #475569;
            --secondary-700: #334155;
            --secondary-800: #1e293b;
            --secondary-900: #0f172a;
            --secondary-950: #020617;

            /* Accent Colors */
            --success-500: #22c55e;
            --success-600: #16a34a;
            --warning-500: #f59e0b;
            --warning-600: #d97706;
            --error-500: #ef4444;
            --error-600: #dc2626;
            --info-500: #3b82f6;
            --info-600: #2563eb;

            /* Neutral Palette */
            --white: #ffffff;
            --black: #000000;
            --gray-50: #f9fafb;
            --gray-100: #f3f4f6;
            --gray-200: #e5e7eb;
            --gray-300: #d1d5db;
            --gray-400: #9ca3af;
            --gray-500: #6b7280;
            --gray-600: #4b5563;
            --gray-700: #374151;
            --gray-800: #1f2937;
            --gray-900: #111827;
            --gray-950: #030712;

            /* Typography */
            --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace;
            
            --font-size-xs: 0.75rem;    /* 12px */
            --font-size-sm: 0.875rem;   /* 14px */
            --font-size-base: 1rem;     /* 16px */
            --font-size-lg: 1.125rem;   /* 18px */
            --font-size-xl: 1.25rem;    /* 20px */
            --font-size-2xl: 1.5rem;    /* 24px */
            --font-size-3xl: 1.875rem;  /* 30px */
            --font-size-4xl: 2.25rem;   /* 36px */
            --font-size-5xl: 3rem;      /* 48px */
            --font-size-6xl: 3.75rem;   /* 60px */
            --font-size-7xl: 4.5rem;    /* 72px */

            --font-weight-light: 300;
            --font-weight-regular: 400;
            --font-weight-medium: 500;
            --font-weight-semibold: 600;
            --font-weight-bold: 700;
            --font-weight-extrabold: 800;

            --line-height-tight: 1.25;
            --line-height-normal: 1.5;
            --line-height-relaxed: 1.75;

            --letter-spacing-tight: -0.025em;
            --letter-spacing-normal: 0;
            --letter-spacing-wide: 0.025em;
            --letter-spacing-wider: 0.05em;

            /* Spacing Scale */
            --space-0: 0;
            --space-1: 0.25rem;   /* 4px */
            --space-2: 0.5rem;    /* 8px */
            --space-3: 0.75rem;   /* 12px */
            --space-4: 1rem;      /* 16px */
            --space-5: 1.25rem;   /* 20px */
            --space-6: 1.5rem;    /* 24px */
            --space-8: 2rem;      /* 32px */
            --space-10: 2.5rem;   /* 40px */
            --space-12: 3rem;     /* 48px */
            --space-16: 4rem;     /* 64px */
            --space-20: 5rem;     /* 80px */
            --space-24: 6rem;     /* 96px */
            --space-32: 8rem;     /* 128px */

            /* Border Radius */
            --radius-none: 0;
            --radius-sm: 0.125rem;    /* 2px */
            --radius-base: 0.25rem;   /* 4px */
            --radius-md: 0.375rem;    /* 6px */
            --radius-lg: 0.5rem;      /* 8px */
            --radius-xl: 0.75rem;     /* 12px */
            --radius-2xl: 1rem;       /* 16px */
            --radius-3xl: 1.5rem;     /* 24px */
            --radius-full: 9999px;

            /* Shadows */
            --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);

            /* Transitions */
            --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
            --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
            --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
            --transition-slower: 500ms cubic-bezier(0.4, 0, 0.2, 1);

            /* Z-Index Scale */
            --z-0: 0;
            --z-10: 10;
            --z-20: 20;
            --z-30: 30;
            --z-40: 40;
            --z-50: 50;
            --z-auto: auto;

            /* Layout */
            --container-max-width: 1280px;
            --container-padding: var(--space-4);
            --sidebar-width: 280px;
            --header-height: 64px;
            --footer-height: 80px;
        }

        /* ============================================
           DARK THEME
           ============================================ */
        [data-theme="dark"] {
            --primary-50: #172554;
            --primary-100: #1e3a8a;
            --primary-200: #1e40af;
            --primary-300: #1d4ed8;
            --primary-400: #2563eb;
            --primary-500: #3b82f6;
            --primary-600: #60a5fa;
            --primary-700: #93c5fd;
            --primary-800: #bfdbfe;
            --primary-900: #dbeafe;
            --primary-950: #eff6ff;

            --secondary-50: #020617;
            --secondary-100: #0f172a;
            --secondary-200: #1e293b;
            --secondary-300: #334155;
            --secondary-400: #475569;
            --secondary-500: #64748b;
            --secondary-600: #94a3b8;
            --secondary-700: #cbd5e1;
            --secondary-800: #e2e8f0;
            --secondary-900: #f1f5f9;
            --secondary-950: #f8fafc;

            --white: #0f172a;
            --black: #f8fafc;
            --gray-50: #030712;
            --gray-100: #111827;
            --gray-200: #1f2937;
            --gray-300: #374151;
            --gray-400: #4b5563;
            --gray-500: #6b7280;
            --gray-600: #9ca3af;
            --gray-700: #d1d5db;
            --gray-800: #e5e7eb;
            --gray-900: #f3f4f6;
            --gray-950: #f9fafb;

            --shadow-xs: 0 1px 2px 0 rgba(255, 255, 255, 0.05);
            --shadow-sm: 0 1px 3px 0 rgba(255, 255, 255, 0.1), 0 1px 2px 0 rgba(255, 255, 255, 0.06);
            --shadow-md: 0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06);
            --shadow-lg: 0 10px 15px -3px rgba(255, 255, 255, 0.1), 0 4px 6px -2px rgba(255, 255, 255, 0.05);
            --shadow-xl: 0 20px 25px -5px rgba(255, 255, 255, 0.1), 0 10px 10px -5px rgba(255, 255, 255, 0.04);
            --shadow-2xl: 0 25px 50px -12px rgba(255, 255, 255, 0.25);
        }

        /* ============================================
           CSS RESET & BASE STYLES
           ============================================ */
        *,
        *::before,
        *::after {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            font-size: 16px;
            scroll-behavior: smooth;
            -webkit-text-size-adjust: 100%;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
        }

        body {
            font-family: var(--font-family-sans);
            font-size: var(--font-size-base);
            line-height: var(--line-height-normal);
            color: var(--gray-900);
            background-color: var(--white);
            transition: background-color var(--transition-base), color var(--transition-base);
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* ============================================
           TYPOGRAPHY SYSTEM
           ============================================ */
        h1, h2, h3, h4, h5, h6 {
            font-weight: var(--font-weight-bold);
            line-height: var(--line-height-tight);
            color: var(--gray-900);
            margin-bottom: var(--space-4);
        }

        h1 { font-size: var(--font-size-4xl); letter-spacing: var(--letter-spacing-tight); }
        h2 { font-size: var(--font-size-3xl); letter-spacing: var(--letter-spacing-tight); }
        h3 { font-size: var(--font-size-2xl); }
        h4 { font-size: var(--font-size-xl); }
        h5 { font-size: var(--font-size-lg); }
        h6 { font-size: var(--font-size-base); }

        p {
            margin-bottom: var(--space-4);
            color: var(--gray-700);
        }

        a {
            color: var(--primary-600);
            text-decoration: none;
            transition: color var(--transition-fast);
        }

        a:hover {
            color: var(--primary-700);
            text-decoration: underline;
        }

        img, video {
            max-width: 100%;
            height: auto;
            display: block;
        }

        /* ============================================
           UTILITY CLASSES (MULTIPLIER PATTERN)
           ============================================ */
        
        /* Display Utilities */
        .d-none { display: none; }
        .d-block { display: block; }
        .d-inline { display: inline; }
        .d-inline-block { display: inline-block; }
        .d-flex { display: flex; }
        .d-inline-flex { display: inline-flex; }
        .d-grid { display: grid; }

        /* Flex Utilities */
        .flex-row { flex-direction: row; }
        .flex-column { flex-direction: column; }
        .flex-wrap { flex-wrap: wrap; }
        .flex-nowrap { flex-wrap: nowrap; }
        .justify-start { justify-content: flex-start; }
        .justify-end { justify-content: flex-end; }
        .justify-center { justify-content: center; }
        .justify-between { justify-content: space-between; }
        .justify-around { justify-content: space-around; }
        .justify-evenly { justify-content: space-evenly; }
        .align-start { align-items: flex-start; }
        .align-end { align-items: flex-end; }
        .align-center { align-items: center; }
        .align-stretch { align-items: stretch; }
        .align-baseline { align-items: baseline; }

        /* Grid Utilities */
        .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
        .grid-cols-5 { grid-template-columns: repeat(5, 1fr); }
        .grid-cols-6 { grid-template-columns: repeat(6, 1fr); }
        .grid-cols-12 { grid-template-columns: repeat(12, 1fr); }
        
        .gap-0 { gap: var(--space-0); }
        .gap-1 { gap: var(--space-1); }
        .gap-2 { gap: var(--space-2); }
        .gap-3 { gap: var(--space-3); }
        .gap-4 { gap: var(--space-4); }
        .gap-6 { gap: var(--space-6); }
        .gap-8 { gap: var(--space-8); }
        .gap-10 { gap: var(--space-10); }
        .gap-12 { gap: var(--space-12); }

        /* Spacing Utilities (Margin & Padding) */
        .m-0 { margin: var(--space-0); }
        .m-1 { margin: var(--space-1); }
        .m-2 { margin: var(--space-2); }
        .m-3 { margin: var(--space-3); }
        .m-4 { margin: var(--space-4); }
        .m-6 { margin: var(--space-6); }
        .m-8 { margin: var(--space-8); }
        .m-10 { margin: var(--space-10); }
        .m-12 { margin: var(--space-12); }

        .mt-0 { margin-top: var(--space-0); }
        .mt-1 { margin-top: var(--space-1); }
        .mt-2 { margin-top: var(--space-2); }
        .mt-3 { margin-top: var(--space-3); }
        .mt-4 { margin-top: var(--space-4); }
        .mt-6 { margin-top: var(--space-6); }
        .mt-8 { margin-top: var(--space-8); }
        .mt-10 { margin-top: var(--space-10); }
        .mt-12 { margin-top: var(--space-12); }
        .mt-16 { margin-top: var(--space-16); }
        .mt-20 { margin-top: var(--space-20); }

        .mb-0 { margin-bottom: var(--space-0); }
        .mb-1 { margin-bottom: var(--space-1); }
        .mb-2 { margin-bottom: var(--space-2); }
        .mb-3 { margin-bottom: var(--space-3); }
        .mb-4 { margin-bottom: var(--space-4); }
        .mb-6 { margin-bottom: var(--space-6); }
        .mb-8 { margin-bottom: var(--space-8); }
        .mb-10 { margin-bottom: var(--space-10); }
        .mb-12 { margin-bottom: var(--space-12); }

        .p-0 { padding: var(--space-0); }
        .p-1 { padding: var(--space-1); }
        .p-2 { padding: var(--space-2); }
        .p-3 { padding: var(--space-3); }
        .p-4 { padding: var(--space-4); }
        .p-6 { padding: var(--space-6); }
        .p-8 { padding: var(--space-8); }
        .p-10 { padding: var(--space-10); }
        .p-12 { padding: var(--space-12); }
        .p-16 { padding: var(--space-16); }
        .p-20 { padding: var(--space-20); }

        /* Text Utilities */
        .text-xs { font-size: var(--font-size-xs); }
        .text-sm { font-size: var(--font-size-sm); }
        .text-base { font-size: var(--font-size-base); }
        .text-lg { font-size: var(--font-size-lg); }
        .text-xl { font-size: var(--font-size-xl); }
        .text-2xl { font-size: var(--font-size-2xl); }
        .text-3xl { font-size: var(--font-size-3xl); }
        .text-4xl { font-size: var(--font-size-4xl); }
        .text-5xl { font-size: var(--font-size-5xl); }
        .text-6xl { font-size: var(--font-size-6xl); }

        .font-light { font-weight: var(--font-weight-light); }
        .font-regular { font-weight: var(--font-weight-regular); }
        .font-medium { font-weight: var(--font-weight-medium); }
        .font-semibold { font-weight: var(--font-weight-semibold); }
        .font-bold { font-weight: var(--font-weight-bold); }
        .font-extrabold { font-weight: var(--font-weight-extrabold); }

        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .text-justify { text-align: justify; }

        /* Color Utilities */
        .text-primary { color: var(--primary-600); }
        .text-secondary { color: var(--secondary-600); }
        .text-success { color: var(--success-600); }
        .text-warning { color: var(--warning-600); }
        .text-error { color: var(--error-600); }
        .text-info { color: var(--info-600); }
        .text-white { color: var(--white); }
        .text-black { color: var(--black); }
        .text-gray { color: var(--gray-600); }

        .bg-primary { background-color: var(--primary-600); }
        .bg-secondary { background-color: var(--secondary-600); }
        .bg-success { background-color: var(--success-600); }
        .bg-warning { background-color: var(--warning-600); }
        .bg-error { background-color: var(--error-600); }
        .bg-info { background-color: var(--info-600); }
        .bg-white { background-color: var(--white); }
        .bg-gray-50 { background-color: var(--gray-50); }
        .bg-gray-100 { background-color: var(--gray-100); }
        .bg-gray-200 { background-color: var(--gray-200); }

        /* Border Utilities */
        .border { border: 1px solid var(--gray-200); }
        .border-0 { border: 0; }
        .border-t { border-top: 1px solid var(--gray-200); }
        .border-b { border-bottom: 1px solid var(--gray-200); }
        .border-l { border-left: 1px solid var(--gray-200); }
        .border-r { border-right: 1px solid var(--gray-200); }

        .rounded-none { border-radius: var(--radius-none); }
        .rounded-sm { border-radius: var(--radius-sm); }
        .rounded { border-radius: var(--radius-base); }
        .rounded-md { border-radius: var(--radius-md); }
        .rounded-lg { border-radius: var(--radius-lg); }
        .rounded-xl { border-radius: var(--radius-xl); }
        .rounded-2xl { border-radius: var(--radius-2xl); }
        .rounded-3xl { border-radius: var(--radius-3xl); }
        .rounded-full { border-radius: var(--radius-full); }

        /* Shadow Utilities */
        .shadow-xs { box-shadow: var(--shadow-xs); }
        .shadow-sm { box-shadow: var(--shadow-sm); }
        .shadow-md { box-shadow: var(--shadow-md); }
        .shadow-lg { box-shadow: var(--shadow-lg); }
        .shadow-xl { box-shadow: var(--shadow-xl); }
        .shadow-2xl { box-shadow: var(--shadow-2xl); }

        /* Width & Height Utilities */
        .w-full { width: 100%; }
        .w-auto { width: auto; }
        .w-1\\/2 { width: 50%; }
        .w-1\\/3 { width: 33.333333%; }
        .w-2\\/3 { width: 66.666667%; }
        .w-1\\/4 { width: 25%; }
        .w-3\\/4 { width: 75%; }

        .h-full { height: 100%; }
        .h-screen { height: 100vh; }
        .h-auto { height: auto; }

        /* Position Utilities */
        .relative { position: relative; }
        .absolute { position: absolute; }
        .fixed { position: fixed; }
        .sticky { position: sticky; }

        .top-0 { top: 0; }
        .right-0 { right: 0; }
        .bottom-0 { bottom: 0; }
        .left-0 { left: 0; }

        /* Overflow Utilities */
        .overflow-hidden { overflow: hidden; }
        .overflow-auto { overflow: auto; }
        .overflow-scroll { overflow: scroll; }
        .overflow-x-auto { overflow-x: auto; }
        .overflow-y-auto { overflow-y: auto; }

        /* Cursor Utilities */
        .cursor-pointer { cursor: pointer; }
        .cursor-not-allowed { cursor: not-allowed; }
        .cursor-default { cursor: default; }

        /* Opacity Utilities */
        .opacity-0 { opacity: 0; }
        .opacity-25 { opacity: 0.25; }
        .opacity-50 { opacity: 0.5; }
        .opacity-75 { opacity: 0.75; }
        .opacity-100 { opacity: 1; }

        /* ============================================
           COMPONENT: CONTAINER
           ============================================ */
        .container {
            width: 100%;
            max-width: var(--container-max-width);
            margin-left: auto;
            margin-right: auto;
            padding-left: var(--container-padding);
            padding-right: var(--container-padding);
        }

        .container-fluid {
            width: 100%;
            padding-left: var(--container-padding);
            padding-right: var(--container-padding);
        }

        /* ============================================
           COMPONENT: BUTTONS (MULTIPLIER SYSTEM)
           ============================================ */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-2);
            padding: var(--space-3) var(--space-6);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            line-height: var(--line-height-tight);
            border: 1px solid transparent;
            border-radius: var(--radius-lg);
            cursor: pointer;
            transition: all var(--transition-base);
            text-decoration: none;
            white-space: nowrap;
            user-select: none;
            -webkit-user-select: none;
        }

        .btn:hover {
            text-decoration: none;
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }

        .btn:active {
            transform: translateY(0);
        }

        .btn:focus-visible {
            outline: 2px solid var(--primary-500);
            outline-offset: 2px;
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        /* Button Variants */
        .btn-primary {
            background-color: var(--primary-600);
            color: var(--white);
            border-color: var(--primary-600);
        }
        .btn-primary:hover {
            background-color: var(--primary-700);
            border-color: var(--primary-700);
            color: var(--white);
        }

        .btn-secondary {
            background-color: var(--secondary-600);
            color: var(--white);
            border-color: var(--secondary-600);
        }
        .btn-secondary:hover {
            background-color: var(--secondary-700);
            border-color: var(--secondary-700);
            color: var(--white);
        }

        .btn-success {
            background-color: var(--success-600);
            color: var(--white);
            border-color: var(--success-600);
        }
        .btn-success:hover {
            background-color: var(--success-500);
            border-color: var(--success-500);
            color: var(--white);
        }

        .btn-warning {
            background-color: var(--warning-600);
            color: var(--white);
            border-color: var(--warning-600);
        }
        .btn-warning:hover {
            background-color: var(--warning-500);
            border-color: var(--warning-500);
            color: var(--white);
        }

        .btn-error {
            background-color: var(--error-600);
            color: var(--white);
            border-color: var(--error-600);
        }
        .btn-error:hover {
            background-color: var(--error-500);
            border-color: var(--error-500);
            color: var(--white);
        }

        .btn-outline {
            background-color: transparent;
            color: var(--primary-600);
            border-color: var(--primary-600);
        }
        .btn-outline:hover {
            background-color: var(--primary-600);
            color: var(--white);
        }

        .btn-ghost {
            background-color: transparent;
            color: var(--gray-700);
            border-color: transparent;
        }
        .btn-ghost:hover {
            background-color: var(--gray-100);
            color: var(--gray-900);
        }

        .btn-link {
            background-color: transparent;
            color: var(--primary-600);
            border-color: transparent;
            padding: 0;
            box-shadow: none;
        }
        .btn-link:hover {
            text-decoration: underline;
            box-shadow: none;
            transform: none;
        }

        /* Button Sizes */
        .btn-xs { padding: var(--space-1) var(--space-2); font-size: var(--font-size-xs); }
        .btn-sm { padding: var(--space-2) var(--space-4); font-size: var(--font-size-sm); }
        .btn-md { padding: var(--space-3) var(--space-6); font-size: var(--font-size-base); }
        .btn-lg { padding: var(--space-4) var(--space-8); font-size: var(--font-size-lg); }
        .btn-xl { padding: var(--space-5) var(--space-10); font-size: var(--font-size-xl); }

        .btn-block { width: 100%; }
        .btn-icon { padding: var(--space-2); border-radius: var(--radius-full); }

        /* ============================================
           COMPONENT: FORMS
           ============================================ */
        .form-group {
            margin-bottom: var(--space-4);
        }

        .form-label {
            display: block;
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            color: var(--gray-700);
            margin-bottom: var(--space-2);
        }

        .form-input,
        .form-select,
        .form-textarea {
            width: 100%;
            padding: var(--space-3) var(--space-4);
            font-size: var(--font-size-base);
            font-family: var(--font-family-sans);
            color: var(--gray-900);
            background-color: var(--white);
            border: 1px solid var(--gray-300);
            border-radius: var(--radius-lg);
            transition: all var(--transition-fast);
            outline: none;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
            border-color: var(--primary-500);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
            color: var(--gray-400);
        }

        .form-input:disabled,
        .form-select:disabled,
        .form-textarea:disabled {
            background-color: var(--gray-100);
            cursor: not-allowed;
            opacity: 0.6;
        }

        .form-error .form-input,
        .form-error .form-select,
        .form-error .form-textarea {
            border-color: var(--error-500);
        }

        .form-error .form-input:focus,
        .form-error .form-select:focus,
        .form-error .form-textarea:focus {
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .form-error-message {
            display: block;
            font-size: var(--font-size-xs);
            color: var(--error-600);
            margin-top: var(--space-1);
        }

        .form-success .form-input,
        .form-success .form-select,
        .form-success .form-textarea {
            border-color: var(--success-500);
        }

        .form-textarea {
            min-height: 100px;
            resize: vertical;
        }

        .form-checkbox,
        .form-radio {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            cursor: pointer;
        }

        .form-checkbox input[type="checkbox"],
        .form-radio input[type="radio"] {
            width: 1rem;
            height: 1rem;
            accent-color: var(--primary-600);
        }

        /* ============================================
           COMPONENT: CARDS
           ============================================ */
        .card {
            background-color: var(--white);
            border: 1px solid var(--gray-200);
            border-radius: var(--radius-xl);
            padding: var(--space-6);
            transition: all var(--transition-base);
        }

        .card:hover {
            box-shadow: var(--shadow-lg);
            transform: translateY(-2px);
        }

        .card-header {
            padding-bottom: var(--space-4);
            margin-bottom: var(--space-4);
            border-bottom: 1px solid var(--gray-200);
        }

        .card-footer {
            padding-top: var(--space-4);
            margin-top: var(--space-4);
            border-top: 1px solid var(--gray-200);
        }

        .card-title {
            font-size: var(--font-size-xl);
            font-weight: var(--font-weight-semibold);
            color: var(--gray-900);
            margin-bottom: var(--space-2);
        }

        .card-text {
            color: var(--gray-600);
            font-size: var(--font-size-sm);
            line-height: var(--line-height-relaxed);
        }

        /* Card Variants */
        .card-primary {
            border-top: 4px solid var(--primary-500);
        }
        .card-success {
            border-top: 4px solid var(--success-500);
        }
        .card-warning {
            border-top: 4px solid var(--warning-500);
        }
        .card-error {
            border-top: 4px solid var(--error-500);
        }

        /* ============================================
           COMPONENT: BADGES
           ============================================ */
        .badge {
            display: inline-flex;
            align-items: center;
            padding: var(--space-1) var(--space-3);
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-semibold);
            line-height: var(--line-height-tight);
            border-radius: var(--radius-full);
            white-space: nowrap;
        }

        .badge-primary {
            background-color: var(--primary-100);
            color: var(--primary-700);
        }
        .badge-secondary {
            background-color: var(--secondary-100);
            color: var(--secondary-700);
        }
        .badge-success {
            background-color: #dcfce7;
            color: var(--success-700);
        }
        .badge-warning {
            background-color: #fef3c7;
            color: var(--warning-700);
        }
        .badge-error {
            background-color: #fee2e2;
            color: var(--error-700);
        }
        .badge-info {
            background-color: #dbeafe;
            color: var(--info-700);
        }

        /* ============================================
           COMPONENT: ALERTS
           ============================================ */
        .alert {
            padding: var(--space-4) var(--space-6);
            border-radius: var(--radius-lg);
            border-left: 4px solid transparent;
            margin-bottom: var(--space-4);
            display: flex;
            align-items: flex-start;
            gap: var(--space-3);
        }

        .alert-info {
            background-color: #eff6ff;
            border-left-color: var(--info-500);
            color: var(--info-700);
        }
        .alert-success {
            background-color: #f0fdf4;
            border-left-color: var(--success-500);
            color: var(--success-700);
        }
        .alert-warning {
            background-color: #fffbeb;
            border-left-color: var(--warning-500);
            color: var(--warning-700);
        }
        .alert-error {
            background-color: #fef2f2;
            border-left-color: var(--error-500);
            color: var(--error-700);
        }

        /* ============================================
           COMPONENT: NAVIGATION
           ============================================ */
        .nav {
            display: flex;
            align-items: center;
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .nav-item {
            position: relative;
        }

        .nav-link {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            padding: var(--space-3) var(--space-4);
            color: var(--gray-700);
            text-decoration: none;
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            border-radius: var(--radius-md);
            transition: all var(--transition-fast);
        }

        .nav-link:hover {
            color: var(--primary-600);
            background-color: var(--primary-50);
            text-decoration: none;
        }

        .nav-link.active {
            color: var(--primary-600);
            background-color: var(--primary-50);
        }

        .nav-vertical {
            flex-direction: column;
        }

        /* ============================================
           COMPONENT: TABLES
           ============================================ */
        .table-container {
            overflow-x: auto;
            border: 1px solid var(--gray-200);
            border-radius: var(--radius-lg);
        }

        .table {
            width: 100%;
            border-collapse: collapse;
            background-color: var(--white);
        }

        .table thead {
            background-color: var(--gray-50);
            border-bottom: 2px solid var(--gray-200);
        }

        .table th {
            padding: var(--space-3) var(--space-4);
            text-align: left;
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-semibold);
            color: var(--gray-600);
            text-transform: uppercase;
            letter-spacing: var(--letter-spacing-wider);
        }

        .table td {
            padding: var(--space-3) var(--space-4);
            font-size: var(--font-size-sm);
            color: var(--gray-700);
            border-bottom: 1px solid var(--gray-100);
        }

        .table tbody tr:hover {
            background-color: var(--gray-50);
        }

        .table-striped tbody tr:nth-child(even) {
            background-color: var(--gray-50);
        }

        /* ============================================
           COMPONENT: MODALS
           ============================================ */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: var(--z-50);
            opacity: 0;
            visibility: hidden;
            transition: all var(--transition-base);
        }

        .modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .modal {
            background-color: var(--white);
            border-radius: var(--radius-2xl);
            padding: var(--space-8);
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: var(--shadow-2xl);
            transform: translateY(-20px);
            transition: transform var(--transition-base);
        }

        .modal-overlay.active .modal {
            transform: translateY(0);
        }

        .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--space-6);
        }

        .modal-title {
            font-size: var(--font-size-xl);
            font-weight: var(--font-weight-semibold);
        }

        .modal-close {
            background: none;
            border: none;
            font-size: var(--font-size-2xl);
            cursor: pointer;
            color: var(--gray-500);
            padding: var(--space-1);
            line-height: 1;
        }

        .modal-close:hover {
            color: var(--gray-700);
        }

        /* ============================================
           COMPONENT: DROPDOWN
           ============================================ */
        .dropdown {
            position: relative;
            display: inline-block;
        }

        .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            z-index: var(--z-30);
            min-width: 200px;
            background-color: var(--white);
            border: 1px solid var(--gray-200);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            padding: var(--space-2) 0;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all var(--transition-fast);
        }

        .dropdown.active .dropdown-menu {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .dropdown-item {
            display: block;
            width: 100%;
            padding: var(--space-2) var(--space-4);
            text-align: left;
            background: none;
            border: none;
            color: var(--gray-700);
            font-size: var(--font-size-sm);
            cursor: pointer;
            transition: background-color var(--transition-fast);
        }

        .dropdown-item:hover {
            background-color: var(--gray-100);
            color: var(--gray-900);
        }

        /* ============================================
           COMPONENT: TABS
           ============================================ */
        .tabs {
            display: flex;
            border-bottom: 2px solid var(--gray-200);
            margin-bottom: var(--space-6);
        }

        .tab {
            padding: var(--space-3) var(--space-6);
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
            color: var(--gray-600);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            cursor: pointer;
            transition: all var(--transition-fast);
        }

        .tab:hover {
            color: var(--gray-900);
        }

        .tab.active {
            color: var(--primary-600);
            border-bottom-color: var(--primary-600);
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        /* ============================================
           COMPONENT: TOOLTIP
           ============================================ */
        .tooltip {
            position: relative;
            display: inline-block;
        }

        .tooltip::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--gray-900);
            color: var(--white);
            padding: var(--space-1) var(--space-3);
            border-radius: var(--radius-md);
            font-size: var(--font-size-xs);
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: all var(--transition-fast);
            pointer-events: none;
        }

        .tooltip:hover::after {
            opacity: 1;
            visibility: visible;
        }

        /* ============================================
           COMPONENT: PROGRESS BAR
           ============================================ */
        .progress {
            width: 100%;
            height: 8px;
            background-color: var(--gray-200);
            border-radius: var(--radius-full);
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            background-color: var(--primary-600);
            border-radius: var(--radius-full);
            transition: width var(--transition-slow);
        }

        .progress-bar-success { background-color: var(--success-600); }
        .progress-bar-warning { background-color: var(--warning-600); }
        .progress-bar-error { background-color: var(--error-600); }

        /* ============================================
           COMPONENT: AVATAR
           ============================================ */
        .avatar {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: var(--radius-full);
            background-color: var(--primary-100);
            color: var(--primary-700);
            font-weight: var(--font-weight-semibold);
            font-size: var(--font-size-sm);
            overflow: hidden;
        }

        .avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .avatar-sm { width: 32px; height: 32px; font-size: var(--font-size-xs); }
        .avatar-lg { width: 48px; height: 48px; font-size: var(--font-size-lg); }
        .avatar-xl { width: 64px; height: 64px; font-size: var(--font-size-xl); }

        /* ============================================
           COMPONENT: SPINNER
           ============================================ */
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid var(--gray-300);
            border-top-color: var(--primary-600);
            border-radius: var(--radius-full);
            animation: spin 0.6s linear infinite;
        }

        .spinner-sm { width: 16px; height: 16px; border-width: 2px; }
        .spinner-lg { width: 32px; height: 32px; border-width: 3px; }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* ============================================
           COMPONENT: SKELETON LOADER
           ============================================ */
        .skeleton {
            background: linear-gradient(90deg, var(--gray-200) 25%, var(--gray-100) 50%, var(--gray-200) 75%);
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s ease-in-out infinite;
            border-radius: var(--radius-md);
        }

        .skeleton-text {
            height: 1rem;
            margin-bottom: var(--space-2);
        }

        .skeleton-title {
            height: 1.5rem;
            width: 60%;
            margin-bottom: var(--space-4);
        }

        .skeleton-avatar {
            width: 48px;
            height: 48px;
            border-radius: var(--radius-full);
        }

        .skeleton-card {
            height: 200px;
        }

        @keyframes skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        /* ============================================
           LAYOUT: HEADER
           ============================================ */
        .header {
            position: sticky;
            top: 0;
            z-index: var(--z-40);
            background-color: var(--white);
            border-bottom: 1px solid var(--gray-200);
            height: var(--header-height);
            display: flex;
            align-items: center;
            padding: 0 var(--space-6);
            box-shadow: var(--shadow-sm);
        }

        .header-brand {
            font-size: var(--font-size-xl);
            font-weight: var(--font-weight-bold);
            color: var(--gray-900);
            text-decoration: none;
        }

        .header-brand:hover {
            text-decoration: none;
            color: var(--primary-600);
        }

        .header-nav {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            margin-left: auto;
        }

        /* ============================================
           LAYOUT: SIDEBAR
           ============================================ */
        .layout {
            display: flex;
            min-height: calc(100vh - var(--header-height));
        }

        .sidebar {
            width: var(--sidebar-width);
            background-color: var(--white);
            border-right: 1px solid var(--gray-200);
            padding: var(--space-6);
            overflow-y: auto;
            position: sticky;
            top: var(--header-height);
            height: calc(100vh - var(--header-height));
        }

        .sidebar-nav {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .sidebar-nav-item {
            margin-bottom: var(--space-2);
        }

        .sidebar-nav-link {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            padding: var(--space-3) var(--space-4);
            color: var(--gray-600);
            text-decoration: none;
            border-radius: var(--radius-lg);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            transition: all var(--transition-fast);
        }

        .sidebar-nav-link:hover {
            background-color: var(--gray-100);
            color: var(--gray-900);
            text-decoration: none;
        }

        .sidebar-nav-link.active {
            background-color: var(--primary-50);
            color: var(--primary-600);
        }

        .main-content {
            flex: 1;
            padding: var(--space-8);
            overflow-y: auto;
        }

        /* ============================================
           LAYOUT: FOOTER
           ============================================ */
        .footer {
            background-color: var(--gray-50);
            border-top: 1px solid var(--gray-200);
            padding: var(--space-8) var(--space-6);
            min-height: var(--footer-height);
        }

        /* ============================================
           LANDING PAGE SPECIFIC STYLES
           ============================================ */
        .hero-section {
            padding: var(--space-20) 0;
            background: linear-gradient(135deg, var(--primary-50) 0%, var(--white) 100%);
        }

        .hero-title {
            font-size: var(--font-size-6xl);
            font-weight: var(--font-weight-extrabold);
            line-height: var(--line-height-tight);
            letter-spacing: var(--letter-spacing-tight);
            background: linear-gradient(to right, var(--primary-600), var(--primary-800));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .hero-subtitle {
            font-size: var(--font-size-xl);
            color: var(--gray-600);
            margin-top: var(--space-6);
            max-width: 600px;
        }

        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: var(--space-8);
            padding: var(--space-16) 0;
        }

        .cta-section {
            background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%);
            color: var(--white);
            padding: var(--space-20) 0;
            text-align: center;
            border-radius: var(--radius-2xl);
            margin: var(--space-16) 0;
        }

        /* ============================================
           DASHBOARD SPECIFIC STYLES
           ============================================ */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: var(--space-6);
            margin-bottom: var(--space-8);
        }

        .stat-card {
            background-color: var(--white);
            border: 1px solid var(--gray-200);
            border-radius: var(--radius-xl);
            padding: var(--space-6);
        }

        .stat-card-value {
            font-size: var(--font-size-3xl);
            font-weight: var(--font-weight-bold);
            color: var(--gray-900);
        }

        .stat-card-label {
            font-size: var(--font-size-sm);
            color: var(--gray-600);
            margin-top: var(--space-2);
        }

        .stat-card-change {
            display: inline-flex;
            align-items: center;
            gap: var(--space-1);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            margin-top: var(--space-2);
        }

        .stat-card-change.positive { color: var(--success-600); }
        .stat-card-change.negative { color: var(--error-600); }

        /* ============================================
           ECOMMERCE SPECIFIC STYLES
           ============================================ */
        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: var(--space-6);
        }

        .product-card {
            background-color: var(--white);
            border: 1px solid var(--gray-200);
            border-radius: var(--radius-xl);
            overflow: hidden;
            transition: all var(--transition-base);
        }

        .product-card:hover {
            box-shadow: var(--shadow-xl);
            transform: translateY(-4px);
        }

        .product-card-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            background-color: var(--gray-100);
        }

        .product-card-body {
            padding: var(--space-4);
        }

        .product-card-title {
            font-size: var(--font-size-lg);
            font-weight: var(--font-weight-semibold);
            margin-bottom: var(--space-2);
        }

        .product-card-price {
            font-size: var(--font-size-2xl);
            font-weight: var(--font-weight-bold);
            color: var(--primary-600);
        }

        .product-card-original-price {
            font-size: var(--font-size-sm);
            color: var(--gray-500);
            text-decoration: line-through;
            margin-left: var(--space-2);
        }

        /* ============================================
           BLOG SPECIFIC STYLES
           ============================================ */
        .blog-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: var(--space-8);
        }

        .blog-card {
            background-color: var(--white);
            border: 1px solid var(--gray-200);
            border-radius: var(--radius-xl);
            overflow: hidden;
            transition: all var(--transition-base);
        }

        .blog-card:hover {
            box-shadow: var(--shadow-lg);
        }

        .blog-card-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }

        .blog-card-body {
            padding: var(--space-6);
        }

        .blog-card-meta {
            display: flex;
            gap: var(--space-4);
            font-size: var(--font-size-sm);
            color: var(--gray-500);
            margin-bottom: var(--space-3);
        }

        /* ============================================
           RESPONSIVE DESIGN
           ============================================ */
        @media (max-width: 1024px) {
            .sidebar {
                display: none;
            }
            
            .hero-title {
                font-size: var(--font-size-4xl);
            }
            
            .grid-cols-4 {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 768px) {
            :root {
                --container-padding: var(--space-3);
            }
            
            .header {
                padding: 0 var(--space-4);
            }
            
            .header-nav {
                gap: var(--space-1);
            }
            
            .hero-title {
                font-size: var(--font-size-3xl);
            }
            
            .hero-subtitle {
                font-size: var(--font-size-lg);
            }
            
            .grid-cols-2,
            .grid-cols-3,
            .grid-cols-4 {
                grid-template-columns: 1fr;
            }
            
            .blog-grid,
            .product-grid {
                grid-template-columns: 1fr;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .modal {
                width: 95%;
                padding: var(--space-6);
            }
        }

        @media (max-width: 480px) {
            .hero-title {
                font-size: var(--font-size-2xl);
            }
            
            .btn {
                width: 100%;
            }
            
            .tabs {
                flex-direction: column;
            }
        }

        /* ============================================
           ANIMATIONS
           ============================================ */
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes scaleIn {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
        }

        .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
        }

        .animate-slide-left {
            animation: slideInLeft 0.5s ease-out;
        }

        .animate-slide-right {
            animation: slideInRight 0.5s ease-out;
        }

        .animate-scale-in {
            animation: scaleIn 0.3s ease-out;
        }

        .animate-pulse {
            animation: pulse 2s ease-in-out infinite;
        }

        /* Stagger animations for lists */
        .stagger-children > *:nth-child(1) { animation-delay: 0.1s; }
        .stagger-children > *:nth-child(2) { animation-delay: 0.2s; }
        .stagger-children > *:nth-child(3) { animation-delay: 0.3s; }
        .stagger-children > *:nth-child(4) { animation-delay: 0.4s; }
        .stagger-children > *:nth-child(5) { animation-delay: 0.5s; }
        .stagger-children > *:nth-child(6) { animation-delay: 0.6s; }
        .stagger-children > *:nth-child(7) { animation-delay: 0.7s; }
        .stagger-children > *:nth-child(8) { animation-delay: 0.8s; }
        .stagger-children > *:nth-child(9) { animation-delay: 0.9s; }
        .stagger-children > *:nth-child(10) { animation-delay: 1.0s; }

        /* ============================================
           PRINT STYLES
           ============================================ */
        @media print {
            .header,
            .sidebar,
            .footer,
            .btn,
            .modal-overlay {
                display: none !important;
            }
            
            body {
                font-size: 12pt;
                color: #000;
                background: #fff;
            }
            
            a {
                text-decoration: underline;
            }
            
            .card {
                border: 1px solid #000;
                box-shadow: none;
                page-break-inside: avoid;
            }
        }

        /* ============================================
           ACCESSIBILITY
           ============================================ */
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }

        :focus-visible {
            outline: 2px solid var(--primary-500);
            outline-offset: 2px;
        }

        /* Reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
            :root {
                --primary-600: #0000ff;
                --gray-200: #000000;
                --gray-600: #000000;
            }
        }
    </style>
</head>
<body>
    <!-- ============================================
         HEADER COMPONENT
         ============================================ -->
    <header class="header">
        <a href="#" class="header-brand">UniversalWeb</a>
        
        <nav class="header-nav">
            <a href="#dashboard" class="nav-link active" data-page="dashboard">Dashboard</a>
            <a href="#landing" class="nav-link" data-page="landing">Landing</a>
            <a href="#ecommerce" class="nav-link" data-page="ecommerce">E-Commerce</a>
            <a href="#blog" class="nav-link" data-page="blog">Blog</a>
            <a href="#portfolio" class="nav-link" data-page="portfolio">Portfolio</a>
            <a href="#social" class="nav-link" data-page="social">Social</a>
            
            <!-- Theme Toggle -->
            <button class="btn btn-ghost btn-icon" onclick="toggleTheme()" aria-label="Toggle theme">
                <span id="theme-icon">🌙</span>
            </button>
            
            <!-- User Dropdown -->
            <div class="dropdown" id="userDropdown">
                <button class="btn btn-ghost" onclick="toggleDropdown('userDropdown')">
                    <div class="avatar avatar-sm">U</div>
                    <span>User</span>
                </button>
                <div class="dropdown-menu">
                    <button class="dropdown-item">Profile</button>
                    <button class="dropdown-item">Settings</button>
                    <button class="dropdown-item">Logout</button>
                </div>
            </div>
        </nav>
        
        <!-- Mobile Menu Button -->
        <button class="btn btn-ghost btn-icon d-none" id="mobileMenuBtn" onclick="toggleMobileMenu()" aria-label="Menu">
            ☰
        </button>
    </header>

    <!-- ============================================
         MAIN LAYOUT
         ============================================ -->
    <div class="layout">
        <!-- Sidebar for Dashboard -->
        <aside class="sidebar" id="sidebar">
            <nav>
                <ul class="sidebar-nav">
                    <li class="sidebar-nav-item">
                        <a href="#overview" class="sidebar-nav-link active">
                            📊 Overview
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="#analytics" class="sidebar-nav-link">
                            📈 Analytics
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="#users" class="sidebar-nav-link">
                            👥 Users
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="#products" class="sidebar-nav-link">
                            📦 Products
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="#orders" class="sidebar-nav-link">
                            🛒 Orders
                        </a>
                    </li>
                    <li class="sidebar-nav-item">
                        <a href="#settings" class="sidebar-nav-link">
                            ⚙️ Settings
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>

        <!-- Main Content Area -->
        <main class="main-content" id="mainContent">
            <!-- Content will be dynamically loaded here -->
        </main>
    </div>

    <!-- ============================================
         MODAL COMPONENT
         ============================================ -->
    <div class="modal-overlay" id="modal">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title" id="modalTitle">Modal Title</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body" id="modalBody">
                Modal content goes here...
            </div>
        </div>
    </div>

    <!-- ============================================
         TOAST NOTIFICATION CONTAINER
         ============================================ -->
    <div id="toastContainer" style="position: fixed; top: 20px; right: 20px; z-index: 9999;"></div>

    <!-- ============================================
         JAVASCRIPT CORE ENGINE
         ============================================ -->
    <script>
        // ============================================
        // UNIVERSAL WEB FRAMEWORK CORE ENGINE
        // ============================================

        // ---- State Management ----
        var AppState = {
            currentPage: "dashboard",
            theme: "light",
            sidebarOpen: true,
            user: null,
            data: {
                dashboard: {},
                products: [],
                posts: [],
                users: []
            },
            ui: {
                modals: {},
                toasts: [],
                loaders: {}
            }
        };

        // ---- Page Renderer System (Multiplier Pattern) ----
        var PageRenderer = {
            dashboard: function() {
                return "<div class=\\"animate-fade-in\\">" +
                    "<h1>Dashboard Overview</h1>" +
                    "<!-- Stats Grid -->" +
                    "<div class=\\"stats-grid stagger-children\\">" +
                        "<div class=\\"stat-card animate-scale-in\\">" +
                            "<div class=\\"stat-card-label\\">Total Revenue</div>" +
                            "<div class=\\"stat-card-value\\">$45,231.89</div>" +
                            "<div class=\\"stat-card-change positive\\">↑ 20.1%</div>" +
                        "</div>" +
                        "<div class=\\"stat-card animate-scale-in\\">" +
                            "<div class=\\"stat-card-label\\">Active Users</div>" +
                            "<div class=\\"stat-card-value\\">2,350</div>" +
                            "<div class=\\"stat-card-change positive\\">↑ 180.1%</div>" +
                        "</div>" +
                        "<div class=\\"stat-card animate-scale-in\\">" +
                            "<div class=\\"stat-card-label\\">Sales</div>" +
                            "<div class=\\"stat-card-value\\">12,234</div>" +
                            "<div class=\\"stat-card-change negative\\">↓ 19%</div>" +
                        "</div>" +
                        "<div class=\\"stat-card animate-scale-in\\">" +
                            "<div class=\\"stat-card-label\\">Pending Orders</div>" +
                            "<div class=\\"stat-card-value\\">573</div>" +
                            "<div class=\\"stat-card-change positive\\">↑ 201 since last hour</div>" +
                        "</div>" +
                    "</div>" +
                    "<!-- Recent Orders Table -->" +
                    "<div class=\\"card mt-8\\">" +
                        "<div class=\\"card-header\\">" +
                            "<h3 class=\\"card-title\\">Recent Orders</h3>" +
                        "</div>" +
                        "<div class=\\"table-container\\">" +
                            "<table class=\\"table table-striped\\">" +
                                "<thead>" +
                                    "<tr>" +
                                        "<th>Order ID</th>" +
                                        "<th>Customer</th>" +
                                        "<th>Product</th>" +
                                        "<th>Amount</th>" +
                                        "<th>Status</th>" +
                                        "<th>Date</th>" +
                                    "</tr>" +
                                "</thead>" +
                                "<tbody>" +
                                    Array.from({length: 5}, function(_, i) {
                                        return "<tr>" +
                                            "<td>#ORD-" + (1000 + i) + "</td>" +
                                            "<td>Customer " + (i + 1) + "</td>" +
                                            "<td>Product " + (i + 1) + "</td>" +
                                            "<td>$" + (Math.random() * 1000).toFixed(2) + "</td>" +
                                            "<td><span class=\\"badge badge-" + ["success", "warning", "info"][i % 3] + "\\">" + ["Completed", "Pending", "Processing"][i % 3] + "</span></td>" +
                                            "<td>" + new Date().toLocaleDateString() + "</td>" +
                                        "</tr>";
                                    }).join("") +
                                "</tbody>" +
                            "</table>" +
                        "</div>" +
                    "</div>" +
                    "<!-- Charts Section (Placeholder) -->" +
                    "<div class=\\"grid-cols-2 gap-6 mt-8\\">" +
                        "<div class=\\"card\\">" +
                            "<h4>Revenue Chart</h4>" +
                            "<div class=\\"skeleton skeleton-card mt-4\\"></div>" +
                        "</div>" +
                        "<div class=\\"card\\">" +
                            "<h4>User Growth</h4>" +
                            "<div class=\\"skeleton skeleton-card mt-4\\"></div>" +
                        "</div>" +
                    "</div>" +
                "</div>";
            },

            landing: function() {
                return "<div class=\\"animate-fade-in\\">" +
                    "<!-- Hero Section -->" +
                    "<section class=\\"hero-section\\">" +
                        "<div class=\\"container text-center\\">" +
                            "<h1 class=\\"hero-title\\">Build Amazing Web Experiences</h1>" +
                            "<p class=\\"hero-subtitle\\">" +
                                "Create stunning, responsive websites with our universal framework." +
                                "Everything you need in one place." +
                            "</p>" +
                            "<div class=\\"mt-8\\">" +
                                "<button class=\\"btn btn-primary btn-lg\\" onclick=\\"openModal('Get Started')\\">" +
                                    "Get Started Free" +
                                "</button>" +
                                "<button class=\\"btn btn-outline btn-lg ml-3\\" onclick=\\"openModal('Learn More')\\">" +
                                    "Learn More" +
                                "</button>" +
                            "</div>" +
                        "</div>" +
                    "</section>" +
                    "<!-- Features Grid -->" +
                    "<section class=\\"container\\">" +
                        "<div class=\\"feature-grid stagger-children\\">" +
                            ["Lightning Fast", "Fully Responsive", "Modern Design", "Easy to Use", "SEO Optimized", "24/7 Support"].map(function(feature, i) {
                                return "<div class=\\"card animate-scale-in\\">" +
                                    "<div class=\\"text-4xl mb-4\\">" + ["⚡", "📱", "🎨", "👍", "🔍", "💬"][i] + "</div>" +
                                    "<h3 class=\\"card-title\\">" + feature + "</h3>" +
                                    "<p class=\\"card-text\\">" +
                                        "Lorem ipsum dolor sit amet, consectetur adipiscing elit." +
                                        "Sed do eiusmod tempor incididunt ut labore." +
                                    "</p>" +
                                "</div>";
                            }).join("") +
                        "</div>" +
                    "</section>" +
                    "<!-- CTA Section -->" +
                    "<section class=\\"container\\">" +
                        "<div class=\\"cta-section\\">" +
                            "<h2 style=\\"color: white;\\">Ready to Get Started?</h2>" +
                            "<p style=\\"color: rgba(255,255,255,0.9);\\" class=\\"mt-4\\">" +
                                "Join thousands of developers building better websites." +
                            "</p>" +
                            "<button class=\\"btn btn-lg mt-6\\" style=\\"background: white; color: var(--primary-600);\\">" +
                                "Start Free Trial" +
                            "</button>" +
                        "</div>" +
                    "</section>" +
                "</div>";
            },

            ecommerce: function() {
                return "<div class=\\"animate-fade-in\\">" +
                    "<h1>Shop Our Products</h1>" +
                    "<!-- Filters -->" +
                    "<div class=\\"d-flex justify-between align-center mb-6\\">" +
                        "<div class=\\"d-flex gap-3\\">" +
                            "<select class=\\"form-select\\" style=\\"width: auto;\\">" +
                                "<option>All Categories</option>" +
                                "<option>Electronics</option>" +
                                "<option>Clothing</option>" +
                                "<option>Home & Garden</option>" +
                            "</select>" +
                            "<select class=\\"form-select\\" style=\\"width: auto;\\">" +
                                "<option>Sort by: Latest</option>" +
                                "<option>Price: Low to High</option>" +
                                "<option>Price: High to Low</option>" +
                            "</select>" +
                        "</div>" +
                        "<span class=\\"text-gray\\">Showing 12 products</span>" +
                    "</div>" +
                    "<!-- Product Grid -->" +
                    "<div class=\\"product-grid stagger-children\\">" +
                        Array.from({length: 8}, function(_, i) {
                            return "<div class=\\"product-card animate-scale-in\\">" +
                                "<div class=\\"skeleton\\" style=\\"height: 200px; border-radius: 0;\\"></div>" +
                                "<div class=\\"product-card-body\\">" +
                                    "<h3 class=\\"product-card-title\\">Product " + (i + 1) + "</h3>" +
                                    "<p class=\\"card-text mb-3\\">Premium quality product description goes here.</p>" +
                                    "<div class=\\"d-flex justify-between align-center\\">" +
                                        "<div>" +
                                            "<span class=\\"product-card-price\\">$" + (Math.random() * 100 + 20).toFixed(2) + "</span>" +
                                            (i % 2 === 0 ? "<span class=\\"product-card-original-price\\">$" + (Math.random() * 150 + 50).toFixed(2) + "</span>" : "") +
                                        "</div>" +
                                        "<button class=\\"btn btn-primary btn-sm\\" onclick=\\"addToCart(" + (i + 1) + ")\\">" +
                                            "Add to Cart" +
                                        "</button>" +
                                    "</div>" +
                                    (i % 2 === 0 ? "<span class=\\"badge badge-error mt-2\\">Sale!</span>" : "") +
                                "</div>" +
                            "</div>";
                        }).join("") +
                    "</div>" +
                    "<!-- Pagination -->" +
                    "<div class=\\"d-flex justify-center gap-2 mt-8\\">" +
                        "<button class=\\"btn btn-outline btn-sm\\">Previous</button>" +
                        "<button class=\\"btn btn-primary btn-sm\\">1</button>" +
                        "<button class=\\"btn btn-outline btn-sm\\">2</button>" +
                        "<button class=\\"btn btn-outline btn-sm\\">3</button>" +
                        "<button class=\\"btn btn-outline btn-sm\\">Next</button>" +
                    "</div>" +
                "</div>";
            },

            blog: function() {
                return "<div class=\\"animate-fade-in\\">" +
                    "<h1>Our Blog</h1>" +
                    "<p class=\\"text-gray mb-8\\">Latest articles and insights from our team.</p>" +
                    "<div class=\\"blog-grid stagger-children\\">" +
                        Array.from({length: 6}, function(_, i) {
                            return "<article class=\\"blog-card animate-scale-in\\">" +
                                "<div class=\\"skeleton\\" style=\\"height: 200px; border-radius: 0;\\"></div>" +
                                "<div class=\\"blog-card-body\\">" +
                                    "<div class=\\"blog-card-meta\\">" +
                                        "<span>📅 " + new Date().toLocaleDateString() + "</span>" +
                                        "<span>👤 Author " + (i + 1) + "</span>" +
                                        "<span>💬 " + Math.floor(Math.random() * 50) + " comments</span>" +
                                    "</div>" +
                                    "<h3 class=\\"card-title\\">Blog Post Title " + (i + 1) + "</h3>" +
                                    "<p class=\\"card-text\\">" +
                                        "Lorem ipsum dolor sit amet, consectetur adipiscing elit." +
                                        "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." +
                                    "</p>" +
                                    "<a href=\\"#\\" class=\\"btn btn-link mt-3\\">Read More →</a>" +
                                "</div>" +
                            "</article>";
                        }).join("") +
                    "</div>" +
                    "<!-- Categories Sidebar (simulated) -->" +
                    "<div class=\\"card mt-8\\">" +
                        "<h4>Categories</h4>" +
                        "<div class=\\"d-flex flex-wrap gap-2 mt-3\\">" +
                            ["Technology", "Design", "Business", "Marketing", "Development", "AI"].map(function(cat) {
                                return "<span class=\\"badge badge-primary\\" style=\\"cursor: pointer;\\">" + cat + "</span>";
                            }).join("") +
                        "</div>" +
                    "</div>" +
                "</div>";
            },

            portfolio: function() {
                return "<div class=\\"animate-fade-in\\">" +
                    "<h1>Our Portfolio</h1>" +
                    "<!-- Filter Tabs -->" +
                    "<div class=\\"tabs\\">" +
                        "<button class=\\"tab active\\">All</button>" +
                        "<button class=\\"tab\\">Web Design</button>" +
                        "<button class=\\"tab\\">Mobile Apps</button>" +
                        "<button class=\\"tab\\">Branding</button>" +
                    "</div>" +
                    "<!-- Portfolio Grid -->" +
                    "<div class=\\"grid-cols-3 gap-6 stagger-children\\">" +
                        Array.from({length: 9}, function(_, i) {
                            return "<div class=\\"card animate-scale-in overflow-hidden\\" style=\\"padding: 0;\\">" +
                                "<div class=\\"skeleton\\" style=\\"height: 250px; border-radius: 0;\\"></div>" +
                                "<div style=\\"padding: var(--space-4);\\">" +
                                    "<h4>Project " + (i + 1) + "</h4>" +
                                    "<p class=\\"text-sm text-gray\\">Web Development</p>" +
                                "</div>" +
                            "</div>";
                        }).join("") +
                    "</div>" +
                "</div>";
            },

            social: function() {
                return "<div class=\\"animate-fade-in\\">" +
                    "<h1>Social Feed</h1>" +
                    "<!-- Create Post -->" +
                    "<div class=\\"card mb-6\\">" +
                        "<div class=\\"d-flex gap-3\\">" +
                            "<div class=\\"avatar\\">U</div>" +
                            "<input type=\\"text\\" class=\\"form-input\\" placeholder=\\"What's on your mind?\\" style=\\"flex: 1;\\">" +
                        "</div>" +
                        "<div class=\\"d-flex gap-2 mt-3\\">" +
                            "<button class=\\"btn btn-ghost btn-sm\\">📷 Photo</button>" +
                            "<button class=\\"btn btn-ghost btn-sm\\">📹 Video</button>" +
                            "<button class=\\"btn btn-ghost btn-sm\\">📍 Location</button>" +
                            "<button class=\\"btn btn-primary btn-sm ml-auto\\">Post</button>" +
                        "</div>" +
                    "</div>" +
                    "<!-- Feed Posts -->" +
                    Array.from({length: 5}, function(_, i) {
                        return "<div class=\\"card mb-4 animate-slide-left\\">" +
                            "<div class=\\"d-flex align-center gap-3 mb-4\\">" +
                                "<div class=\\"avatar\\">U" + (i + 1) + "</div>" +
                                "<div>" +
                                    "<h5 style=\\"margin: 0;\\">User " + (i + 1) + "</h5>" +
                                    "<small class=\\"text-gray\\">" + Math.floor(Math.random() * 24) + "h ago</small>" +
                                "</div>" +
                            "</div>" +
                            "<p>This is a sample social media post. Lorem ipsum dolor sit amet, consectetur adipiscing elit. #webdev #coding</p>" +
                            "<div class=\\"d-flex gap-4 mt-4\\">" +
                                "<button class=\\"btn btn-ghost btn-sm\\">❤️ " + Math.floor(Math.random() * 100) + "</button>" +
                                "<button class=\\"btn btn-ghost btn-sm\\">💬 " + Math.floor(Math.random() * 50) + "</button>" +
                                "<button class=\\"btn btn-ghost btn-sm\\">🔄 Share</button>" +
                            "</div>" +
                        "</div>";
                    }).join("") +
                "</div>";
            }
        };

        // ---- Navigation System ----
        function navigateTo(page) {
            AppState.currentPage = page;
            document.querySelectorAll(".nav-link").forEach(function(link) {
                link.classList.toggle("active", link.dataset.page === page);
            });
            var mainContent = document.getElementById("mainContent");
            if (PageRenderer[page]) {
                mainContent.innerHTML = PageRenderer[page]();
            }
            var sidebar = document.getElementById("sidebar");
            sidebar.style.display = page === "dashboard" ? "block" : "none";
        }

        // ---- Modal System ----
        function openModal(title, content) {
            var modal = document.getElementById("modal");
            document.getElementById("modalTitle").textContent = title;
            document.getElementById("modalBody").textContent = content || "Default modal content";
            modal.classList.add("active");
        }

        function closeModal() {
            document.getElementById("modal").classList.remove("active");
        }

        // ---- Dropdown System ----
        function toggleDropdown(id) {
            var dropdown = document.getElementById(id);
            dropdown.classList.toggle("active");
        }

        // ---- Theme Toggle ----
        function toggleTheme() {
            AppState.theme = AppState.theme === "light" ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", AppState.theme);
            document.getElementById("theme-icon").textContent = AppState.theme === "light" ? "🌙" : "☀️";
            localStorage.setItem("theme", AppState.theme);
        }

        // ---- Toast Notification System ----
        function showToast(message, type) {
            type = type || "info";
            var toastContainer = document.getElementById("toastContainer");
            var toast = document.createElement("div");
            toast.className = "alert alert-" + type + " animate-slide-right";
            toast.style.marginBottom = "10px";
            toast.style.minWidth = "300px";
            toast.innerHTML = "<span>" + message + "</span>" +
                "<button class=\\"btn btn-ghost btn-sm\\" onclick=\\"this.parentElement.remove()\\" style=\\"margin-left: auto;\\">✕</button>";
            toastContainer.appendChild(toast);
            setTimeout(function() {
                toast.style.opacity = "0";
                toast.style.transition = "opacity 0.3s";
                setTimeout(function() { toast.remove(); }, 300);
            }, 3000);
        }

        // ---- Cart Function (Demo) ----
        function addToCart(productId) {
            showToast("Product " + productId + " added to cart!", "success");
        }

        // ---- Mobile Menu Toggle ----
        function toggleMobileMenu() {
            var nav = document.querySelector(".header-nav");
            nav.classList.toggle("d-flex");
        }

        // ---- Form Validation System ----
        function validateForm(formElement) {
            var inputs = formElement.querySelectorAll("input[required], select[required], textarea[required]");
            var isValid = true;
            inputs.forEach(function(input) {
                var formGroup = input.closest(".form-group");
                if (!input.value.trim()) {
                    if (formGroup) formGroup.classList.add("form-error");
                    isValid = false;
                } else {
                    if (formGroup) {
                        formGroup.classList.remove("form-error");
                        formGroup.classList.add("form-success");
                    }
                }
            });
            return isValid;
        }

        // ---- Local Storage Manager ----
        var StorageManager = {
            set: function(key, value) {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (e) {
                    console.error("Storage full or unavailable:", e);
                    return false;
                }
            },
            get: function(key, defaultValue) {
                defaultValue = defaultValue || null;
                try {
                    var item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : defaultValue;
                } catch (e) {
                    console.error("Error reading storage:", e);
                    return defaultValue;
                }
            },
            remove: function(key) {
                localStorage.removeItem(key);
            },
            clear: function() {
                localStorage.clear();
            }
        };

        // ---- API Simulation ----
        var API = {
            fetchData: function(endpoint) {
                return new Promise(function(resolve) {
                    setTimeout(function() {
                        resolve({
                            success: true,
                            data: { message: "Data from " + endpoint }
                        });
                    }, 500);
                });
            },
            fetchProducts: function() {
                return new Promise(function(resolve) {
                    setTimeout(function() {
                        resolve({
                            success: true,
                            data: Array.from({length: 10}, function(_, i) {
                                return {
                                    id: i + 1,
                                    name: "Product " + (i + 1),
                                    price: (Math.random() * 100 + 20).toFixed(2),
                                    category: ["Electronics", "Clothing", "Home"][i % 3]
                                };
                            })
                        });
                    }, 800);
                });
            }
        };

        // ---- Event Delegation System ----
        function setupEventDelegation() {
            document.addEventListener("click", function(e) {
                if (e.target.matches(".nav-link[data-page]")) {
                    e.preventDefault();
                    navigateTo(e.target.dataset.page);
                }
                if (e.target.matches(".sidebar-nav-link")) {
                    e.preventDefault();
                    document.querySelectorAll(".sidebar-nav-link").forEach(function(link) {
                        link.classList.remove("active");
                    });
                    e.target.classList.add("active");
                    showToast("Navigated to " + e.target.textContent.trim(), "info");
                }
                if (e.target.matches(".tab")) {
                    var tabs = e.target.parentElement;
                    tabs.querySelectorAll(".tab").forEach(function(tab) { tab.classList.remove("active"); });
                    e.target.classList.add("active");
                }
                if (!e.target.closest(".dropdown")) {
                    document.querySelectorAll(".dropdown.active").forEach(function(dropdown) {
                        dropdown.classList.remove("active");
                    });
                }
                if (e.target.matches(".modal-overlay")) {
                    closeModal();
                }
            });
        }

        // ---- Responsive Handler ----
        function handleResponsive() {
            var mobileMenuBtn = document.getElementById("mobileMenuBtn");
            if (window.innerWidth <= 768) {
                mobileMenuBtn.classList.remove("d-none");
                document.querySelector(".header-nav").classList.remove("d-flex");
            } else {
                mobileMenuBtn.classList.add("d-none");
                document.querySelector(".header-nav").classList.add("d-flex");
            }
        }

        // ---- Initialize Application ----
        function initApp() {
            var savedTheme = StorageManager.get("theme", "light");
            AppState.theme = savedTheme;
            document.documentElement.setAttribute("data-theme", savedTheme);
            document.getElementById("theme-icon").textContent = savedTheme === "light" ? "🌙" : "☀️";
            setupEventDelegation();
            window.addEventListener("resize", handleResponsive);
            handleResponsive();
            document.addEventListener("keydown", function(e) {
                if (e.key === "Escape") {
                    closeModal();
                    document.querySelectorAll(".dropdown.active").forEach(function(d) { d.classList.remove("active"); });
                }
            });
            navigateTo("dashboard");
            API.fetchProducts().then(function(response) {
                if (response.success) {
                    AppState.data.products = response.data;
                }
            });
            console.log("Universal Web Framework initialized successfully! 🚀");
        }

        window.addEventListener("error", function(e) {
            console.error("Global error caught:", e.error);
            showToast("An error occurred. Please try again.", "error");
        });

        window.addEventListener("unhandledrejection", function(e) {
            console.error("Unhandled promise rejection:", e.reason);
            showToast("Operation failed. Please try again.", "error");
        });

        document.addEventListener("DOMContentLoaded", initApp);

        window.UWF = {
            navigate: navigateTo,
            showToast: showToast,
            openModal: openModal,
            closeModal: closeModal,
            getState: function() { return AppState; },
            storage: StorageManager,
            api: API,
            validateForm: validateForm
        };

        console.log("\\n" +
        "╔══════════════════════════════════════════╗\\n" +
        "║   Universal Web Framework v1.0.0        ║\\n" +
        "║   Ready for Production                 ║\\n" +
        "║   All Systems Operational              ║\\n" +
        "╚══════════════════════════════════════════╝\\n");
    </script>
</body>
</html>
                `)
        }
    )
    
}
}

export default SmallModel