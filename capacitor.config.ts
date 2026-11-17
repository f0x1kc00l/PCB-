/**
 * Конфигурация Android-приложения (Capacitor).
 *
 * Приложение — это WebView, в который упакована собранная версия сайта (папка dist/).
 * Работает полностью офлайн: уроки, поиск и прогресс живут внутри приложения.
 *
 * appId — уникальный идентификатор пакета. Для Google Play поменяй на свой
 * (обычно перевёрнутый домен: am.example.pcbcourse) ДО первой публикации — потом менять нельзя.
 */
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.pcbcourse.app',
	appName: 'PCB с нуля',
	webDir: 'dist',
	android: {
		// В отладочной сборке можно подключить chrome://inspect и смотреть консоль WebView.
		webContentsDebuggingEnabled: false,
	},
	plugins: {
		SystemBars: {
			// Цвет иконок статус-бара подстраивается под системную тему.
			style: 'DEFAULT',
		},
	},
};

export default config;
