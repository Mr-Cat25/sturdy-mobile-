import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
      <Stack>
            {/* This hides the header and points to your (tabs) folder for the main UI */}
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                            </Stack>
                              );
                              }
                              