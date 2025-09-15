/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
		spotlight: "spotlight 2s ease .75s 1 forwards",
        shimmer: "shimmer 8s infinite",
		        "spin-around": "spin-around calc(var(--speed) * 2) infinite linear",
        magicslide: "magicslide var(--speed) ease-in-out infinite alternate",
      },
      keyframes: {
		        spotlight: {
          "0%": {
            opacity: 0,
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: 1,
            transform: "translate(-50%,-40%) scale(1)",
          },
        },
		"spin-around": {
          "0%": {
            transform: "translateZ(0) rotate(0)",
          },
          "15%, 35%": {
            transform: "translateZ(0) rotate(90deg)",
          },
          "65%, 85%": {
            transform: "translateZ(0) rotate(270deg)",
          },
          "100%": {
            transform: "translateZ(0) rotate(360deg)",
          },
        },
        magicslide: {
          to: {
            transform: "translate(calc(100cqw - 100%), 0)",
          },
        },
        shimmer: {
          "0%, 90%, 100%": {
            "background-position": "calc(-100% - var(--shimmer-width)) 0",
          },
          "30%, 60%": {
            "background-position": "calc(100% + var(--shimmer-width)) 0",
          },
          "100%": {
            opacity: 1,
            transform: "translate(-50%,-40%) scale(1)",
          },
		  "flip": "flip 6s infinite steps(2, end)",
	        "kitrotate": "kitrotate 3s linear infinite both",
	        shine: "shine 2s linear infinite",
	        slide: "slide 40s linear infinite",
	        "border-width": "border-width 3s infinite alternate",
	        "text-gradient": "text-gradient 2s linear infinite",
	        "text-shake": "text-shake 1s ease 1",
	        "text-glitch-to": "text-glitch-to 0.6s ease-in-out infinite",
	        "text-glitch-from": "text-glitch-from 0.6s ease-in-out infinite",
	        "text-scale": "text-scale 1s linear infinite forwards",
	        'spin': 'spin 2s linear infinite',
			// From UI-Snippets : https://ui.ibelick.com
			// 'text-gradient': 'text-gradient 1.5s linear infinite',
			'background-shine': 'background-shine 2s linear infinite',
			'pulse-slow': 'pulse 6s infinite cubic-bezier(0.4, 0, 0.6, 1)',
        },
        },
      },
    },
  };