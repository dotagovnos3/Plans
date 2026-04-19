import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { useEventsStore } from '../stores/eventsStore';
import { CreatePlanForm } from './CreatePlanForm';
import { formatDateShort } from '../utils/dates';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreatePlanFromEvent'>;

export const CreatePlanFromEventScreen = ({ route, navigation }: Props) => {
  const { eventId } = route.params;
  const events = useEventsStore((s) => s.events);
  const event = events.find((e) => e.id === eventId);

  if (!event) return <View style={s.container} />;

  return (
    <View style={s.container}>
      <CreatePlanForm
        linkedEventId={event.id}
        linkedEventTitle={event.title}
        linkedEventVenue={event.venue?.name}
        linkedEventTime={formatDateShort(event.starts_at)}
        onDone={(_planId: string) => navigation.navigate('HomeFeed')}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
});
