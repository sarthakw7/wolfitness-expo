import {
  ArchivoNarrow_400Regular,
  ArchivoNarrow_500Medium,
  ArchivoNarrow_600SemiBold,
  ArchivoNarrow_700Bold,
} from "@expo-google-fonts/archivo-narrow";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { useFonts } from "expo-font";

export function useAppFonts() {
  return useFonts({
    ArchivoNarrow: ArchivoNarrow_400Regular,
    ArchivoNarrow_500Medium: ArchivoNarrow_500Medium,
    ArchivoNarrow_600SemiBold: ArchivoNarrow_600SemiBold,
    ArchivoNarrow_700Bold: ArchivoNarrow_700Bold,
    Manrope: Manrope_400Regular,
    Manrope_500Medium: Manrope_500Medium,
    Manrope_600SemiBold: Manrope_600SemiBold,
    Manrope_700Bold: Manrope_700Bold,
    Manrope_800ExtraBold: Manrope_800ExtraBold,
  });
}
