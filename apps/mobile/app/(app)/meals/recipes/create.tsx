import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius, Typography } from '../../../../src/constants/tokens';
import { Text } from '../../../../src/components/ui/Text';
import { useCreateRecipe, useIngredientSearch } from '../../../../src/lib/queries/recipes';
import type { RecipeFormValues, RecipeDifficulty, Ingredient } from '../../../../src/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const recipeSchema = z.object({
  title: z.string().min(2, 'Titre requis (2 caractères minimum)'),
  description: z.string().optional(),
  prep_time: z.number({ error: 'Durée requise' }).min(0, 'Doit être >= 0'),
  cook_time: z.number({ error: 'Durée requise' }).min(0, 'Doit être >= 0'),
  servings: z.number().min(1).max(20),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()),
  steps: z
    .array(z.object({ order: z.number(), text: z.string().min(1, 'Étape requise') }))
    .min(1, 'Au moins une étape requise'),
  ingredients: z
    .array(
      z.object({
        ingredient_id: z.string().min(1, 'Sélectionnez un ingrédient'),
        quantity: z.number({ error: 'Quantité requise' }).min(0),
        unit: z.string().min(1, 'Unité requise'),
        optional: z.boolean(),
        note: z.string().optional(),
      })
    )
    .min(1, 'Au moins un ingrédient requis'),
});

type RecipeSchemaValues = z.infer<typeof recipeSchema>;

// ─── Constants ─────────────────────────────────────────────────────────────────

const DIFFICULTY_OPTIONS: { value: RecipeDifficulty; label: string }[] = [
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard', label: 'Difficile' },
];

const TAG_OPTIONS = [
  'rapide',
  'vegetarien',
  'vegan',
  'familial',
  'batch-cooking',
  'sans-gluten',
  'economique',
];

const COMMON_UNITS = ['g', 'kg', 'ml', 'L', 'c. à soupe', 'c. à café', 'pièce(s)', 'tranche(s)', 'poignée'];

// ─── Ingredient Row ────────────────────────────────────────────────────────────

interface IngredientRowProps {
  index: number;
  control: ReturnType<typeof useForm<RecipeSchemaValues>>['control'];
  onRemove: (index: number) => void;
  errors?: {
    ingredient_id?: { message?: string };
    quantity?: { message?: string };
    unit?: { message?: string };
  };
}

