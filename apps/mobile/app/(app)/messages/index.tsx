import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '../../../src/constants/tokens';
import { Loader } from '../../../src/components/ui/Loader';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { ConversationListItem } from '../../../src/components/messages/ConversationListItem';
import { NewConversationSheet } from '../../../src/components/messages/NewConversationSheet';
import {
  useConversations,
  useGetOrCreateHouseholdConversation,
  useCreateDirectConversation,
} from '../../../src/lib/queries/messaging';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useHouseholdStore } from '../../../src/stores/household.store';
import type { Conversation } from '../../../src/types';

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentHousehold, isLoading: householdLoading, members } = useHouseholdStore();

  const [sheetVisible, setSheetVisible] = useState(false);

  const { data: conversations = [], isLoading, refetch, isRefetching } = useConversations();
  const getOrCreateHouseholdConversation = useGetOrCreateHouseholdConversation();
  const createDirect = useCreateDirectConversation();

  // Ensure household conversation exists on mount
  useEffect(() => {
    if (currentHousehold && !householdLoading) {
      getOrCreateHouseholdConversation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHousehold?.id]);

  const handleSelectMember = useCallback(
    async (userId: string) => {
      try {
        const conversationId = await createDirect.mutateAsync(userId);
        router.push(`/(app)/messages/${conversationId}`);
      } catch {
        // Error handled by mutation
      }
    },
    [createDirect, router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationListItem
        conversation={item}
        currentUserId={user?.id ?? ''}
        onPress={() => router.push(`/(app)/messages/${item.id}`)}
      />
    ),
    [user?.id, router]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Loader fullScreen label="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Messages"
        rightAction={
          <TouchableOpacity onPress={() => setSheetVisible(true)}>
            <Ionicons name="create-outline" size={22} color={Colors.terracotta} />
          </TouchableOpacity>
        }
      />

      {conversations.length === 0 ? (
        <EmptyState
          variant="generic"
          title="Pas encore de messages"
          subtitle="Commencez une conversation avec votre foyer."
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.terracotta}
              colors={[Colors.terracotta]}
            />
          }
        />
      )}

      <NewConversationSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        members={members}
        currentUserId={user?.id ?? ''}
        onSelect={handleSelectMember}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: Spacing['4xl'],
  },
});
