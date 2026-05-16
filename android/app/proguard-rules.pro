
# Capacitor core
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep @com.getcapacitor.annotation.PluginMethod class * { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.PluginMethod public *;
}

# Capacitor IAP plugin
-keep class com.getcapacitor.community.inapppurchases.** { *; }

# Capacitor Plugins
-keep class com.capacitorjs.** { *; }

# AndroidX / Jetpack
-keep class androidx.** { *; }
-dontwarn androidx.**

# Prevent stripping of classes loaded via reflection
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes EnclosingMethod

# WebView JS interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# General Android safety
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
