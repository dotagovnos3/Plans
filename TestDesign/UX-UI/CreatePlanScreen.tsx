import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { CreatePlanForm } from './CreatePlanForm';
import { ScreenContainer } from '../components/ScreenContainer';
import { FadeIn } from '../components/Animations';

export const CreatePlanScreen = () => {
  const navigation = useNavigation();

  const handleDone = (newPlanId: string) => {
    (navigation as any).navigate('PlansTab', {
      screen: 'PlanDetails',
      params: { planId: newPlanId },
    });
  };

  return (
    <ScreenContainer>
      <FadeIn>
        <View style={s.container}>
          <CreatePlanForm onDone={handleDone} />
        </View>
      </FadeIn>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
});
