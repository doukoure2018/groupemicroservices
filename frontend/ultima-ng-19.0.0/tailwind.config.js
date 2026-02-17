/** @type {import('tailwindcss').Config} */
import PrimeUI from 'tailwindcss-primeui';

export default {
    darkMode: ['selector', '[class*="app-dark"]'],
    content: ['./index.html', './src/**/*.{html,js,ts}', './public/**/*.json'],
    plugins: [PrimeUI],
    theme: {
        screens: {
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            '2xl': '1920px'
        },
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
            },
            keyframes: {
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in-down': {
                    '0%': { opacity: '0', transform: 'translateY(-20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in-left': {
                    '0%': { opacity: '0', transform: 'translateX(-30px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                'fade-in-right': {
                    '0%': { opacity: '0', transform: 'translateX(30px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(50px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-12px)' },
                },
                'float-slow': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '0.8' },
                },
                'draw-line': {
                    '0%': { width: '0%' },
                    '100%': { width: '75%' },
                },
                'spin-slow': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
                'marker-drop': {
                    '0%': { opacity: '0', transform: 'translateY(-20px) scale(0.5)' },
                    '60%': { opacity: '1', transform: 'translateY(4px) scale(1.1)' },
                    '80%': { transform: 'translateY(-2px) scale(0.95)' },
                    '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
                'ping-ring': {
                    '0%': { transform: 'scale(1)', opacity: '0.6' },
                    '100%': { transform: 'scale(2.5)', opacity: '0' },
                },
            },
            animation: {
                'fade-in-up': 'fade-in-up 0.7s ease-out forwards',
                'fade-in-down': 'fade-in-down 0.6s ease-out forwards',
                'fade-in-left': 'fade-in-left 0.7s ease-out forwards',
                'fade-in-right': 'fade-in-right 0.7s ease-out forwards',
                'scale-in': 'scale-in 0.5s ease-out forwards',
                'slide-up': 'slide-up 0.8s ease-out forwards',
                float: 'float 4s ease-in-out infinite',
                'float-slow': 'float-slow 6s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
                'draw-line': 'draw-line 1.5s ease-out forwards',
                'spin-slow': 'spin-slow 20s linear infinite',
                'marker-drop': 'marker-drop 0.6s ease-out forwards',
                'ping-ring': 'ping-ring 1.5s ease-out infinite',
            },
        },
    }
};
