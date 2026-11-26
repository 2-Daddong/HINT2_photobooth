# HINT2 Photo Booth

## Deploy
Upload the contents of this folder (not the enclosing folder) to GitHub main. Vercel: Vite, root ./, npm install, npm run build, dist. Local: npm install && npm run dev.

## Font
For licensing and redistribution reasons the font is not bundled. If authorized, create public/fonts and copy your supplied TTF as harmony.ttf. Otherwise the system fallback font is used. Verify permission to publish the provided logos and car reference.

## QR sharing
Optional: connect a Vercel Blob store to the project, set ENABLE_PUBLIC_SHARE=true only after adding access/rate limits and a retention/deletion policy. The included endpoint is a basic public-link prototype; anyone with a link can view the image. No automatic deletion or abuse protection is implemented. Leave disabled for public deployment until these are added. Local download works independently.

## Limitations
Browser camera and remote MediaPipe model downloads require HTTPS or localhost and network access. AI inference and camera behavior require real device testing. Frame themes are initial color variants, not final illustrated templates. The car is cropped from the supplied reference, with CSS window overlays and departure motion (no independent wheel rotation). Original logos used; HMG exterior margin cropped. No database or persistent session. 
