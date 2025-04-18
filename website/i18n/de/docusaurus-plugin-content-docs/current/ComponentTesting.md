---
id: component-testing
title: Komponenten Testen
---

Mit WebdriverIOs [Browser Runner](/docs/runner#browser-runner) können Sie Tests in einem echten Desktop- oder mobilen Browser ausführen, und dabei das WebDriver-Protokoll verwenden, um mit Elementen in der Komponente zu interagieren. Dieser Ansatz hat [viele Vorteile](/docs/runner#browser-runner) im Vergleich zu anderen Test-Frameworks, die nur Tests mit [JSDOM](https://www.npmjs.com/package/jsdom) zulassen.

## Wie funktioniert das?

Der Browser Runner verwendet [Vite](https://vitejs.dev/) , um eine Testseite zu rendern und mit einem Testframework zu initialisieren, die dann Ihre Tests im Browser auszuführt. Derzeit unterstützt WebdriverIO nur Mocha für Komponenten Tests, aber Jasmine und Cucumber sind [auf der Roadmap](https://github.com/orgs/webdriverio/projects/1). Dies ermöglicht das Testen beliebiger Komponenten, auch für Projekte, die Vite nicht verwenden.

Der Vite-Server wird vom WebdriverIO-Testrunner gestartet und so konfiguriert, dass Sie alle Reporter und Dienste wie gewohnt bei normalen e2e-Tests verwenden können. Furthermore it initializes a [`browser`](/docs/api/browser) instance that allows you to access a subset of the [WebdriverIO API](/docs/api) to interact with the any elements on the page. Ähnlich wie bei e2e-Tests können Sie auf die Browser API über die globale Variable `browser` zugreifen, oder Sie können diese aus `@wdio/globals` importieren, je nachdem, wie [`injectGlobals`](/docs/api/globals) gesetzt ist.

WebdriverIO has built-in support for the following frameworks:

- [__Nuxt__](https://nuxt.com/): WebdriverIO's testrunner detects a Nuxt application and automatically sets up your project composables and helps mock out the Nuxt backend, read more in the [Nuxt docs](/docs/component-testing/vue#testing-vue-components-in-nuxt)
- [__TailwindCSS__](https://tailwindcss.com/): WebdriverIO's testrunner detects if you are using TailwindCSS and loads the environment properly into the test page

## Einrichten

Um WebdriverIO für Unit- oder Komponententests im Browser einzurichten, initiieren Sie ein neues WebdriverIO-Projekt über:

```bash
npm init wdio@latest ./
# or
yarn create wdio ./
```

Wählen Sie nach dem Start des Konfigurationsassistenten `browser` zum Ausführen von Unit- und Komponententests und wählen Sie bei Bedarf eine der Voreinstellungen, ansonsten gehen Sie zu _„Andere“_, wenn Sie nur grundlegende Komponententests ausführen möchten. Sie können auch eine benutzerdefinierte Vite-Konfiguration setzen, wenn Sie Vite bereits in Ihrem Projekt verwenden. Weitere Informationen finden Sie in allen [Runner-Optionen](/docs/runner#runner-options).

:::info

__Hinweis:__ WebdriverIO führt standardmäßig Browsertests in CI Headless aus, z. B. wenn eine `CI` Umgebungsvariable auf `'1'` oder `'true'`gesetzt ist. Sie können dieses Verhalten manuell konfigurieren, indem Sie die Option [`headless`](/docs/runner#headless) für den Runner setzen.

:::

Am Ende dieses Konfigurations-Vorgang sollten Sie eine `wdio.conf.js` finden, die verschiedene WebdriverIO-Konfigurationen enthält, einschließlich einer `runner` -Eigenschaft, z.B.:

```ts reference useHTTPS runmeRepository="git@github.com:webdriverio/example-recipes.git" runmeFileToOpen="component-testing%2FREADME.md"
https://github.com/webdriverio/example-recipes/blob/fd54f94306ed8e7b40f967739164dfe4d6d76b41/wdio.comp.conf.js
```

Indem Sie verschiedene [Capabilities](/docs/configuration#capabilities) definieren, können Sie Ihre Tests in verschiedenen Browsern ausführen, falls gewünscht auch parallel.

If you are still unsure how everything works, watch the following tutorial on how to get started with Component Testing in WebdriverIO:

<LiteYouTubeEmbed id="5vp_3tGtnMc" title="Getting Started with Component Testing in WebdriverIO" />

## Test Setup

Es liegt ganz bei Ihnen, was Sie Ihre Tests ausführen möchten und wie Sie die Komponenten rendern möchten. Wir empfehlen jedoch, die [Testing Library](https://testing-library.com/) als Hilfs-Framework zu verwenden, da sie Plugins für verschiedene Frameworks wie React, Preact, Svelte und Vue bereitstellt. Es ist sehr nützlich zum Rendern von Komponenten in die Testseite und bereinigt diese automatisch nach jedem Test.

Sie können Testing Library-Selektorbefehle mit WebdriverIO-Befehlen nach Belieben mischen, z. B.:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fd54f94306ed8e7b40f967739164dfe4d6d76b41/component-testing/svelte-example.js
```

__Hinweis:__ Die Verwendung von Rendermethoden aus der Testing Library hilft beim Entfernen erstellter Komponenten zwischen den Tests. Wenn Sie Testing Library nicht verwenden, stellen Sie sicher, dass Sie Ihre Testkomponenten an einen Container anhängen, der zwischen den Tests bereinigt wird.

## Skripte Einrichten

Sie können Ihre Tests einrichten, indem Sie beliebige Skripte in Node.js oder im Browser ausführen, z. B. Einfügen von CSS, Browser-APIs mocken oder sich mit einem Drittanbieterdienst verbinden. Die WebdriverIO [Hooks](/docs/configuration#hooks) können verwendet werden, um Code in Node.js auszuführen, während die [`mochaOpts.require`](/docs/frameworks#require) Option es Ihnen ermöglicht, Skripte in den Browser zu importieren, bevor Tests geladen werden, z.B.:

```js wdio.conf.js
export const config = {
    // ...
    export const config = {
    // ...
    mochaOpts: {
        ui: 'tdd',
        // provide a setup script to run in the browser
        require: './__fixtures__/setup.js'
    },
    before: () => {
        // set up test environment in Node.js
    }
    // ...
}
}
```

Wenn Sie beispielsweise alle [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) Aufrufe in Ihrem Test mit dem folgenden Setup-Skript mocken möchten:

```js ./fixtures/setup.js
import { fn } from '@wdio/browser-runner'

// run code before all tests are loaded
window.fetch = fn()

export const mochaGlobalSetup = () => {
    // run code after test file is loaded
}

export const mochaGlobalTeardown = () => {
    // run code after spec file was executed
}

```

Damit können Sie in Ihren Tests benutzerdefinierte Antwortwerte für alle `fetch` Befehle bereitstellen. Lesen Sie mehr über globale Fixtures in den [Mocha-Docs](https://mochajs.org/#global-fixtures).

## Test- und Applikationsdatein Beobachten

Es gibt mehrere Möglichkeiten, wie Sie Ihre Browsertests debuggen können. Am einfachsten ist es, den WebdriverIO-Testrunner mit dem Flag `--watch` zu starten, z.B.:

```sh
$ npx wdio run ./wdio.conf.js --watch
```

Dadurch werden zunächst alle Tests durchlaufen. Sie können dann Änderungen an einzelnen Dateien vornehmen, die dann Tests einzeln erneut ausführen. Wenn Sie die [`filesToWatch`](/docs/configuration#filestowatch) Option festlegen, die mit ihrem Wert auf Ihre Anwendungsdateien verweist, werden alle Tests erneut ausgeführt, wenn Änderungen an Ihrer App vorgenommen werden.

## Debuggen

While it is not (yet) possible to set breakpoints in your IDE and have them being recognized by the remote browser, you can use the [`debug`](/docs/api/browser/debug) command to stop the test at any point. Auf diese Weise können Sie DevTools öffnen, um den Test dann zu debuggen, indem Sie Haltepunkte auf der Registerkarte [Sources](https://buddy.works/tutorials/debugging-javascript-efficiently-with-chrome-devtools) festlegen.

Wenn der Befehl `debug` aufgerufen wird, erhalten Sie auch eine Node.js-Repl-Schnittstelle in Ihrem Terminal, die besagt:

```
The execution has stopped!
You can now go into the browser or use the command line as REPL
(To exit, press ^C again or type .exit)
```

Press `Ctrl` or `Command` + `c` or enter `.exit` to continue with the test.

## Run using a Selenium Grid

If you have a [Selenium Grid](https://www.selenium.dev/documentation/grid/) set up and run your browser through that grid, you have to set the `host` browser runner option to allow the browser, to access the right host where the test files are being served, e.g.:

```ts title=wdio.conf.ts
export const config: WebdriverIO.Config = {
    runner: ['browser', {
        // network IP of the machine that runs the WebdriverIO process
        host: 'http://172.168.0.2'
    }]
}
```

This will ensure the browser correctly opens the right server instance hosted on the instance that runs the WebdriverIO tests.

## Beispiele

In unserem [-Beispiel-Repository](https://github.com/webdriverio/component-testing-examples)finden Sie verschiedene Beispiele zum Testen von Komponenten mit gängigen Frameworks.
