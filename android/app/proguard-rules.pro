# R8 rules for the release build. Capacitor's own plugin keep rules ship inside
# capacitor-android (consumer rules); these cover what the app itself relies on.

# The Capacitor bridge is reached from JavaScript through the WebView.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Capacitor reads its plugin annotations at runtime.
-keepattributes *Annotation*

# Readable crash stack traces.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
