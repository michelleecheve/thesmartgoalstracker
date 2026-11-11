import UIKit
import Capacitor

private let themeKey = "themeStyle"

/// Mismos colores de fondo que la interfaz web (claro #f7f7f9, oscuro #1c1a17).
private let appBackground = UIColor { trait in
    trait.userInterfaceStyle == .dark
        ? UIColor(red: 28 / 255, green: 26 / 255, blue: 23 / 255, alpha: 1)
        : UIColor(red: 247 / 255, green: 247 / 255, blue: 249 / 255, alpha: 1)
}

/// Sin tema guardado se usa el modo claro, igual que en la web.
private func interfaceStyle(for value: String?) -> UIUserInterfaceStyle {
    switch value {
    case "oscuro": return .dark
    case "sistema": return .unspecified
    default: return .light
    }
}

/// Recibe el tema elegido en la web para que la barra de estado, los bordes translúcidos
/// y el fondo de arranque coincidan con la interfaz.
@objc(ThemeBridgePlugin)
public class ThemeBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ThemeBridgePlugin"
    public let jsName = "ThemeBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setStyle", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hideSplash", returnType: CAPPluginReturnPromise)
    ]

    @objc func setStyle(_ call: CAPPluginCall) {
        let style = call.getString("style")
        UserDefaults.standard.set(style, forKey: themeKey)
        DispatchQueue.main.async {
            self.bridge?.viewController?.view.window?.overrideUserInterfaceStyle = interfaceStyle(for: style)
        }
        call.resolve()
    }

    /// La web avisa cuando ya dibujó su primera pantalla.
    @objc func hideSplash(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            (self.bridge?.viewController as? MainViewController)?.hideSplash()
        }
        call.resolve()
    }
}

class MainViewController: CAPBridgeViewController {
    private var splash: UIView?

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(ThemeBridgePlugin())
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = appBackground
        webView?.isOpaque = false
        webView?.backgroundColor = .clear
        webView?.scrollView.backgroundColor = .clear
        showSplash()
    }

    /// Repite la pantalla de lanzamiento (mismo fondo y logo en la misma posición) encima de
    /// la web, para que no haya un instante vacío mientras esta carga.
    private func showSplash() {
        let cover = UIView(frame: view.bounds)
        cover.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        cover.backgroundColor = appBackground

        let logo = UIImageView(image: UIImage(named: "LaunchLogo"))
        logo.contentMode = .scaleAspectFit
        logo.translatesAutoresizingMaskIntoConstraints = false
        cover.addSubview(logo)
        NSLayoutConstraint.activate([
            logo.widthAnchor.constraint(equalToConstant: 88),
            logo.heightAnchor.constraint(equalToConstant: 128),
            logo.centerXAnchor.constraint(equalTo: cover.centerXAnchor),
            logo.centerYAnchor.constraint(equalTo: cover.centerYAnchor, constant: -38),
        ])

        view.addSubview(cover)
        splash = cover

        // Por si la web nunca avisa (sin conexión al cargar, error), no se queda tapada.
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in self?.hideSplash() }
    }

    func hideSplash() {
        guard let cover = splash else { return }
        splash = nil
        UIView.animate(withDuration: 0.2, animations: { cover.alpha = 0 }) { _ in cover.removeFromSuperview() }
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.overrideUserInterfaceStyle = interfaceStyle(for: UserDefaults.standard.string(forKey: themeKey))
        window?.backgroundColor = appBackground
        window?.rootViewController = MainViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
