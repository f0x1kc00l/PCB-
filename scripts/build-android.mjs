/**
 * Сборка веб-части Android-приложения:
 *   1) собирает сайт в режиме приложения (CAPACITOR=1 → base '/', скрипт исправления ссылок);
 *   2) копирует dist/ в проект android/ (npx cap sync android).
 *
 * Запуск: npm run build:android. Скрипт на Node, а не `CAPACITOR=1 astro build`
 * в package.json, чтобы одинаково работать в Windows, macOS и Linux.
 */
import { execSync } from 'node:child_process';

const env = { ...process.env, CAPACITOR: '1' };
const run = (cmd) => execSync(cmd, { stdio: 'inherit', env });

run('npx astro build');
run('npx cap sync android');

console.log('\nГотово. Дальше: открой папку android/ в Android Studio (npx cap open android)');
console.log('или собери APK из консоли: cd android && ./gradlew assembleDebug');
