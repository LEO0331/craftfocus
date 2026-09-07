import { Alert as NativeAlert, Platform } from 'react-native';

// React Native Web's Alert implementation is empty. Use browser dialogs for
// the app's informational alerts and cancel/confirm prompts.
export const Alert: Pick<typeof NativeAlert, 'alert'> = {
  alert(title, message, buttons, options) {
    if (Platform.OS !== 'web') {
      NativeAlert.alert(title, message, buttons, options);
      return;
    }
    if (typeof window === 'undefined') return;

    const text = [title, message].filter(Boolean).join('\n\n');
    const cancel = buttons?.find((button) => button.style === 'cancel');
    const action = buttons?.find((button) => button.style !== 'cancel');
    if (cancel) {
      if (window.confirm(text)) action?.onPress?.();
      else cancel.onPress?.();
    } else {
      window.alert(text);
      action?.onPress?.();
    }
  },
};
