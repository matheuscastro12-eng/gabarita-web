import AppKit
import WebKit

/// Gabarita para Mac: uma janela nativa (WebKit) do gabarita-web publicado na Vercel.
/// O progresso fica no armazenamento local do WebKit deste app, como no navegador.
let siteURL = URL(string: ProcessInfo.processInfo.environment["GABARITA_URL"]
                  ?? "https://gabarita-flame.vercel.app")!

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate {
    var window: NSWindow!
    var web: WKWebView!

    func applicationDidFinishLaunching(_ note: Notification) {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()          // persiste localStorage/IndexedDB entre aberturas
        config.preferences.isElementFullscreenEnabled = true
        web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = self
        web.uiDelegate = self
        web.allowsBackForwardNavigationGestures = true
        web.allowsMagnification = true

        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1280, height: 820),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
                          backing: .buffered, defer: false)
        window.title = "Gabarita"
        window.titlebarAppearsTransparent = true
        window.minSize = NSSize(width: 900, height: 600)
        window.contentView = web
        window.setFrameAutosaveName("GabaritaMain")
        if !window.setFrameUsingName("GabaritaMain") { window.center() }
        window.makeKeyAndOrderFront(nil)
        buildMenu()
        load()
        NSApp.activate(ignoringOtherApps: true)
    }

    func load() { web.load(URLRequest(url: siteURL)) }

    func applicationShouldTerminateAfterLastWindowClosed(_ s: NSApplication) -> Bool { true }

    // Links para fora do Gabarita abrem no navegador padrão.
    func webView(_ w: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let url = action.request.url, let host = url.host,
           host != siteURL.host, action.navigationType == .linkActivated {
            NSWorkspace.shared.open(url); decisionHandler(.cancel); return
        }
        decisionHandler(.allow)
    }

    // target=_blank: abre fora se for externo, senão na própria janela.
    func webView(_ w: WKWebView, createWebViewWith c: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures f: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url {
            if url.host == siteURL.host { w.load(action.request) } else { NSWorkspace.shared.open(url) }
        }
        return nil
    }

    // Microfone (ditado no tutor).
    func webView(_ w: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(origin.host == siteURL.host ? .grant : .deny)
    }

    // alert/confirm do site viram diálogos nativos.
    func webView(_ w: WKWebView, runJavaScriptAlertPanelWithMessage m: String,
                 initiatedByFrame f: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let a = NSAlert(); a.messageText = m; a.runModal(); completionHandler()
    }
    func webView(_ w: WKWebView, runJavaScriptConfirmPanelWithMessage m: String,
                 initiatedByFrame f: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let a = NSAlert(); a.messageText = m; a.addButton(withTitle: "OK"); a.addButton(withTitle: "Cancelar")
        completionHandler(a.runModal() == .alertFirstButtonReturn)
    }

    // Sem internet: página simples com "Tentar de novo".
    func webView(_ w: WKWebView, didFailProvisionalNavigation n: WKNavigation!, withError e: Error) { offline(e) }
    func webView(_ w: WKWebView, didFail n: WKNavigation!, withError e: Error) {
        if (e as NSError).code != NSURLErrorCancelled { offline(e) }
    }
    func offline(_ e: Error) {
        let html = """
        <html><body style="font:15px -apple-system;background:#F5F7FA;color:#1D1D1F;display:flex;
        align-items:center;justify-content:center;height:100vh;margin:0">
        <div style="background:#fff;border-radius:20px;padding:28px 32px;max-width:420px;
        box-shadow:0 1px 3px rgba(16,24,40,.06),0 8px 24px rgba(16,24,40,.04)">
        <h2 style="margin:0 0 8px;font-weight:800">Sem conexão com o Gabarita</h2>
        <p style="color:#6E6E73;margin:0 0 18px">Confira a internet e tente de novo. Seu progresso continua salvo neste Mac.</p>
        <a href="\(siteURL.absoluteString)" style="background:#0A84FF;color:#fff;text-decoration:none;
        padding:11px 24px;border-radius:999px;font-weight:700">Tentar de novo</a></div></body></html>
        """
        web.loadHTMLString(html, baseURL: nil)
    }

    @objc func reload() { if web.url?.host == siteURL.host { web.reload() } else { load() } }
    @objc func goBack() { web.goBack() }
    @objc func goForward() { web.goForward() }
    @objc func goHome() { load() }

    func buildMenu() {
        let main = NSMenu()
        let appItem = NSMenuItem(); main.addItem(appItem)
        let app = NSMenu()
        app.addItem(withTitle: "Ocultar Gabarita", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        app.addItem(.separator())
        app.addItem(withTitle: "Sair do Gabarita", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = app

        let editItem = NSMenuItem(); main.addItem(editItem)
        let edit = NSMenu(title: "Editar")
        edit.addItem(withTitle: "Desfazer", action: Selector(("undo:")), keyEquivalent: "z")
        edit.addItem(withTitle: "Refazer", action: Selector(("redo:")), keyEquivalent: "Z")
        edit.addItem(.separator())
        edit.addItem(withTitle: "Recortar", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        edit.addItem(withTitle: "Copiar", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        edit.addItem(withTitle: "Colar", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        edit.addItem(withTitle: "Selecionar tudo", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editItem.submenu = edit

        let viewItem = NSMenuItem(); main.addItem(viewItem)
        let view = NSMenu(title: "Visualizar")
        view.addItem(withTitle: "Recarregar", action: #selector(reload), keyEquivalent: "r")
        view.addItem(withTitle: "Início", action: #selector(goHome), keyEquivalent: "H")
        view.addItem(withTitle: "Voltar", action: #selector(goBack), keyEquivalent: "[")
        view.addItem(withTitle: "Avançar", action: #selector(goForward), keyEquivalent: "]")
        view.addItem(.separator())
        let fs = view.addItem(withTitle: "Tela cheia", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")
        fs.keyEquivalentModifierMask = [.command, .control]
        viewItem.submenu = view

        let winItem = NSMenuItem(); main.addItem(winItem)
        let win = NSMenu(title: "Janela")
        win.addItem(withTitle: "Minimizar", action: #selector(NSWindow.miniaturize(_:)), keyEquivalent: "m")
        win.addItem(withTitle: "Fechar", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        winItem.submenu = win
        NSApp.mainMenu = main
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
