import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function LoginCallbackScreen() {
  return <View style={{ flex: 1 }} />;
}
