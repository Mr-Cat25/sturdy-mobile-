import React from 'react';
import { Tabs } from 'expo-router';
import { Flame, LibraryBig } from 'lucide-react-native';

export default function TabLayout() {
  return (
      <Tabs
            screenOptions={{
                    tabBarActiveTintColor: '#D4AF37', // Sturdy Premium Gold
                            tabBarInactiveTintColor: '#9CA3AF',
                                    tabBarStyle: {
                                              backgroundColor: '#0B0F19', // Deep Navy Background
                                                        borderTopColor: '#1A2235',
                                                                  height: 80,
                                                                            paddingBottom: 20,
                                                                                    },
                                                                                            headerStyle: {
                                                                                                      backgroundColor: '#0B0F19',
                                                                                                              },
                                                                                                                      headerTitleStyle: {
                                                                                                                                color: '#FFFFFF',
                                                                                                                                          fontSize: 20,
                                                                                                                                                    fontWeight: 'bold',
                                                                                                                                                            },
                                                                                                                                                                    headerShown: false, // Hides the default top header so your custom UI shines
                                                                                                                                                                          }}
                                                                                                                                                                              >
                                                                                                                                                                                    {/* 1. CRISIS TAB */}
                                                                                                                                                                                          <Tabs.Screen
                                                                                                                                                                                                  name="index"
                                                                                                                                                                                                          options={{
                                                                                                                                                                                                                    title: 'Crisis',
                                                                                                                                                                                                                              tabBarIcon: ({ color }) => <Flame size={24} color={color} />,
                                                                                                                                                                                                                                      }}
                                                                                                                                                                                                                                            />
                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                        {/* 2. LIBRARY TAB */}
                                                                                                                                                                                                                                                              <Tabs.Screen
                                                                                                                                                                                                                                                                      name="explore"
                                                                                                                                                                                                                                                                              options={{
                                                                                                                                                                                                                                                                                        title: 'Library',
                                                                                                                                                                                                                                                                                                  tabBarIcon: ({ color }) => <LibraryBig size={24} color={color} />,
                                                                                                                                                                                                                                                                                                          }}
                                                                                                                                                                                                                                                                                                                />
                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                        </Tabs>
                                                                                                                                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                                          