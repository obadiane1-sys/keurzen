# Patterns Composants Premium — Keurzen

## Composants UI existants

Avant de creer un composant, verifier s'il existe deja dans `apps/mobile/src/components/ui/` :

| Composant | Fichier | Usage |
|-----------|---------|-------|
| `Avatar` | `Avatar.tsx` | Photo profil / initiales membre |
| `Badge` | `Badge.tsx` | Status, categories |
| `Button` | `Button.tsx` | CTA (primary/secondary/ghost/danger/outline) |
| `Card` | `Card.tsx` | Conteneur principal avec shadow subtile |
| `DatePicker` | `DatePicker.tsx` | Selection de date |
| `Divider` | `Divider.tsx` | Separateur horizontal |
| `EmptyState` | `EmptyState.tsx` | Etat vide avec mascotte |
| `Input` | `Input.tsx` | Champ texte |
| `Loader` | `Loader.tsx` | Indicateur de chargement |
| `Mascot` | `Mascot.tsx` | Mascotte kawaii Keurzen |
| `OTPInput` | `OTPInput.tsx` | Saisie code OTP |
| `ScreenHeader` | `ScreenHeader.tsx` | Header d'ecran |
| `Text` | `Text.tsx` | Texte avec tokens integres |
| `Toast` | `Toast.tsx` | Notification ephemere |

## Principes de composition

### Structure d'un composant

```tsx
// 1. Imports groupes : React, RN, tokens, composants internes
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';

// 2. Interface typee — jamais de `any`
interface MyComponentProps {
  title: string;
  variant?: 'default' | 'accent';
  onPress?: () => void;
  children?: React.ReactNode;
}

// 3. Composant fonctionnel exporte nomme
export function MyComponent({ title, variant = 'default', onPress, children }: MyComponentProps) {
  return (
    <View style={[styles.container, variant === 'accent' && styles.accent]}>
      {children}
    </View>
  );
}

// 4. StyleSheet en bas — tous les tokens
const styles = StyleSheet.create({
  container: {
    padding: Spacing.base,
    borderRadius: BorderRadius.card,
    backgroundColor: Colors.backgroundCard,
  },
  accent: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.terracotta,
  },
});
```

### Pattern Card

Les cartes sont le composant visuel principal de Keurzen.

```tsx
<Card padding="md" radius="xl" border>
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
    <Avatar size={40} />
    <View style={{ flex: 1 }}>
      <Text weight="semibold" size="base">{title}</Text>
      <Text size="sm" color={Colors.textSecondary}>{subtitle}</Text>
    </View>
    <Badge variant="success" label="Done" />
  </View>
</Card>
```

Proprietes du `Card` :
- `padding`: `'none' | 'sm' | 'md' | 'lg'` (defaut `'md'`)
- `radius`: `'md' | 'lg' | 'xl' | '2xl'` (defaut `'xl'`)
- `elevated`: ombre plus prononcee (Shadows.lg au lieu de Shadows.card)
- `border`: bordure subtile
- `onPress`: rend la carte cliquable (TouchableOpacity, activeOpacity 0.85)

### Pattern Button

```tsx
// CTA primaire
<Button variant="primary" label="Ajouter" onPress={handleAdd} fullWidth />

// Action secondaire
<Button variant="outline" label="Annuler" onPress={handleCancel} />

// Action destructive
<Button variant="danger" label="Supprimer" onPress={handleDelete} />

// Avec icone
<Button variant="primary" label="Nouvelle tache" leftIcon={<PlusIcon />} onPress={handleNew} />

// Loading
<Button variant="primary" label="Enregistrer" isLoading={isSaving} onPress={handleSave} />
```

Variantes : `primary` (terracotta), `secondary` (sauge), `ghost`, `danger` (rose), `outline` (bordure terracotta)
Tailles : `sm` (h36), `md` (h44 = touch target), `lg` (h54)

### Pattern Liste

```tsx
<FlatList
  data={items}
  contentContainerStyle={{ padding: Spacing.base, gap: Spacing.md }}
  renderItem={({ item }) => (
    <Card onPress={() => navigateToDetail(item.id)}>
      {/* contenu */}
    </Card>
  )}
  ListEmptyComponent={
    <EmptyState
      title="Aucune tache"
      description="Ajoutez votre premiere tache"
      icon={<TaskIcon />}
    />
  }
/>
```

### Pattern Input

```tsx
<Input
  label="Nom de la tache"
  placeholder="Ex: Faire les courses"
  value={name}
  onChangeText={setName}
  error={errors.name?.message}
/>
```

### Pattern Modale / Bottom Sheet

```tsx
<View style={styles.sheet}>
  <View style={styles.handle} />
  <Text weight="bold" size="xl" style={{ marginBottom: Spacing.lg }}>
    Titre
  </Text>
  {/* Contenu */}
  <View style={{ gap: Spacing.md, marginTop: Spacing.xl }}>
    <Button variant="primary" label="Confirmer" onPress={handleConfirm} fullWidth />
    <Button variant="ghost" label="Annuler" onPress={handleCancel} fullWidth />
  </View>
</View>

// Styles
sheet: {
  backgroundColor: Colors.backgroundElevated,
  borderTopLeftRadius: BorderRadius['2xl'],
  borderTopRightRadius: BorderRadius['2xl'],
  padding: Spacing.xl,
  paddingBottom: Spacing['3xl'],
},
handle: {
  width: 40,
  height: 4,
  borderRadius: BorderRadius.full,
  backgroundColor: Colors.border,
  alignSelf: 'center',
  marginBottom: Spacing.lg,
},
```

### Pattern Section avec titre

```tsx
<View style={{ gap: Spacing.md }}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    <Text weight="bold" size="lg">{sectionTitle}</Text>
    <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
      <Text size="sm" color={Colors.terracotta} weight="semibold">Voir tout</Text>
    </TouchableOpacity>
  </View>
  {/* Contenu de la section */}
</View>
```

### Pattern Etat de chargement

```tsx
if (isLoading) {
  return (
    <View style={styles.centered}>
      <Loader />
    </View>
  );
}

if (error) {
  return (
    <EmptyState
      title="Erreur de chargement"
      description="Reessayez dans quelques instants"
      action={{ label: 'Reessayer', onPress: refetch }}
    />
  );
}

if (!data?.length) {
  return (
    <EmptyState
      title="Rien ici pour le moment"
      description="Commencez par ajouter un element"
    />
  );
}
```

## Anti-patterns a eviter

| Anti-pattern | Correction |
|-------------|------------|
| `color: '#333'` | `color: Colors.textPrimary` |
| `padding: 16` | `padding: Spacing.base` |
| `borderRadius: 12` | `borderRadius: BorderRadius.md` |
| `fontSize: 14` | `fontSize: Typography.fontSize.sm` |
| `fontWeight: '600'` | Via composant `<Text weight="semibold">` |
| `shadowColor: '#000'` | Utiliser `Shadows.card` ou `Shadows.sm` |
| `<TouchableOpacity>` nu | Utiliser `<Button>` ou ajouter `accessibilityRole` |
| Inline styles complexes | Extraire dans `StyleSheet.create()` |
| Composant > 200 lignes | Decomposer en sous-composants |
