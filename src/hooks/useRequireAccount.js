import { useNavigation } from '@react-navigation/native';
import { useApp } from './useApp';

// Guests can browse freely; anything that saves data or costs AI calls needs
// an account. Returns a guard: requireAccount('scan') → true if signed in,
// otherwise opens the sign-up screen (with a reason) and returns false.
export function useRequireAccount() {
  const { session } = useApp();
  const navigation = useNavigation();
  return (reason = 'log') => {
    if (session) return true;
    navigation.navigate('Auth', { reason });
    return false;
  };
}
