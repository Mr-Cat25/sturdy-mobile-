import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, KeyboardAvoidingView, 
  Platform, Animated, ScrollView, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wind, ArrowLeft } from 'lucide-react-native';
import { supabase } from '../../supabase';

const AGES = ['2-4', '5-7', '8-12', '13+'];
const NEUROTYPES = ['Neurotypical', 'ADHD', 'Autism', 'Anxiety', 'Sensory'];

export default function CrisisScreen() {
  const [situation, setSituation] = useState('');
  const [age, setAge] = useState('2-4');
  const [neurotype, setNeurotype] = useState('Neurotypical');
  
  const [appState, setAppState] = useState<'idle' | 'breathing' | 'clarifying' | 'result'>('idle');
  const [scriptResult, setScriptResult] = useState<any>(null);
  const [clarifyData, setClarifyData] = useState<any>(null);

  const breathAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (appState === 'breathing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, { toValue: 1.5, duration: 2500, useNativeDriver: true }),
          Animated.timing(breathAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      breathAnim.stopAnimation();
      breathAnim.setValue(1);
    }
  }, [appState]);

  const fetchScript = async (clarifiedTag?: string) => {
    setAppState('breathing');
    try {
      console.log('🚀 Calling Edge Function...');
      console.log('Payload:', { situation, age_group: age, neurotype: neurotype.toLowerCase(), clarifiedTag });

      const { data, error } = await supabase.functions.invoke('generate-crisis-script', {
        body: {
          situation,
          age_group: age,
          neurotype: neurotype.toLowerCase(),
          clarifiedTag
        }
      });

      console.log('📦 RAW DATA:', JSON.stringify(data));
      console.log('❌ RAW ERROR:', error);

      if (error) throw error;

      if (data.status === 'needs_clarification') {
        console.log('🤔 Needs clarification');
        setClarifyData(data);
        setAppState('clarifying');
      } else if (data.status === 'ok') {
        console.log('✅ Script received:', data.script);
        setScriptResult(data.script);
        setAppState('result');
      } else {
        console.log('⚠️ Unexpected status:', data?.status);
        setAppState('idle');
      }
    } catch (err) {
      console.error('💥 FETCH ERROR:', err);
      alert("Couldn't connect to Sturdy's brain. Check your internet.");
      setAppState('idle');
    }
  };

  const handleGenerate = () => {
    if (!situation.trim()) return;
    Keyboard.dismiss();
    fetchScript();
  };

  const handleClarify = (tag: string) => {
    fetchScript(tag);
  };

  const reset = () => {
    setSituation('');
    setScriptResult(null);
    setClarifyData(null);
    setAppState('idle');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        
        {appState === 'idle' && (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>Sturdy</Text>
              <Text style={styles.subtitle}>What's happening right now?</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. She threw her shoes when I said bedtime..."
                placeholderTextColor="#6B7280"
                multiline
                maxLength={300}
                value={situation}
                onChangeText={setSituation}
              />
              <Text style={styles.charCount}>{situation.length}/300</Text>
            </View>

            <Text style={styles.label}>Child's Age</Text>
            <View style={styles.pillContainer}>
              {AGES.map((a) => (
                <TouchableOpacity key={a} style={[styles.pill, age === a && styles.pillActive]} onPress={() => setAge(a)}>
                  <Text style={[styles.pillText, age === a && styles.pillTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Neurotype / Needs</Text>
            <View style={styles.pillContainer}>
              {NEUROTYPES.map((n) => (
                <TouchableOpacity key={n} style={[styles.pill, neurotype === n && styles.pillActive]} onPress={() => setNeurotype(n)}>
                  <Text style={[styles.pillText, neurotype === n && styles.pillTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flex: 1 }} />

            <TouchableOpacity style={[styles.button, !situation.trim() && styles.buttonDisabled]} onPress={handleGenerate} disabled={!situation.trim()}>
              <Wind color="#0B0F19" size={24} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Find Calm Words</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {appState === 'breathing' && (
          <View style={styles.centerContainer}>
            <Animated.View style={[styles.orb, { transform: [{ scale: breathAnim }] }]} />
            <Text style={styles.breathingText}>Pause. One breath...</Text>
          </View>
        )}

        {appState === 'clarifying' && clarifyData && (
          <View style={styles.centerContainer}>
            <Text style={styles.questionText}>{clarifyData.question}</Text>
            {clarifyData.options.map((opt: any) => (
              <TouchableOpacity key={opt.key} style={styles.outlineButton} onPress={() => handleClarify(opt.key)}>
                <Text style={styles.outlineButtonText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {appState === 'result' && scriptResult && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity style={styles.backButton} onPress={reset}>
              <ArrowLeft color="#9CA3AF" size={24} />
              <Text style={styles.backText}>Start Over</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Your Words</Text>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>1. Regulate</Text>
              <Text style={styles.cardText}>{scriptResult.regulate}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>2. Connect</Text>
              <Text style={styles.cardText}>{scriptResult.connect}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>3. Guide</Text>
              <Text style={styles.cardText}>{scriptResult.guide}</Text>
            </View>

            <Text style={styles.identityText}>"{scriptResult.identity}"</Text>

            <Text style={styles.ratingPrompt}>How did this feel?</Text>
            <View style={styles.ratingRow}>
              {['1 - Still hard', '2 - About same', '3 - Better'].map((r) => (
                <TouchableOpacity key={r} style={styles.ratingPill} onPress={() => { alert("Rating saved!"); reset(); }}>
                  <Text style={styles.ratingText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { marginTop: 20, marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D4AF37', marginBottom: 8 },
  subtitle: { fontSize: 32, fontWeight: '600', color: '#FFFFFF', lineHeight: 40 },
  inputContainer: { marginBottom: 32 },
  textInput: { backgroundColor: '#1A2235', color: '#FFFFFF', borderRadius: 16, padding: 20, fontSize: 18, minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#2A344A' },
  charCount: { color: '#6B7280', fontSize: 12, textAlign: 'right', marginTop: 8 },
  label: { color: '#9CA3AF', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  pill: { backgroundColor: '#1A2235', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#2A344A' },
  pillActive: { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: '#D4AF37' },
  pillText: { color: '#9CA3AF', fontSize: 16, fontWeight: '500' },
  pillTextActive: { color: '#D4AF37', fontWeight: '600' },
  button: { backgroundColor: '#D4AF37', paddingVertical: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  buttonDisabled: { backgroundColor: '#2A344A', shadowOpacity: 0 },
  buttonText: { color: '#0B0F19', fontSize: 18, fontWeight: 'bold' },
  orb: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(212, 175, 55, 0.4)', borderWidth: 2, borderColor: '#D4AF37' },
  breathingText: { marginTop: 60, color: '#FFFFFF', fontSize: 20, fontWeight: '500', letterSpacing: 0.5 },
  questionText: { fontSize: 24, fontWeight: '600', color: '#FFFFFF', marginBottom: 32, textAlign: 'center', lineHeight: 34 },
  outlineButton: { borderWidth: 2, borderColor: '#D4AF37', borderRadius: 16, paddingVertical: 18, marginBottom: 16, alignItems: 'center', width: '100%' },
  outlineButtonText: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 10 },
  backText: { color: '#9CA3AF', fontSize: 16, marginLeft: 8 },
  card: { backgroundColor: '#1A2235', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#2A344A' },
  cardLabel: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  cardText: { color: '#FFFFFF', fontSize: 18, lineHeight: 28 },
  identityText: { color: '#9CA3AF', fontSize: 16, fontStyle: 'italic', textAlign: 'center', marginVertical: 24 },
  ratingPrompt: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 16, marginBottom: 16 },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  ratingPill: { backgroundColor: '#1A2235', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, flex: 1, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: '#2A344A' },
  ratingText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', textAlign: 'center' }
});              <Text style={styles.subtitle}>What's happening right now?</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. She threw her shoes when I said bedtime..."
                placeholderTextColor="#6B7280"
                multiline
                maxLength={300}
                value={situation}
                onChangeText={setSituation}
              />
              <Text style={styles.charCount}>{situation.length}/300</Text>
            </View>

            <Text style={styles.label}>Child's Age</Text>
            <View style={styles.pillContainer}>
              {AGES.map((a) => (
                <TouchableOpacity key={a} style={[styles.pill, age === a && styles.pillActive]} onPress={() => setAge(a)}>
                  <Text style={[styles.pillText, age === a && styles.pillTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Neurotype / Needs</Text>
            <View style={styles.pillContainer}>
              {NEUROTYPES.map((n) => (
                <TouchableOpacity key={n} style={[styles.pill, neurotype === n && styles.pillActive]} onPress={() => setNeurotype(n)}>
                  <Text style={[styles.pillText, neurotype === n && styles.pillTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flex: 1 }} />

            <TouchableOpacity style={[styles.button, !situation.trim() && styles.buttonDisabled]} onPress={handleGenerate} disabled={!situation.trim()}>
              <Wind color="#0B0F19" size={24} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Find Calm Words</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {appState === 'breathing' && (
          <View style={styles.centerContainer}>
            <Animated.View style={[styles.orb, { transform: [{ scale: breathAnim }] }]} />
            <Text style={styles.breathingText}>Pause. One breath...</Text>
          </View>
        )}

        {appState === 'clarifying' && clarifyData && (
          <View style={styles.centerContainer}>
            <Text style={styles.questionText}>{clarifyData.question}</Text>
            {clarifyData.options.map((opt: any) => (
              <TouchableOpacity key={opt.key} style={styles.outlineButton} onPress={() => handleClarify(opt.key)}>
                <Text style={styles.outlineButtonText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {appState === 'result' && scriptResult && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity style={styles.backButton} onPress={reset}>
              <ArrowLeft color="#9CA3AF" size={24} />
              <Text style={styles.backText}>Start Over</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Your Words</Text>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>1. Regulate</Text>
              <Text style={styles.cardText}>{scriptResult.regulate}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>2. Connect</Text>
              <Text style={styles.cardText}>{scriptResult.connect}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>3. Guide</Text>
              <Text style={styles.cardText}>{scriptResult.guide}</Text>
            </View>

            <Text style={styles.identityText}>"{scriptResult.identity}"</Text>

            <Text style={styles.ratingPrompt}>How did this feel?</Text>
            <View style={styles.ratingRow}>
              {['1 - Still hard', '2 - About same', '3 - Better'].map((r) => (
                <TouchableOpacity key={r} style={styles.ratingPill} onPress={() => { alert("Rating saved!"); reset(); }}>
                  <Text style={styles.ratingText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { marginTop: 20, marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D4AF37', marginBottom: 8 },
  subtitle: { fontSize: 32, fontWeight: '600', color: '#FFFFFF', lineHeight: 40 },
  inputContainer: { marginBottom: 32 },
  textInput: { backgroundColor: '#1A2235', color: '#FFFFFF', borderRadius: 16, padding: 20, fontSize: 18, minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#2A344A' },
  charCount: { color: '#6B7280', fontSize: 12, textAlign: 'right', marginTop: 8 },
  label: { color: '#9CA3AF', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  pill: { backgroundColor: '#1A2235', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#2A344A' },
  pillActive: { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: '#D4AF37' },
  pillText: { color: '#9CA3AF', fontSize: 16, fontWeight: '500' },
  pillTextActive: { color: '#D4AF37', fontWeight: '600' },
  button: { backgroundColor: '#D4AF37', paddingVertical: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  buttonDisabled: { backgroundColor: '#2A344A', shadowOpacity: 0 },
  buttonText: { color: '#0B0F19', fontSize: 18, fontWeight: 'bold' },
  orb: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(212, 175, 55, 0.4)', borderWidth: 2, borderColor: '#D4AF37' },
  breathingText: { marginTop: 60, color: '#FFFFFF', fontSize: 20, fontWeight: '500', letterSpacing: 0.5 },
  questionText: { fontSize: 24, fontWeight: '600', color: '#FFFFFF', marginBottom: 32, textAlign: 'center', lineHeight: 34 },
  outlineButton: { borderWidth: 2, borderColor: '#D4AF37', borderRadius: 16, paddingVertical: 18, marginBottom: 16, alignItems: 'center', width: '100%' },
  outlineButtonText: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 10 },
  backText: { color: '#9CA3AF', fontSize: 16, marginLeft: 8 },
  card: { backgroundColor: '#1A2235', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#2A344A' },
  cardLabel: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  cardText: { color: '#FFFFFF', fontSize: 18, lineHeight: 28 },
  identityText: { color: '#9CA3AF', fontSize: 16, fontStyle: 'italic', textAlign: 'center', marginVertical: 24 },
  ratingPrompt: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 16, marginBottom: 16 },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  ratingPill: { backgroundColor: '#1A2235', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, flex: 1, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: '#2A344A' },
  ratingText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', textAlign: 'center' }
});
