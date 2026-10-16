# Pong

A minimal two-player Pong game. White paddles and ball on a black 640×360 canvas. W/S move the left paddle, arrow keys move the right. First to 11 wins. Serves go towards the player who lost the point. Best score stays on this device. English and Japanese, offline service worker and manifest retained.

Run `python3 -m http.server`, then open the local address. Run `node --test` for game rules, language and referenced-file tests. Styles are plain CSS in static/app.css; the starter's styles/input.css and vendor folder remain for future Tailwind builds. Game rules live in js/logic/pong.mjs; storage in js/store.mjs.