function IngredientRow({ index, control, onRemove, errors }: IngredientRowProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const { data: searchResults } = useIngredientSearch(searchQuery);

  return (
    <Controller
      control={control}
      name={`ingredients.${index}`}
      render={({ field: { onChange, value } }) => (
        <View style={ingredientStyles.row}>
          {/* Row header */}
          <View style={ingredientStyles.rowHeader}>
            <Text style={ingredientStyles.rowIndex}>{index + 1}</Text>
            <TouchableOpacity
              onPress={() => onRemove(index)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={ingredientStyles.removeBtn}
              accessibilityLabel="Supprimer l'ingrédient"
            >
              <Ionicons name="close-circle" size={20} color={Colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Ingredient search */}
          <View style={ingredientStyles.searchContainer}>
            <View
              style={[
                ingredientStyles.searchInput,
                errors?.ingredient_id && ingredientStyles.inputError,
              ]}
            >
              <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={ingredientStyles.searchIcon} />
              <TextInput
                style={ingredientStyles.searchTextInput}
                placeholder="Rechercher un ingrédient…"
                placeholderTextColor={Colors.placeholder}
                value={selectedName || searchQuery}
                onChangeText={(text) => {
                  setSelectedName('');
                  setSearchQuery(text);
                  setShowDropdown(text.length >= 2);
                }}
                onFocus={() => {
                  if (searchQuery.length >= 2) setShowDropdown(true);
                }}
              />
              {(selectedName || searchQuery) ? (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedName('');
                    setSearchQuery('');
                    setShowDropdown(false);
                    onChange({ ...value, ingredient_id: '', unit: '' });
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle-outline" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Dropdown */}
            {showDropdown && searchResults && searchResults.length > 0 && (
              <View style={ingredientStyles.dropdown}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  style={{ maxHeight: 160 }}
                >
                  {searchResults.map((ing: Ingredient) => (
                    <TouchableOpacity
                      key={ing.id}
                      style={ingredientStyles.dropdownItem}
                      onPress={() => {
                        onChange({
                          ...value,
                          ingredient_id: ing.id,
                          unit: value.unit || ing.default_unit,
                        });
                        setSelectedName(ing.name);
                        setSearchQuery('');
                        setShowDropdown(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={ingredientStyles.dropdownItemText}>{ing.name}</Text>
                      <Text style={ingredientStyles.dropdownItemUnit}>{ing.default_unit}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {errors?.ingredient_id && (
            <Text style={ingredientStyles.errorText}>{errors.ingredient_id.message}</Text>
          )}

          {/* Quantity + Unit + Optional */}
          <View style={ingredientStyles.qtyRow}>
            {/* Quantity */}
            <View style={[ingredientStyles.qtyInput, errors?.quantity && ingredientStyles.inputError]}>
              <TextInput
                style={ingredientStyles.qtyTextInput}
                placeholder="Qté"
                placeholderTextColor={Colors.placeholder}
                keyboardType="decimal-pad"
                value={value.quantity > 0 ? String(value.quantity) : ''}
                onChangeText={(text) => {
                  const num = parseFloat(text.replace(',', '.'));
                  onChange({ ...value, quantity: isNaN(num) ? 0 : num });
                }}
              />
            </View>

            {/* Unit selector */}
            <View style={ingredientStyles.unitContainer}>
              <TouchableOpacity
                style={[ingredientStyles.unitButton, errors?.unit && ingredientStyles.inputError]}
                onPress={() => setShowUnitPicker(!showUnitPicker)}
                activeOpacity={0.7}
              >
                <Text style={ingredientStyles.unitText} numberOfLines={1}>
                  {value.unit || 'Unité'}
                </Text>
                <Ionicons name="chevron-down" size={12} color={Colors.textMuted} />
              </TouchableOpacity>

              {showUnitPicker && (
                <View style={ingredientStyles.unitDropdown}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                    {COMMON_UNITS.map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[
                          ingredientStyles.unitOption,
                          value.unit === u && ingredientStyles.unitOptionSelected,
                        ]}
                        onPress={() => {
                          onChange({ ...value, unit: u });
                          setShowUnitPicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            ingredientStyles.unitOptionText,
                            value.unit === u && ingredientStyles.unitOptionTextSelected,
                          ]}
                        >
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Optional toggle */}
            <TouchableOpacity
              style={[
                ingredientStyles.optionalToggle,
                value.optional && ingredientStyles.optionalToggleActive,
              ]}
              onPress={() => onChange({ ...value, optional: !value.optional })}
              activeOpacity={0.8}
              accessibilityLabel="Optionnel"
            >
              <Text
                style={[
                  ingredientStyles.optionalText,
                  value.optional && ingredientStyles.optionalTextActive,
                ]}
              >
                Optionnel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreateRecipeScreen() {
  const router = useRouter();
  const createRecipe = useCreateRecipe();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecipeSchemaValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: '',
      description: '',
      prep_time: 0,
      cook_time: 0,
      servings: 4,
      difficulty: 'easy',
      tags: [],
      steps: [{ order: 1, text: '' }],
      ingredients: [
        { ingredient_id: '', quantity: 0, unit: '', optional: false, note: '' },
      ],
    },
  });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({ control, name: 'steps' });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({ control, name: 'ingredients' });

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const onSubmit = useCallback(
    async (values: RecipeSchemaValues) => {
      createRecipe.mutate(values as RecipeFormValues, {
        onSuccess: (recipe) => {
          router.replace(`/(app)/meals/recipes/${recipe.id}`);
        },
      });
    },
    [createRecipe, router]
  );

  const isLoading = isSubmitting || createRecipe.isPending;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kavContainer}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Nouvelle recette</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Fermer"
            >
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Form content */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Title ──────────────────────────────────────────── */}
            <SectionHeader label="Informations générales" />

            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Titre *</Text>
                  <TextInput
                    style={[styles.textInput, errors.title && styles.inputError]}
                    placeholder="Ex : Ratatouille provençale"
                    placeholderTextColor={Colors.placeholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    returnKeyType="next"
                    autoCapitalize="sentences"
                  />
                  {errors.title && (
                    <Text style={styles.errorText}>{errors.title.message}</Text>
                  )}
                </View>
              )}
            />

            {/* Description */}
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Description (optionnel)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Décrivez votre recette…"
                    placeholderTextColor={Colors.placeholder}
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              )}
            />

            {/* ── Times ──────────────────────────────────────────── */}
            <View style={styles.rowFields}>
              <Controller
                control={control}
                name="prep_time"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.fieldGroup, styles.halfField]}>
                    <Text style={styles.fieldLabel}>Prép. (min) *</Text>
                    <TextInput
                      style={[styles.textInput, errors.prep_time && styles.inputError]}
                      placeholder="15"
                      placeholderTextColor={Colors.placeholder}
                      value={value > 0 ? String(value) : ''}
                      onChangeText={(text) => onChange(parseInt(text) || 0)}
                      onBlur={onBlur}
                      keyboardType="number-pad"
                    />
                    {errors.prep_time && (
                      <Text style={styles.errorText}>{errors.prep_time.message}</Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="cook_time"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.fieldGroup, styles.halfField]}>
                    <Text style={styles.fieldLabel}>Cuisson (min) *</Text>
                    <TextInput
                      style={[styles.textInput, errors.cook_time && styles.inputError]}
                      placeholder="30"
                      placeholderTextColor={Colors.placeholder}
                      value={value > 0 ? String(value) : ''}
                      onChangeText={(text) => onChange(parseInt(text) || 0)}
                      onBlur={onBlur}
                      keyboardType="number-pad"
                    />
                    {errors.cook_time && (
                      <Text style={styles.errorText}>{errors.cook_time.message}</Text>
                    )}
                  </View>
                )}
              />
            </View>

            {/* ── Servings ───────────────────────────────────────── */}
            <Controller
              control={control}
              name="servings"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Portions *</Text>
                  <View style={styles.counter}>
                    <TouchableOpacity
                      style={[styles.counterBtn, value <= 1 && styles.counterBtnDisabled]}
                      onPress={() => onChange(Math.max(1, value - 1))}
                      disabled={value <= 1}
                      accessibilityLabel="Diminuer les portions"
                    >
                      <Ionicons
                        name="remove"
                        size={20}
                        color={value <= 1 ? Colors.textMuted : Colors.primary}
                      />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{value}</Text>
                    <TouchableOpacity
                      style={[styles.counterBtn, value >= 20 && styles.counterBtnDisabled]}
                      onPress={() => onChange(Math.min(20, value + 1))}
                      disabled={value >= 20}
                      accessibilityLabel="Augmenter les portions"
                    >
                      <Ionicons
                        name="add"
                        size={20}
                        color={value >= 20 ? Colors.textMuted : Colors.primary}
                      />
                    </TouchableOpacity>
                    <Text style={styles.counterUnit}>
                      {value <= 1 ? 'personne' : 'personnes'}
                    </Text>
                  </View>
                </View>
              )}
            />

            {/* ── Difficulty ─────────────────────────────────────── */}
            <Controller
              control={control}
              name="difficulty"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Difficulté *</Text>
                  <View style={styles.chipsRow}>
                    {DIFFICULTY_OPTIONS.map((opt) => {
                      const active = value === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => onChange(opt.value)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            />

            {/* ── Tags ───────────────────────────────────────────── */}
            <Controller
              control={control}
              name="tags"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Tags</Text>
                  <View style={styles.chipsRow}>
                    {TAG_OPTIONS.map((tag) => {
                      const active = value.includes(tag);
                      return (
                        <TouchableOpacity
                          key={tag}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() =>
                            onChange(
                              active ? value.filter((t) => t !== tag) : [...value, tag]
                            )
                          }
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            />

            {/* ── Ingredients ────────────────────────────────────── */}
            <SectionHeader label="Ingrédients" />

            {errors.ingredients?.root && (
              <Text style={[styles.errorText, { marginBottom: Spacing.sm }]}>
                {errors.ingredients.root.message}
              </Text>
            )}

            {ingredientFields.map((field, index) => (
              <IngredientRow
                key={field.id}
                index={index}
                control={control}
                onRemove={removeIngredient}
                errors={errors.ingredients?.[index]}
              />
            ))}

            <TouchableOpacity
              style={styles.addRowBtn}
              onPress={() =>
                appendIngredient({ ingredient_id: '', quantity: 0, unit: '', optional: false, note: '' })
              }
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.addRowText}>Ajouter un ingrédient</Text>
            </TouchableOpacity>

            {/* ── Steps ──────────────────────────────────────────── */}
            <SectionHeader label="Étapes" />

            {errors.steps?.root && (
              <Text style={[styles.errorText, { marginBottom: Spacing.sm }]}>
                {errors.steps.root.message}
              </Text>
            )}

            {stepFields.map((field, index) => (
              <Controller
                key={field.id}
                control={control}
                name={`steps.${index}.text`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.stepInputContainer}>
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.stepInput,
                          errors.steps?.[index]?.text && styles.inputError,
                        ]}
                        placeholder={`Décrire l'étape ${index + 1}…`}
                        placeholderTextColor={Colors.placeholder}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        multiline
                        textAlignVertical="top"
                        returnKeyType="next"
                      />
                      {errors.steps?.[index]?.text && (
                        <Text style={styles.errorText}>
                          {errors.steps[index]?.text?.message}
                        </Text>
                      )}
                    </View>
                    {stepFields.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeStep(index)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.stepRemoveBtn}
                        accessibilityLabel="Supprimer l'étape"
                      >
                        <Ionicons name="close-circle" size={20} color={Colors.accent} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
            ))}

            <TouchableOpacity
              style={styles.addRowBtn}
              onPress={() => appendStep({ order: stepFields.length + 1, text: '' })}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.addRowText}>Ajouter une étape</Text>
            </TouchableOpacity>

            {/* Bottom spacer */}
            <View style={{ height: Spacing['2xl'] }} />
          </ScrollView>

          {/* ── CTA Footer ─────────────────────────────────────── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              activeOpacity={0.8}
              accessibilityLabel="Créer la recette"
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textInverse} />
                  <Text style={styles.ctaText}>Créer la recette</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.label}>{label}</Text>
      <View style={sectionStyles.divider} />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  kavContainer: {
    maxHeight: '95%',
  },
  sheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSubtle,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
  },

  // Fields
  fieldGroup: {
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  textInput: {
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    minHeight: 44,
  },
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error,
    marginTop: 2,
  },
  rowFields: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  halfField: {
    flex: 1,
    marginBottom: 0,
  },

  // Counter (servings)
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnDisabled: {
    opacity: 0.4,
  },
  counterValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    minWidth: 32,
    textAlign: 'center',
  },
  counterUnit: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textInverse,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Steps
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  stepInputContainer: {
    flex: 1,
    gap: 2,
  },
  stepInput: {
    minHeight: 60,
    paddingTop: Spacing.sm + 2,
  },
  stepRemoveBtn: {
    paddingTop: 10,
    paddingLeft: Spacing.xs,
  },

  // Add row button
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary + '60',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '08',
    marginBottom: Spacing.lg,
    minHeight: 44,
  },
  addRowText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary,
  },

  // Footer CTA
  footer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.backgroundCard,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.md + 2,
    minHeight: 52,
  },
  ctaButtonDisabled: {
    opacity: 0.55,
  },
  ctaText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textInverse,
  },
});

const sectionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.extrabold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    flexShrink: 0,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
});

const ingredientStyles = StyleSheet.create({
  row: {
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowIndex: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  removeBtn: {
    padding: 2,
  },

  // Search
  searchContainer: {
    position: 'relative',
    zIndex: 10,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchTextInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginTop: 2,
    zIndex: 100,
    shadowColor: '#3D2C22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    minHeight: 44,
  },
  dropdownItemText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  dropdownItemUnit: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },

  // Qty + Unit row
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qtyInput: {
    flex: 0,
    width: 72,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  qtyTextInput: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
    minHeight: 44,
  },

  // Unit
  unitContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 20,
  },
  unitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.sm,
    minHeight: 44,
    gap: 4,
  },
  unitText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  unitDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginTop: 2,
    zIndex: 100,
    shadowColor: '#3D2C22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  unitOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    minHeight: 44,
    justifyContent: 'center',
  },
  unitOptionSelected: {
    backgroundColor: Colors.primary + '14',
  },
  unitOptionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  unitOptionTextSelected: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Optional toggle
  optionalToggle: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionalToggleActive: {
    borderColor: Colors.joy,
    backgroundColor: Colors.joy + '1A',
  },
  optionalText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },
  optionalTextActive: {
    color: Colors.joy,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Errors
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error,
    marginTop: 2,
  },
});
