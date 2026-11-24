const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

// Expo SDK 54 compatibility with the scene lifecycle required by iOS 27.
// Keep one React root and forward scene events to the existing Expo delegates.
const scene = `

@objc(DomainMigrationSceneDelegate)
final class DomainMigrationSceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession,
             options connectionOptions: UIScene.ConnectionOptions) {
    guard session.role == .windowApplication,
          let windowScene = scene as? UIWindowScene,
          let app = UIApplication.shared.delegate as? AppDelegate else { return }
    if let existing = app.window {
      existing.windowScene = windowScene
      window = existing
      existing.makeKeyAndVisible()
      return
    }
    var options = app.sceneLaunchOptions ?? [:]
    if let context = connectionOptions.urlContexts.first {
      options[.url] = context.url
      if let source = context.options.sourceApplication { options[.sourceApplication] = source }
      if let annotation = context.options.annotation { options[.annotation] = annotation }
    }
    if let activity = connectionOptions.userActivities.first {
      options[.userActivityDictionary] = [
        "UIApplicationLaunchOptionsUserActivityTypeKey": activity.activityType,
        "UIApplicationLaunchOptionsUserActivityKey": activity
      ]
    }
    let sceneWindow = UIWindow(windowScene: windowScene)
    window = sceneWindow
    app.window = sceneWindow
    app.reactNativeFactory?.startReactNative(withModuleName: "main", in: sceneWindow, launchOptions: options)
    app.sceneLaunchOptions = nil
  }

  func scene(_ scene: UIScene, openURLContexts contexts: Set<UIOpenURLContext>) {
    for context in contexts {
      var options: [UIApplication.OpenURLOptionsKey: Any] = [.openInPlace: context.options.openInPlace]
      if let source = context.options.sourceApplication { options[.sourceApplication] = source }
      if let annotation = context.options.annotation { options[.annotation] = annotation }
      _ = UIApplication.shared.delegate?.application?(UIApplication.shared, open: context.url, options: options)
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = UIApplication.shared.delegate?.application?(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationDidBecomeActive?(UIApplication.shared)
  }
  func sceneWillResignActive(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationWillResignActive?(UIApplication.shared)
  }
  func sceneDidEnterBackground(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationDidEnterBackground?(UIApplication.shared)
  }
  func sceneWillEnterForeground(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationWillEnterForeground?(UIApplication.shared)
  }
}
`;

function patchAppDelegate(source) {
  if (source.includes('@objc(DomainMigrationSceneDelegate)')) return source;
  if (!source.includes('public class AppDelegate: ExpoAppDelegate {')) throw new Error('Expected Expo SDK 54 Swift AppDelegate');
  const legacy = /#if os\(iOS\) \|\| os\(tvOS\)\s+window = UIWindow\(frame: UIScreen\.main\.bounds\)[\s\S]*?\s+#endif/;
  if (!legacy.test(source)) throw new Error('Expected legacy React window startup');
  return source
    .replace('  var window: UIWindow?', '  var sceneLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?\n  var window: UIWindow?')
    .replace(legacy, '    sceneLaunchOptions = launchOptions // React starts when its UIWindowScene connects.') + scene;
}

module.exports = config => {
  config = withInfoPlist(config, result => {
    result.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [{
          UISceneConfigurationName: 'Default Configuration',
          UISceneClassName: 'UIWindowScene',
          UISceneDelegateClassName: 'DomainMigrationSceneDelegate',
        }],
      },
    };
    return result;
  });
  return withAppDelegate(config, result => {
    if (result.modResults.language !== 'swift') throw new Error('Swift scene plugin requires Swift AppDelegate');
    result.modResults.contents = patchAppDelegate(result.modResults.contents);
    return result;
  });
};
module.exports.patchAppDelegate = patchAppDelegate;
