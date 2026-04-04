-- ============================================================
-- Keurzen — Meal Planning Seed Data
--
-- ~200 ingredients + ~50 starter French recipes
-- All idempotent (ON CONFLICT DO NOTHING)
-- ============================================================

-- ─── INGREDIENTS ────────────────────────────────────────────────────────────

-- fruits_legumes (~50)
INSERT INTO public.ingredients (name, category, default_unit) VALUES
  ('tomate',            'fruits_legumes', 'piece'),
  ('oignon',            'fruits_legumes', 'piece'),
  ('ail',               'fruits_legumes', 'gousse'),
  ('carotte',           'fruits_legumes', 'piece'),
  ('pomme de terre',    'fruits_legumes', 'piece'),
  ('courgette',         'fruits_legumes', 'piece'),
  ('poivron vert',      'fruits_legumes', 'piece'),
  ('poivron rouge',     'fruits_legumes', 'piece'),
  ('poivron jaune',     'fruits_legumes', 'piece'),
  ('aubergine',         'fruits_legumes', 'piece'),
  ('champignon',        'fruits_legumes', 'g'),
  ('salade verte',      'fruits_legumes', 'piece'),
  ('epinard',           'fruits_legumes', 'g'),
  ('brocoli',           'fruits_legumes', 'piece'),
  ('haricot vert',      'fruits_legumes', 'g'),
  ('petit pois',        'fruits_legumes', 'g'),
  ('citron',            'fruits_legumes', 'piece'),
  ('avocat',            'fruits_legumes', 'piece'),
  ('concombre',         'fruits_legumes', 'piece'),
  ('poireau',           'fruits_legumes', 'piece'),
  ('celeri',            'fruits_legumes', 'piece'),
  ('navet',             'fruits_legumes', 'piece'),
  ('potiron',           'fruits_legumes', 'g'),
  ('echalote',          'fruits_legumes', 'piece'),
  ('persil',            'fruits_legumes', 'botte'),
  ('coriandre',         'fruits_legumes', 'botte'),
  ('basilic',           'fruits_legumes', 'botte'),
  ('thym',              'fruits_legumes', 'botte'),
  ('romarin',           'fruits_legumes', 'botte'),
  ('menthe',            'fruits_legumes', 'botte'),
  ('gingembre',         'fruits_legumes', 'g'),
  ('chou-fleur',        'fruits_legumes', 'piece'),
  ('fenouil',           'fruits_legumes', 'piece'),
  ('artichaut',         'fruits_legumes', 'piece'),
  ('radis',             'fruits_legumes', 'botte'),
  ('chou',              'fruits_legumes', 'piece'),
  ('endive',            'fruits_legumes', 'piece'),
  ('betterave',         'fruits_legumes', 'piece'),
  ('asperge',           'fruits_legumes', 'botte'),
  ('mais',              'fruits_legumes', 'piece'),
  ('olive noire',       'fruits_legumes', 'g'),
  ('cornichon',         'fruits_legumes', 'piece'),
  ('lentille verte',    'fruits_legumes', 'g'),
  ('pois chiche',       'fruits_legumes', 'g'),
  ('haricot blanc',     'fruits_legumes', 'g'),
  ('patate douce',      'fruits_legumes', 'piece'),
  ('courge butternut',  'fruits_legumes', 'piece'),
  ('banane',            'fruits_legumes', 'piece'),
  ('pomme',             'fruits_legumes', 'piece'),
  ('orange',            'fruits_legumes', 'piece'),
  ('framboise',         'fruits_legumes', 'g'),
  ('tomate cerise',     'fruits_legumes', 'g'),
  ('laurier',           'fruits_legumes', 'piece')
ON CONFLICT (name) DO NOTHING;

-- viandes_poissons (~25)
INSERT INTO public.ingredients (name, category, default_unit) VALUES
  ('poulet entier',       'viandes_poissons', 'piece'),
  ('blanc de poulet',     'viandes_poissons', 'g'),
  ('cuisse de poulet',    'viandes_poissons', 'piece'),
  ('boeuf',               'viandes_poissons', 'g'),
  ('steak hache',         'viandes_poissons', 'g'),
  ('roti de boeuf',       'viandes_poissons', 'g'),
  ('porc',                'viandes_poissons', 'g'),
  ('roti de porc',        'viandes_poissons', 'g'),
  ('filet mignon',        'viandes_poissons', 'g'),
  ('agneau',              'viandes_poissons', 'g'),
  ('epaule d''agneau',    'viandes_poissons', 'g'),
  ('veau',                'viandes_poissons', 'g'),
  ('escalope de veau',    'viandes_poissons', 'g'),
  ('canard',              'viandes_poissons', 'g'),
  ('magret de canard',    'viandes_poissons', 'piece'),
  ('dinde',               'viandes_poissons', 'g'),
  ('saumon',              'viandes_poissons', 'g'),
  ('filet de saumon',     'viandes_poissons', 'piece'),
  ('cabillaud',           'viandes_poissons', 'g'),
  ('filet de cabillaud',  'viandes_poissons', 'piece'),
  ('crevette',            'viandes_poissons', 'g'),
  ('thon en boite',       'viandes_poissons', 'g'),
  ('lardon',              'viandes_poissons', 'g'),
  ('jambon',              'viandes_poissons', 'tranche'),
  ('saucisse',            'viandes_poissons', 'piece'),
  ('merlu',               'viandes_poissons', 'g'),
  ('moule',               'viandes_poissons', 'g'),
  ('truite',              'viandes_poissons', 'piece'),
  ('sardine',             'viandes_poissons', 'piece'),
  ('escalope de poulet',  'viandes_poissons', 'piece')
ON CONFLICT (name) DO NOTHING;

-- produits_laitiers (~20)
INSERT INTO public.ingredients (name, category, default_unit) VALUES
  ('beurre',          'produits_laitiers', 'g'),
  ('beurre doux',     'produits_laitiers', 'g'),
  ('creme fraiche',   'produits_laitiers', 'g'),
  ('creme liquide',   'produits_laitiers', 'ml'),
  ('lait',            'produits_laitiers', 'ml'),
  ('lait entier',     'produits_laitiers', 'ml'),
  ('fromage rape',    'produits_laitiers', 'g'),
  ('parmesan',        'produits_laitiers', 'g'),
  ('mozzarella',      'produits_laitiers', 'g'),
  ('chevre',          'produits_laitiers', 'g'),
  ('yaourt',          'produits_laitiers', 'piece'),
  ('oeuf',            'produits_laitiers', 'piece'),
  ('mascarpone',      'produits_laitiers', 'g'),
  ('ricotta',         'produits_laitiers', 'g'),
  ('roquefort',       'produits_laitiers', 'g'),
  ('emmental',        'produits_laitiers', 'g'),
  ('fromage blanc',   'produits_laitiers', 'g'),
  ('gruyere',         'produits_laitiers', 'g'),
  ('creme epaisse',   'produits_laitiers', 'g'),
  ('lait demi-ecreme','produits_laitiers', 'ml')
ON CONFLICT (name) DO NOTHING;

-- boulangerie (~10)
INSERT INTO public.ingredients (name, category, default_unit) VALUES
  ('pain',            'boulangerie', 'piece'),
  ('pain de mie',     'boulangerie', 'tranche'),
  ('pate brisee',     'boulangerie', 'piece'),
  ('pate feuilletee', 'boulangerie', 'piece'),
  ('tortilla',        'boulangerie', 'piece'),
  ('chapelure',       'boulangerie', 'g'),
  ('brioche',         'boulangerie', 'piece'),
  ('croissant',       'boulangerie', 'piece'),
  ('farine a pain',   'boulangerie', 'g'),
  ('pate a pizza',    'boulangerie', 'piece')
ON CONFLICT (name) DO NOTHING;

-- epicerie (~55)
INSERT INTO public.ingredients (name, category, default_unit) VALUES
  ('pate',                   'epicerie', 'g'),
  ('spaghetti',              'epicerie', 'g'),
  ('penne',                  'epicerie', 'g'),
  ('tagliatelle',            'epicerie', 'g'),
  ('riz',                    'epicerie', 'g'),
  ('riz basmati',            'epicerie', 'g'),
  ('semoule',                'epicerie', 'g'),
  ('boulgour',               'epicerie', 'g'),
  ('quinoa',                 'epicerie', 'g'),
  ('nouille',                'epicerie', 'g'),
  ('vermicelle',             'epicerie', 'g'),
  ('farine',                 'epicerie', 'g'),
  ('farine de ble',          'epicerie', 'g'),
  ('huile olive',            'epicerie', 'ml'),
  ('huile tournesol',        'epicerie', 'ml'),
  ('vinaigre',               'epicerie', 'ml'),
  ('vinaigre balsamique',    'epicerie', 'ml'),
  ('moutarde',               'epicerie', 'cs'),
  ('sauce soja',             'epicerie', 'cs'),
  ('concentre de tomate',    'epicerie', 'cs'),
  ('tomate pelee en boite',  'epicerie', 'g'),
  ('bouillon cube',          'epicerie', 'piece'),
  ('curry en poudre',        'epicerie', 'cc'),
  ('cumin',                  'epicerie', 'cc'),
  ('paprika',                'epicerie', 'cc'),
  ('paprika fume',           'epicerie', 'cc'),
  ('sel',                    'epicerie', 'g'),
  ('poivre',                 'epicerie', 'g'),
  ('sucre',                  'epicerie', 'g'),
  ('miel',                   'epicerie', 'cs'),
  ('noix',                   'epicerie', 'g'),
  ('amande',                 'epicerie', 'g'),
  ('noix de cajou',          'epicerie', 'g'),
  ('raisin sec',             'epicerie', 'g'),
  ('pruneau',                'epicerie', 'g'),
  ('olive verte',            'epicerie', 'g'),
  ('capre',                  'epicerie', 'g'),
  ('lait de coco',           'epicerie', 'ml'),
  ('creme de coco',          'epicerie', 'ml'),
  ('maizena',                'epicerie', 'g'),
  ('vin blanc',              'epicerie', 'ml'),
  ('vin rouge',              'epicerie', 'ml'),
  ('piment',                 'epicerie', 'piece'),
  ('piment en poudre',       'epicerie', 'cc'),
  ('cacao',                  'epicerie', 'g'),
  ('chocolat noir',          'epicerie', 'g'),
  ('levure',                 'epicerie', 'g'),
  ('bicarbonate',            'epicerie', 'g'),
  ('sauce tomate',           'epicerie', 'ml'),
  ('ketchup',                'epicerie', 'cs'),
  ('mayonnaise',             'epicerie', 'cs'),
  ('vinaigre de cidre',      'epicerie', 'ml'),
  ('harissa',                'epicerie', 'cc'),
  ('ras el hanout',          'epicerie', 'cc'),
  ('pate de curry rouge',    'epicerie', 'cs'),
  ('pate de curry vert',     'epicerie', 'cs'),
  ('sauce worcestershire',   'epicerie', 'cs'),
  ('tabasco',                'epicerie', 'cc'),
  ('lasagne seche',          'epicerie', 'g'),
  ('pois casse',             'epicerie', 'g'),
  ('haricot rouge en boite', 'epicerie', 'g'),
  ('huile de sesame',        'epicerie', 'cs'),
  ('sauce huitre',           'epicerie', 'cs'),
  ('vinaigre de riz',        'epicerie', 'cs'),
  ('fumet de poisson',       'epicerie', 'ml'),
  ('safran',                 'epicerie', 'g'),
  ('cannelle',               'epicerie', 'cc'),
  ('gingembre en poudre',    'epicerie', 'cc'),
  ('coriandre en poudre',    'epicerie', 'cc'),
  ('quatre epices',          'epicerie', 'cc'),
  ('herbes de provence',     'epicerie', 'cc')
ON CONFLICT (name) DO NOTHING;

-- surgeles (~6)
INSERT INTO public.ingredients (name, category, default_unit) VALUES
  ('petits pois surgeles',   'surgeles', 'g'),
  ('epinards surgeles',      'surgeles', 'g'),
  ('fruits rouges surgeles', 'surgeles', 'g'),
  ('poisson pane',           'surgeles', 'piece'),
  ('frites surgeles',        'surgeles', 'g'),
  ('crevettes cuites',       'surgeles', 'g')
ON CONFLICT (name) DO NOTHING;

-- boissons (~5)
INSERT INTO public.ingredients (name, category, default_unit) VALUES
  ('biere',           'boissons', 'cl'),
  ('cidre',           'boissons', 'cl'),
  ('jus de citron',   'boissons', 'ml'),
  ('jus d''orange',   'boissons', 'ml'),
  ('eau',             'boissons', 'ml')
ON CONFLICT (name) DO NOTHING;


-- ─── RECIPES ────────────────────────────────────────────────────────────────

DO $$
DECLARE
  r_id  UUID;
  ing   UUID;
BEGIN

  -- ============================================================
  -- VIANDES
  -- ============================================================

  -- 1. Poulet roti
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Poulet roti',
    'Un grand classique dominical : poulet doré au four, parfumé à l''ail et au romarin, avec une peau croustillante irrésistible.',
    15, 75, 4, 'easy',
    ARRAY['familial','batch-cooking'],
    '[{"order":1,"text":"Préchauffer le four à 200°C."},{"order":2,"text":"Frotter le poulet avec du beurre mou, sel, poivre, ail écrasé et romarin."},{"order":3,"text":"Placer dans un plat avec un fond d''eau et enfourner 1h15 en arrosant toutes les 20 minutes."},{"order":4,"text":"Laisser reposer 10 minutes avant de découper."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poulet entier';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 50, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'romarin';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'botte', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'sel';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 5, 'g', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poivre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'g', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'citron';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', true);
  END IF;

  -- 2. Boeuf bourguignon
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Boeuf bourguignon',
    'Mijotage généreux de boeuf au vin rouge avec champignons, carottes et lardons — un plat qui réchauffe toute la maison.',
    30, 180, 6, 'medium',
    ARRAY['familial','hiver','batch-cooking'],
    '[{"order":1,"text":"Faire dorer les morceaux de boeuf à feu vif dans la cocotte avec un filet d''huile."},{"order":2,"text":"Retirer la viande. Faire revenir les lardons, oignons et carottes."},{"order":3,"text":"Remettre la viande, ajouter le vin rouge, le bouillon cube et le thym. Couvrir."},{"order":4,"text":"Mijoter à feu doux 3h en remuant de temps en temps."},{"order":5,"text":"Ajouter les champignons 30 minutes avant la fin. Rectifier l''assaisonnement."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'boeuf';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'vin rouge';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 750, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'carotte';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lardon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'champignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'bouillon cube';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'thym';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'ml', true);
  END IF;

  -- 3. Blanquette de veau
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Blanquette de veau',
    'Recette classique française : veau mijoté dans un bouillon crémeux avec champignons et carottes, servi avec du riz.',
    20, 90, 4, 'medium',
    ARRAY['familial','hiver'],
    '[{"order":1,"text":"Faire blanchir les morceaux de veau 5 minutes dans l''eau bouillante salée, égoutter."},{"order":2,"text":"Couvrir le veau de bouillon avec oignons, carottes et thym. Cuire 1h à frémissement."},{"order":3,"text":"Préparer un roux : beurre + farine. Mouiller avec le bouillon de cuisson."},{"order":4,"text":"Ajouter la crème fraîche et les champignons. Mijoter 15 min."},{"order":5,"text":"Ajouter la viande égouttée, rectifier l''assaisonnement et servir avec du riz."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'veau';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1000, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'carotte';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'champignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'creme fraiche';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 40, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'farine';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'thym';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'riz';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', true);
  END IF;

  -- 4. Poulet basquaise
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Poulet basquaise',
    'Poulet mijoté dans une sauce tomate aux poivrons colorés et au piment d''Espelette — ensoleillé et parfumé.',
    20, 60, 4, 'medium',
    ARRAY['familial','ete'],
    '[{"order":1,"text":"Faire dorer les cuisses de poulet à l''huile d''olive. Réserver."},{"order":2,"text":"Faire revenir oignons, ail et poivrons en lanières 10 minutes."},{"order":3,"text":"Ajouter les tomates pelées, concentré de tomate, thym et piment. Saler."},{"order":4,"text":"Remettre le poulet dans la cocotte. Couvrir et mijoter 45 minutes."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'cuisse de poulet';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poivron rouge';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poivron vert';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate pelee en boite';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'concentre de tomate';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'piment en poudre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cc', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'ml', true);
  END IF;

  -- 5. Coq au vin
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Coq au vin',
    'Poulet longuement mijoté dans un vin rouge avec des champignons et des lardons — la quintessence de la cuisine de terroir français.',
    25, 90, 4, 'medium',
    ARRAY['familial','hiver','fete'],
    '[{"order":1,"text":"Faire dorer les morceaux de poulet dans du beurre. Réserver."},{"order":2,"text":"Faire revenir les lardons, échalotes et champignons dans la même cocotte."},{"order":3,"text":"Remettre le poulet, flamber au cognac, puis mouiller avec le vin rouge."},{"order":4,"text":"Ajouter thym, laurier, sel et poivre. Mijoter 1h15 à couvert."},{"order":5,"text":"Rectifier la sauce et servir avec des pommes de terre vapeur."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poulet entier';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'vin rouge';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 750, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lardon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'champignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'echalote';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'thym';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'laurier';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'g', true);
  END IF;

  -- 6. Hachis parmentier
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Hachis parmentier',
    'Couche généreuse de purée dorée sur un fond de viande hachée parfumée — le plat réconfortant par excellence.',
    20, 45, 4, 'easy',
    ARRAY['familial','economique','batch-cooking'],
    '[{"order":1,"text":"Cuire les pommes de terre à l''eau salée. Les écraser avec beurre et lait chaud."},{"order":2,"text":"Faire revenir l''oignon et l''ail, ajouter la viande hachée, le concentré de tomate et assaisonner."},{"order":3,"text":"Disposer la viande dans un plat à gratin. Recouvrir de purée."},{"order":4,"text":"Parsemer de fromage râpé et enfourner 20 min à 200°C jusqu''à dorure."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'steak hache';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 600, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pomme de terre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1000, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'concentre de tomate';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 50, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lait';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 150, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'fromage rape';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 80, 'g', false);
  END IF;

  -- 7. Poulet curry
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Poulet curry',
    'Curry doux et crémeux au lait de coco avec des morceaux de poulet tendres — rapide à préparer et apprécié de tous.',
    15, 30, 4, 'easy',
    ARRAY['rapide','familial'],
    '[{"order":1,"text":"Couper le poulet en morceaux et faire dorer dans l''huile avec l''oignon."},{"order":2,"text":"Ajouter l''ail, le gingembre et le curry. Mélanger 1 minute."},{"order":3,"text":"Verser le lait de coco et la sauce tomate. Laisser mijoter 20 minutes."},{"order":4,"text":"Rectifier l''assaisonnement et servir avec du riz basmati."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'blanc de poulet';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 700, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lait de coco';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'curry en poudre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'gingembre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 10, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate pelee en boite';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'riz basmati';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', true);
  END IF;

  -- 8. Steak frites
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Steak frites',
    'Classique indétrônable : steak à la poêle bien saisi et frites maison croustillantes au four.',
    10, 30, 2, 'easy',
    ARRAY['rapide','economique'],
    '[{"order":1,"text":"Couper les pommes de terre en frites. Les disposer sur plaque, huiler et saler."},{"order":2,"text":"Enfourner à 220°C pendant 25-30 minutes en retournant à mi-cuisson."},{"order":3,"text":"Saisir les steaks dans une poêle très chaude avec du beurre, 2-3 min de chaque côté."},{"order":4,"text":"Saler, poivrer et servir immédiatement avec les frites."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'steak hache';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pomme de terre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 600, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 20, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile tournesol';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'ml', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'sel';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 5, 'g', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poivre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'g', true);
  END IF;

  -- 9. Escalope milanaise
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Escalope milanaise',
    'Escalopes de veau panées à la chapelure et cuites au beurre jusqu''à dorure parfaite, servies avec un quartier de citron.',
    15, 10, 4, 'easy',
    ARRAY['rapide','familial'],
    '[{"order":1,"text":"Préparer 3 assiettes : farine, oeuf battu, chapelure avec parmesan."},{"order":2,"text":"Paner chaque escalope successivement dans farine, oeuf puis chapelure."},{"order":3,"text":"Faire dorer dans du beurre à feu moyen 3-4 minutes de chaque côté."},{"order":4,"text":"Égoutter sur du papier absorbant. Servir avec citron et salade."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'escalope de veau';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 600, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'chapelure';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 100, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'parmesan';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 40, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oeuf';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'farine';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 50, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 60, 'g', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'citron';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', true);
  END IF;

  -- 10. Roti de porc aux pruneaux
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Rôti de porc aux pruneaux',
    'Rôti de porc moelleux braisé avec des pruneaux et du vin blanc — un mariage sucré-salé délicieusement fondant.',
    15, 75, 6, 'medium',
    ARRAY['familial','hiver','fete'],
    '[{"order":1,"text":"Faire dorer le rôti sur toutes les faces dans une cocotte avec de l''huile."},{"order":2,"text":"Ajouter l''oignon émincé, l''ail, les pruneaux, le vin blanc et le bouillon."},{"order":3,"text":"Couvrir et enfourner à 180°C pendant 1h15. Arroser régulièrement."},{"order":4,"text":"Sortir la viande, réduire le jus de cuisson et servir en sauce."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'roti de porc';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pruneau';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'vin blanc';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'bouillon cube';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'thym';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'ml', true);
  END IF;


  -- ============================================================
  -- POISSONS
  -- ============================================================

  -- 11. Saumon en papillote
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Saumon en papillote',
    'Filets de saumon cuits à la vapeur dans leur papillote avec citron, aneth et légumes — sain, léger et plein de saveurs.',
    10, 20, 4, 'easy',
    ARRAY['rapide','sans-gluten','ete'],
    '[{"order":1,"text":"Préchauffer le four à 180°C."},{"order":2,"text":"Sur chaque feuille de papier aluminium, déposer un filet de saumon."},{"order":3,"text":"Garnir de rondelles de citron, sel, poivre, huile d''olive et herbes."},{"order":4,"text":"Fermer hermétiquement les papillotes et enfourner 18-20 minutes."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'filet de saumon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'citron';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'persil';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'courgette';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 20, 'ml', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'sel';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'g', true);
  END IF;

  -- 12. Moules-frites
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Moules-frites',
    'Moules marinières cuites dans leur jus de vin blanc avec échalotes et persil, accompagnées de frites maison croustillantes.',
    15, 25, 4, 'easy',
    ARRAY['rapide','economique'],
    '[{"order":1,"text":"Préparer les frites au four (220°C, 25 min)."},{"order":2,"text":"Faire suer échalotes et ail dans le beurre. Ajouter le vin blanc."},{"order":3,"text":"Ajouter les moules nettoyées. Couvrir et secouer à feu vif 5-6 minutes."},{"order":4,"text":"Parsemer de persil haché et servir avec les frites."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'moule';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2000, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'vin blanc';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'echalote';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'persil';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 40, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pomme de terre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 800, 'g', true);
  END IF;

  -- 13. Filet de cabillaud sauce citronnée
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Filet de cabillaud sauce citronnée',
    'Filets de cabillaud dorés à la poêle avec une sauce légère au citron et aux câpres — frais, sain et rapide à préparer.',
    10, 15, 4, 'easy',
    ARRAY['rapide','sans-gluten'],
    '[{"order":1,"text":"Assaisonner les filets de cabillaud de sel et poivre."},{"order":2,"text":"Faire dorer dans le beurre 3-4 minutes de chaque côté. Réserver au chaud."},{"order":3,"text":"Dans la même poêle, faire fondre du beurre avec le jus de citron et les câpres."},{"order":4,"text":"Napper les filets de sauce et servir avec des légumes vapeur."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'filet de cabillaud';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 60, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'citron';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'capre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'persil';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'sel';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'g', true);
  END IF;

  -- 14. Crevettes sautées à l'ail
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Crevettes sautées à l''ail',
    'Crevettes juteuses sautées à l''huile d''olive avec ail, citron et persil — prêtes en moins de 10 minutes.',
    5, 10, 4, 'easy',
    ARRAY['rapide','sans-gluten'],
    '[{"order":1,"text":"Décortiquer les crevettes si nécessaire."},{"order":2,"text":"Chauffer l''huile d''olive dans une grande poêle. Ajouter l''ail émincé."},{"order":3,"text":"Ajouter les crevettes et faire sauter 3-4 minutes à feu vif."},{"order":4,"text":"Déglacer avec le jus de citron, parsemer de persil et servir."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'crevette';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 600, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'citron';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'persil';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 40, 'ml', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'piment en poudre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cc', true);
  END IF;

  -- 15. Truite aux amandes
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Truite aux amandes',
    'Truite meunière nappée d''un beurre aux amandes dorées — un classique élégant qui se prépare en moins de 20 minutes.',
    5, 15, 4, 'easy',
    ARRAY['rapide','sans-gluten'],
    '[{"order":1,"text":"Fariner légèrement les truites, saler et poivrer."},{"order":2,"text":"Faire cuire dans le beurre 5-6 minutes de chaque côté jusqu''à dorure."},{"order":3,"text":"Retirer les truites. Dans la même poêle, faire dorer les amandes effilées."},{"order":4,"text":"Napper les truites de beurre aux amandes et servir avec du citron."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'truite';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'amande';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 80, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 80, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'citron';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'farine';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'sel';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'g', true);
  END IF;

  -- 16. Sardines grillées
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Sardines grillées',
    'Sardines marinées à l''huile d''olive et au citron, grillées à la plancha — simple, économique et savoureux.',
    10, 10, 4, 'easy',
    ARRAY['rapide','economique','ete','sans-gluten'],
    '[{"order":1,"text":"Vider et nettoyer les sardines. Inciser légèrement les flancs."},{"order":2,"text":"Mariner 10 minutes avec huile, citron, ail et herbes."},{"order":3,"text":"Griller 3-4 minutes de chaque côté sur plancha ou barbecue."},{"order":4,"text":"Servir avec de la salade verte et du pain."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'sardine';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 12, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'citron';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'persil';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 40, 'ml', true);
  END IF;


  -- ============================================================
  -- VEGETARIEN
  -- ============================================================

  -- 17. Ratatouille
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Ratatouille',
    'Légumes d''été mijotés dans l''huile d''olive avec tomates et herbes de Provence — colorée, savoureuse et végane.',
    20, 45, 4, 'easy',
    ARRAY['vegetarien','vegan','ete','sans-gluten','batch-cooking'],
    '[{"order":1,"text":"Couper tous les légumes en dés : aubergine, courgette, poivrons, tomates, oignon."},{"order":2,"text":"Faire revenir l''oignon et l''ail dans l''huile d''olive."},{"order":3,"text":"Ajouter les autres légumes par ordre de dureté. Assaisonner."},{"order":4,"text":"Couvrir et mijoter 40 minutes à feu doux. Ajouter les herbes de Provence."},{"order":5,"text":"Servir chaud ou froid avec du pain ou du riz."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'aubergine';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'courgette';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poivron rouge';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'herbes de provence';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 60, 'ml', true);
  END IF;

  -- 18. Gratin de légumes
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Gratin de légumes',
    'Gratin doré et fondant de courgettes, tomates et pommes de terre, recouvert de béchamel et de fromage râpé.',
    20, 40, 4, 'easy',
    ARRAY['vegetarien','familial'],
    '[{"order":1,"text":"Préchauffer le four à 180°C. Couper les légumes en rondelles."},{"order":2,"text":"Préparer une béchamel légère : beurre, farine, lait."},{"order":3,"text":"Alterner les couches de légumes dans un plat à gratin."},{"order":4,"text":"Napper de béchamel et parsemer de fromage râpé."},{"order":5,"text":"Enfourner 35-40 minutes jusqu''à gratinage doré."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'courgette';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pomme de terre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'fromage rape';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 100, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lait';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'farine';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 25, 'g', false);
  END IF;

  -- 19. Galettes de pois chiches
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Galettes de pois chiches',
    'Galettes croustillantes à base de pois chiches, cumin et coriandre — véganes, riches en protéines et délicieuses.',
    15, 15, 4, 'easy',
    ARRAY['vegetarien','vegan','rapide','economique','sans-gluten'],
    '[{"order":1,"text":"Mixer les pois chiches avec l''oeuf, le cumin, la coriandre et l''ail."},{"order":2,"text":"Former des galettes épaisses avec les mains."},{"order":3,"text":"Faire dorer dans l''huile d''olive 3-4 minutes de chaque côté."},{"order":4,"text":"Servir avec une salade verte et du yaourt."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pois chiche';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oeuf';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'cumin';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'coriandre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'ml', true);
  END IF;

  -- 20. Tarte aux légumes
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Tarte aux légumes',
    'Tarte garnie de légumes de saison, d''oeufs et de crème fraîche — modulable et facile à emporter pour un pique-nique.',
    15, 35, 6, 'easy',
    ARRAY['vegetarien','familial','ete'],
    '[{"order":1,"text":"Foncer un moule à tarte avec la pâte brisée. Piquer le fond."},{"order":2,"text":"Faire revenir les légumes coupés en dés dans l''huile d''olive. Laisser refroidir."},{"order":3,"text":"Battre les oeufs avec la crème fraîche, sel, poivre et fromage râpé."},{"order":4,"text":"Répartir les légumes sur la pâte, napper de l''appareil à l''oeuf."},{"order":5,"text":"Enfourner 30-35 minutes à 180°C."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pate brisee';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oeuf';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'creme fraiche';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'courgette';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poivron rouge';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'fromage rape';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 60, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 20, 'ml', true);
  END IF;

  -- 21. Curry de lentilles
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Curry de lentilles',
    'Dal indien réconfortant aux lentilles corail, lait de coco et épices chaudes — végane, économique et rassasiant.',
    10, 30, 4, 'easy',
    ARRAY['vegetarien','vegan','economique','sans-gluten'],
    '[{"order":1,"text":"Faire revenir l''oignon et l''ail dans l''huile avec curry, cumin et gingembre."},{"order":2,"text":"Ajouter les lentilles rincées et les tomates pelées. Mélanger."},{"order":3,"text":"Verser le lait de coco et couvrir d''eau. Cuire 25 minutes à feu doux."},{"order":4,"text":"Rectifier l''assaisonnement et garnir de coriandre fraîche."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lentille verte';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lait de coco';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate pelee en boite';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'curry en poudre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'cumin';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'coriandre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'gingembre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 10, 'g', true);
  END IF;

  -- 22. Buddha bowl
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Buddha bowl',
    'Bol complet et coloré : quinoa, légumes rôtis, avocat et pois chiches avec une sauce tahini — nourrissant et équilibré.',
    20, 25, 2, 'easy',
    ARRAY['vegetarien','vegan','sans-gluten','ete'],
    '[{"order":1,"text":"Cuire le quinoa selon les instructions. Rincer et égoutter."},{"order":2,"text":"Rôtir au four les légumes coupés en morceaux avec huile et épices (200°C, 20 min)."},{"order":3,"text":"Préparer la sauce tahini : tahini, jus de citron, ail, eau."},{"order":4,"text":"Dresser le bol : quinoa, légumes rôtis, avocat tranché, pois chiches."},{"order":5,"text":"Napper de sauce tahini et garnir de graines."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'quinoa';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'avocat';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pois chiche';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'patate douce';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'citron';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'ml', true);
  END IF;

  -- 23. Risotto aux champignons
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Risotto aux champignons',
    'Risotto crémeux et parfumé aux champignons de Paris et champignons séchés, fini au parmesan et à la crème.',
    10, 30, 4, 'medium',
    ARRAY['vegetarien','familial'],
    '[{"order":1,"text":"Faire chauffer le bouillon. Faire revenir l''échalote dans le beurre."},{"order":2,"text":"Ajouter le riz Arborio, nacrer 2 minutes. Ajouter le vin blanc."},{"order":3,"text":"Incorporer le bouillon louche par louche en remuant constamment."},{"order":4,"text":"À mi-cuisson, ajouter les champignons sautés."},{"order":5,"text":"Hors du feu, incorporer le parmesan et le beurre. Rectifier."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'riz';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 320, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'champignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'echalote';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'parmesan';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 80, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'vin blanc';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 150, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'bouillon cube';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 60, 'g', true);
  END IF;

  -- 24. Soupe minestrone
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Soupe minestrone',
    'Soupe généreuse de légumes d''hiver avec des petites pâtes et des haricots blancs — nourrissante et végane.',
    15, 35, 6, 'easy',
    ARRAY['vegetarien','vegan','economique','hiver','batch-cooking'],
    '[{"order":1,"text":"Faire revenir oignon, ail, carotte et céleri dans l''huile d''olive 5 minutes."},{"order":2,"text":"Ajouter les tomates pelées, le bouillon et les herbes. Porter à ébullition."},{"order":3,"text":"Incorporer les haricots blancs et les courgettes. Mijoter 20 minutes."},{"order":4,"text":"Ajouter les petites pâtes 8 minutes avant la fin. Servir avec du parmesan."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate pelee en boite';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'haricot blanc';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'carotte';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'courgette';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'celeri';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pate';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 100, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'bouillon cube';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 40, 'ml', true);
  END IF;


  -- ============================================================
  -- PATES & RIZ
  -- ============================================================

  -- 25. Pâtes carbonara
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Pâtes carbonara',
    'La vraie carbonara italienne : spaghettis al dente enrobés d''une sauce crémeuse aux oeufs, lardons et parmesan sans crème.',
    10, 15, 4, 'easy',
    ARRAY['rapide','familial','economique'],
    '[{"order":1,"text":"Cuire les spaghettis al dente. Réserver une tasse d''eau de cuisson."},{"order":2,"text":"Faire dorer les lardons à sec dans une grande poêle."},{"order":3,"text":"Battre les oeufs entiers avec le parmesan râpé et le poivre."},{"order":4,"text":"Mélanger les pâtes chaudes aux lardons hors du feu."},{"order":5,"text":"Ajouter l''appareil oeuf-parmesan et un peu d''eau de cuisson pour rendre crémeux."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'spaghetti';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lardon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oeuf';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'parmesan';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 100, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poivre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'g', true);
  END IF;

  -- 26. Risotto primavera
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Risotto primavera',
    'Risotto léger et printanier aux petits pois, asperges et parmesan — onctueux et plein de fraîcheur.',
    10, 25, 4, 'medium',
    ARRAY['vegetarien','ete'],
    '[{"order":1,"text":"Faire fondre l''échalote dans le beurre. Nacrer le riz Arborio."},{"order":2,"text":"Mouiller au vin blanc puis au bouillon chaud louche par louche."},{"order":3,"text":"Ajouter les petits pois et les asperges coupées à mi-cuisson."},{"order":4,"text":"Mantecatura finale : beurre froid et parmesan. Rectifier l''assaisonnement."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'riz';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 320, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'petit pois';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'asperge';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'echalote';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'parmesan';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 80, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'vin blanc';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 150, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'bouillon cube';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 60, 'g', true);
  END IF;

  -- 27. Pad thaï maison
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Pad thaï maison',
    'Nouilles de riz sautées à la thaïlandaise avec crevettes, oeufs, pousse de soja et sauce tamarin — savoureux et équilibré.',
    20, 15, 4, 'medium',
    ARRAY['rapide'],
    '[{"order":1,"text":"Faire tremper les nouilles de riz dans l''eau froide 20 minutes."},{"order":2,"text":"Préparer la sauce : sauce soja, vinaigre de riz, sucre, piment."},{"order":3,"text":"Faire sauter les crevettes dans le wok. Réserver. Faire les oeufs brouillés."},{"order":4,"text":"Ajouter les nouilles égouttées et la sauce. Mélanger à feu vif."},{"order":5,"text":"Ajouter les crevettes. Servir avec cacahuètes, citron vert et coriandre."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'vermicelle';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'crevette';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oeuf';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'sauce soja';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'vinaigre de riz';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'sucre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 10, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'noix de cajou';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 60, 'g', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'coriandre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', true);
  END IF;

  -- 28. Lasagnes bolognaise
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Lasagnes bolognaise',
    'Lasagnes gratinées avec une bolognaise maison généreuse et une béchamel fondante — un plat complet et convivial.',
    30, 60, 6, 'medium',
    ARRAY['familial','batch-cooking'],
    '[{"order":1,"text":"Préparer la bolognaise : faire revenir oignon, ail, viande hachée, tomates pelées."},{"order":2,"text":"Préparer la béchamel : beurre, farine, lait, muscade."},{"order":3,"text":"Alterner couches de lasagnes, bolognaise et béchamel dans un grand plat."},{"order":4,"text":"Terminer par béchamel et fromage râpé. Couvrir de papier aluminium."},{"order":5,"text":"Enfourner 40 min à 180°C, retirer le papier les 15 dernières minutes."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lasagne seche';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'steak hache';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 600, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate pelee en boite';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lait';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 500, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 50, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'farine';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 40, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'fromage rape';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 100, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'gousse', false);
  END IF;

  -- 29. Pâtes bolognaise
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Pâtes bolognaise',
    'Sauce bolognaise mijotée avec viande hachée, tomates et vino rosso — la valeur sûre des soirs de semaine.',
    10, 40, 4, 'easy',
    ARRAY['familial','economique','batch-cooking'],
    '[{"order":1,"text":"Faire revenir l''oignon et l''ail dans l''huile d''olive."},{"order":2,"text":"Ajouter la viande hachée, faire dorer en remuant."},{"order":3,"text":"Ajouter les tomates pelées, le concentré, le vin rouge et les herbes."},{"order":4,"text":"Mijoter 30 minutes à feu doux en couvrant partiellement."},{"order":5,"text":"Cuire les pâtes al dente et servir nappées de bolognaise et de parmesan."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'spaghetti';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'steak hache';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 500, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate pelee en boite';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'concentre de tomate';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'vin rouge';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 100, 'ml', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'parmesan';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 60, 'g', true);
  END IF;

  -- 30. Riz cantonais
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Riz cantonais',
    'Riz sauté aux petits pois, jambon et oeufs brouillés — rapide, économique et idéal pour les restes de riz.',
    10, 15, 4, 'easy',
    ARRAY['rapide','economique','familial'],
    '[{"order":1,"text":"Cuire le riz la veille ou utiliser des restes. Il doit être froid."},{"order":2,"text":"Faire sauter les oeufs brouillés dans le wok avec l''huile. Réserver."},{"order":3,"text":"Dans le même wok, faire sauter le riz avec les petits pois et le jambon."},{"order":4,"text":"Ajouter les oeufs et la sauce soja. Mélanger à feu vif 2 minutes."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'riz';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oeuf';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'petit pois';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 150, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'jambon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'tranche', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'sauce soja';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile tournesol';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'ml', true);
  END IF;


  -- ============================================================
  -- SOUPES
  -- ============================================================

  -- 31. Soupe de lentilles
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Soupe de lentilles',
    'Soupe réconfortante aux lentilles vertes, carottes et cumin — économique, nutritive et parfaite pour l''hiver.',
    10, 40, 4, 'easy',
    ARRAY['vegetarien','vegan','economique','hiver','sans-gluten'],
    '[{"order":1,"text":"Faire revenir oignon, ail et carottes coupées dans l''huile."},{"order":2,"text":"Ajouter les lentilles rincées, le cumin et le bouillon. Couvrir d''eau."},{"order":3,"text":"Cuire 35 minutes à feu moyen jusqu''à ce que les lentilles soient tendres."},{"order":4,"text":"Mixer partiellement ou totalement selon la consistance désirée. Rectifier."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lentille verte';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'carotte';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'cumin';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'bouillon cube';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'ml', true);
  END IF;

  -- 32. Velouté de potiron
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Velouté de potiron',
    'Velouté doux et crémeux de potiron avec une touche de crème fraîche — réconfortant et facile à préparer en grandes quantités.',
    15, 30, 6, 'easy',
    ARRAY['vegetarien','hiver','batch-cooking'],
    '[{"order":1,"text":"Éplucher et couper le potiron en cubes. Éplucher et émincer l''oignon."},{"order":2,"text":"Faire suer l''oignon dans le beurre. Ajouter le potiron."},{"order":3,"text":"Couvrir de bouillon et cuire 25 minutes jusqu''à tendreté."},{"order":4,"text":"Mixer finement. Incorporer la crème fraîche. Rectifier sel et poivre."},{"order":5,"text":"Servir avec des croûtons et une pincée de muscade."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'potiron';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'creme fraiche';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 100, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'bouillon cube';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'g', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'sel';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 5, 'g', true);
  END IF;

  -- 33. Soupe à l'oignon
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Soupe à l''oignon',
    'Soupe à l''oignon gratinée avec croûtons et gruyère fondant — un classique bistronomique réchauffant et savoureux.',
    10, 50, 4, 'medium',
    ARRAY['hiver','fete'],
    '[{"order":1,"text":"Caraméliser les oignons émincés dans le beurre à feu doux 30 minutes en remuant."},{"order":2,"text":"Déglacer au vin blanc, laisser évaporer. Ajouter le bouillon."},{"order":3,"text":"Mijoter 15 minutes. Rectifier l''assaisonnement."},{"order":4,"text":"Disposer du pain grillé dans des bols, verser la soupe, couvrir de gruyère."},{"order":5,"text":"Passer sous le gril jusqu''à gratinage doré."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 8, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'gruyere';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pain';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'tranche', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'vin blanc';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 150, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'bouillon cube';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 40, 'g', true);
  END IF;

  -- 34. Gaspacho
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Gaspacho',
    'Soupe froide andalouse à base de tomates fraîches, concombre et poivron — rafraîchissante et parfaite pour l''été.',
    15, 0, 4, 'easy',
    ARRAY['vegetarien','vegan','ete','rapide','sans-gluten'],
    '[{"order":1,"text":"Mixer les tomates, le concombre, le poivron rouge, l''ail et l''oignon."},{"order":2,"text":"Ajouter l''huile d''olive, le vinaigre, le sel et le poivre."},{"order":3,"text":"Mixer jusqu''à obtenir une texture lisse. Rectifier l''assaisonnement."},{"order":4,"text":"Réfrigérer au moins 2 heures avant de servir."},{"order":5,"text":"Servir dans des bols avec une garniture de légumes coupés en petits dés."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1000, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'concombre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poivron rouge';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'vinaigre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 60, 'ml', true);
  END IF;

  -- 35. Soupe de poisson
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Soupe de poisson',
    'Soupe méditerranéenne de poisson au safran et fenouil, servie avec des croûtons et de la rouille — rustique et parfumée.',
    20, 40, 4, 'medium',
    ARRAY['hiver','fete'],
    '[{"order":1,"text":"Faire revenir l''oignon, le fenouil et l''ail dans l''huile d''olive."},{"order":2,"text":"Ajouter les tomates, le safran et le fumet de poisson."},{"order":3,"text":"Porter à ébullition et mijoter 20 minutes."},{"order":4,"text":"Ajouter les morceaux de poisson et cuire 10 minutes à feu doux."},{"order":5,"text":"Mixer la moitié de la soupe pour l''épaissir. Servir avec croûtons et rouille."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'cabillaud';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 600, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'fenouil';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate pelee en boite';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'safran';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'fumet de poisson';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 500, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 40, 'ml', true);
  END IF;


  -- ============================================================
  -- SALADES
  -- ============================================================

  -- 36. Salade niçoise
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Salade niçoise',
    'Salade généreuse aux thon, oeuf dur, olives et anchois sur un lit de verdure — fraîche et nourrissante.',
    15, 10, 4, 'easy',
    ARRAY['rapide','ete','sans-gluten'],
    '[{"order":1,"text":"Cuire les oeufs durs 10 minutes. Refroidir et couper en quartiers."},{"order":2,"text":"Blanchir les haricots verts 5 minutes. Égoutter et refroidir."},{"order":3,"text":"Disposer la salade, les tomates cerises, les oeufs, les haricots verts."},{"order":4,"text":"Ajouter le thon émietté, les olives noires et les anchois."},{"order":5,"text":"Assaisonner avec huile d''olive, vinaigre, sel et poivre."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'thon en boite';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oeuf';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'haricot vert';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate cerise';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'olive noire';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 80, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'salade verte';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 40, 'ml', true);
  END IF;

  -- 37. Salade César
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Salade César',
    'Salade romaine croquante avec une sauce César crémeuse, des croûtons dorés et des copeaux de parmesan.',
    15, 10, 4, 'easy',
    ARRAY['rapide','ete'],
    '[{"order":1,"text":"Griller les croûtons de pain au four avec huile et ail (180°C, 10 min)."},{"order":2,"text":"Préparer la sauce César : mayonnaise, anchois, parmesan, jus de citron, ail."},{"order":3,"text":"Couper la laitue romaine en morceaux, bien sécher."},{"order":4,"text":"Ajouter le poulet grillé émincé et les croûtons."},{"order":5,"text":"Napper de sauce César et parsemer de copeaux de parmesan."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'salade verte';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'blanc de poulet';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'parmesan';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 60, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pain';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'tranche', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'mayonnaise';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'citron';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'gousse', false);
  END IF;

  -- 38. Salade chèvre chaud
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Salade chèvre chaud',
    'Salade tiède avec des toasts de fromage de chèvre gratiné sur un lit de mesclun aux noix et miel — bistronomiqueé et élégante.',
    10, 10, 4, 'easy',
    ARRAY['rapide','vegetarien','ete'],
    '[{"order":1,"text":"Disposer des rondelles de chèvre sur les tranches de pain. Ajouter du miel."},{"order":2,"text":"Passer sous le gril 5 minutes jusqu''à légère dorure."},{"order":3,"text":"Préparer la vinaigrette : huile de noix, vinaigre balsamique, moutarde."},{"order":4,"text":"Dresser la salade avec des noix, les toasts chauds et la vinaigrette."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'chevre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'salade verte';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pain de mie';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 8, 'tranche', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'noix';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 60, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'miel';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'vinaigre balsamique';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 40, 'ml', true);
  END IF;

  -- 39. Taboulé
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Taboulé',
    'Taboulé libanais à la semoule fine, persil frais, tomates et menthe — léger, frais et parfait pour les pique-niques.',
    20, 5, 4, 'easy',
    ARRAY['vegetarien','vegan','ete','rapide'],
    '[{"order":1,"text":"Verser la semoule dans un bol, couvrir d''eau bouillante salée. Laisser gonfler 5 min."},{"order":2,"text":"Égrainer la semoule avec une fourchette. Laisser refroidir."},{"order":3,"text":"Couper finement les tomates, concombre, persil et menthe."},{"order":4,"text":"Mélanger avec la semoule, ajouter jus de citron, huile d''olive, sel."},{"order":5,"text":"Réfrigérer 1 heure et servir frais."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'semoule';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'concombre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'persil';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'botte', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'menthe';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'citron';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 60, 'ml', true);
  END IF;


  -- ============================================================
  -- GRATINS & TARTES
  -- ============================================================

  -- 40. Quiche lorraine
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Quiche lorraine',
    'La vraie quiche lorraine avec lardons, oeufs et crème fraîche dans une pâte brisée dorée — un grand classique.',
    15, 40, 6, 'easy',
    ARRAY['familial','batch-cooking'],
    '[{"order":1,"text":"Préchauffer le four à 180°C. Foncer un moule avec la pâte brisée."},{"order":2,"text":"Faire dorer les lardons à sec. Étaler sur le fond de pâte."},{"order":3,"text":"Battre les oeufs avec la crème fraîche, le lait, sel, poivre et muscade."},{"order":4,"text":"Verser l''appareil sur les lardons. Enfourner 35-40 minutes."},{"order":5,"text":"Servir chaud, tiède ou froid avec une salade verte."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pate brisee';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lardon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oeuf';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'creme fraiche';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lait';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 100, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'sel';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'g', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poivre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'g', true);
  END IF;

  -- 41. Gratin dauphinois
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Gratin dauphinois',
    'Pommes de terre fondantes cuites dans un mélange de crème et de lait, parfumées à l''ail et gratinées au four.',
    20, 75, 6, 'easy',
    ARRAY['vegetarien','familial','hiver','fete'],
    '[{"order":1,"text":"Préchauffer le four à 180°C. Frotter le plat à gratin avec de l''ail."},{"order":2,"text":"Éplucher et trancher les pommes de terre finement au robot ou mandoline."},{"order":3,"text":"Mélanger crème liquide, lait entier, sel, poivre et muscade."},{"order":4,"text":"Alterner couches de pommes de terre et du mélange crémeux."},{"order":5,"text":"Enfourner 1h15. Vérifier la cuisson avec la pointe d''un couteau."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pomme de terre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1500, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'creme liquide';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lait entier';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'sel';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 5, 'g', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 20, 'g', true);
  END IF;

  -- 42. Tarte au thon
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Tarte au thon',
    'Tarte salée garnie de thon, tomates et oeufs battus à la crème — rapide et économique, parfaite pour un repas du soir.',
    10, 35, 6, 'easy',
    ARRAY['rapide','economique','familial'],
    '[{"order":1,"text":"Préchauffer le four à 180°C. Foncer un moule avec la pâte brisée."},{"order":2,"text":"Répartir le thon émietté et les tomates coupées en rondelles sur la pâte."},{"order":3,"text":"Battre les oeufs avec la crème, sel et poivre. Verser sur la garniture."},{"order":4,"text":"Parsemer de fromage râpé. Enfourner 30-35 minutes."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pate brisee';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'thon en boite';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oeuf';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'creme fraiche';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 150, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'fromage rape';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 60, 'g', true);
  END IF;

  -- 43. Gratin de pâtes
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Gratin de pâtes',
    'Pâtes cuites au four dans une béchamel généreuse avec jambon et fromage râpé — simple et réconfortant.',
    15, 30, 4, 'easy',
    ARRAY['familial','economique','batch-cooking'],
    '[{"order":1,"text":"Cuire les pâtes al dente. Égoutter."},{"order":2,"text":"Préparer la béchamel : beurre, farine, lait, muscade, sel, poivre."},{"order":3,"text":"Mélanger les pâtes, le jambon coupé en dés et la béchamel."},{"order":4,"text":"Verser dans un plat à gratin. Couvrir de fromage râpé."},{"order":5,"text":"Enfourner 20-25 minutes à 200°C jusqu''à gratinage."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'penne';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'jambon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'tranche', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'fromage rape';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 100, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lait';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 40, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'farine';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'g', false);
  END IF;

  -- 44. Croque-monsieur
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Croque-monsieur',
    'Tartine grillée au jambon et fromage fondu, nappée de béchamel — le snack parfait pour un déjeuner express.',
    10, 15, 4, 'easy',
    ARRAY['rapide','economique','familial'],
    '[{"order":1,"text":"Préparer une béchamel légère."},{"order":2,"text":"Tartiner de béchamel une tranche de pain de mie."},{"order":3,"text":"Déposer une tranche de jambon et du gruyère râpé."},{"order":4,"text":"Couvrir avec une 2e tranche, tartiner de béchamel et parsemer de fromage."},{"order":5,"text":"Griller au four 10-12 minutes à 200°C jusqu''à dorure."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pain de mie';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 8, 'tranche', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'jambon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'tranche', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'gruyere';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 120, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lait';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 20, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'farine';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 15, 'g', false);
  END IF;


  -- ============================================================
  -- PLATS DU MONDE
  -- ============================================================

  -- 45. Tajine d'agneau
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Tajine d''agneau aux pruneaux',
    'Agneau confit aux pruneaux, amandes et miel dans les épices du Maroc — un voyage en une seule cocotte.',
    20, 90, 4, 'medium',
    ARRAY['hiver','fete'],
    '[{"order":1,"text":"Faire dorer les morceaux d''agneau dans l''huile. Réserver."},{"order":2,"text":"Faire revenir oignon et ail, ajouter ras el hanout, gingembre, cannelle."},{"order":3,"text":"Remettre l''agneau, couvrir de bouillon. Cuire 1h à feu doux."},{"order":4,"text":"Ajouter les pruneaux et le miel. Cuire encore 20 minutes."},{"order":5,"text":"Servir avec de la semoule et des amandes grillées."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'epaule d''agneau';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pruneau';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 200, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'amande';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 60, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'miel';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ras el hanout';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'cannelle';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'semoule';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', true);
  END IF;

  -- 46. Curry vert thaï
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Curry vert thaï',
    'Curry parfumé et épicé au lait de coco avec poulet et légumes verts — authentique et plein de saveurs exotiques.',
    15, 25, 4, 'easy',
    ARRAY['rapide','sans-gluten'],
    '[{"order":1,"text":"Faire chauffer l''huile de coco dans un wok. Faire revenir la pâte de curry vert."},{"order":2,"text":"Ajouter le poulet coupé en dés. Faire dorer 3 minutes."},{"order":3,"text":"Verser le lait de coco. Ajouter poivrons et courgettes."},{"order":4,"text":"Cuire 15 minutes. Assaisonner avec sauce soja et jus de citron vert."},{"order":5,"text":"Garnir de basilic thaï et servir avec du riz basmati."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'blanc de poulet';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 600, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pate de curry vert';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lait de coco';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'ml', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poivron vert';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'courgette';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'sauce soja';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'citron';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'riz basmati';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', true);
  END IF;

  -- 47. Chili con carne
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Chili con carne',
    'Ragoût texan épicé de viande hachée, haricots rouges et tomates — idéal pour les grandes tablées et le batch cooking.',
    15, 50, 6, 'easy',
    ARRAY['familial','batch-cooking','economique'],
    '[{"order":1,"text":"Faire dorer oignon, ail et viande hachée dans l''huile."},{"order":2,"text":"Ajouter paprika fumé, cumin, piment, concentré de tomate. Mélanger."},{"order":3,"text":"Incorporer les tomates pelées et les haricots rouges."},{"order":4,"text":"Mijoter 40 minutes à feu doux en remuant régulièrement."},{"order":5,"text":"Rectifier l''assaisonnement et servir avec riz ou pain de maïs."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'steak hache';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 700, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'haricot rouge en boite';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate pelee en boite';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'paprika fume';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'cumin';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'piment en poudre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cc', true);
  END IF;

  -- 48. Couscous
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Couscous',
    'Couscous traditionnel avec légumes de saison, pois chiches et bouillon épicé — généreux et convivial.',
    20, 60, 6, 'medium',
    ARRAY['familial','hiver','batch-cooking'],
    '[{"order":1,"text":"Faire revenir oignons, ail et carottes dans l''huile d''olive avec ras el hanout."},{"order":2,"text":"Ajouter courgettes, navets et pois chiches. Couvrir de bouillon épicé."},{"order":3,"text":"Mijoter 45 minutes à feu doux. Rectifier l''assaisonnement."},{"order":4,"text":"Cuire la semoule en la couvrant d''eau bouillante salée. Laisser gonfler 5 min."},{"order":5,"text":"Égrainer la semoule et servir avec les légumes et le bouillon. Proposer de la harissa."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'semoule';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'pois chiche';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'courgette';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'carotte';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'navet';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ras el hanout';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'harissa';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cc', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 40, 'ml', true);
  END IF;

  -- 49. Shakshuka
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Shakshuka',
    'Oeufs pochés dans une sauce tomate épicée aux poivrons — un petit déjeuner ou brunch oriental rapide et savoureux.',
    10, 20, 4, 'easy',
    ARRAY['vegetarien','rapide','economique','sans-gluten'],
    '[{"order":1,"text":"Faire revenir oignon, ail et poivron dans l''huile d''olive."},{"order":2,"text":"Ajouter les tomates pelées, cumin, paprika et piment. Mijoter 10 minutes."},{"order":3,"text":"Creuser des puits dans la sauce et casser les oeufs dedans."},{"order":4,"text":"Couvrir et cuire à feu doux 8-10 minutes selon la cuisson désirée."},{"order":5,"text":"Parsemer de coriandre fraîche et servir avec du pain."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oeuf';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 6, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate pelee en boite';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 800, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poivron rouge';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'cumin';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'paprika';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'coriandre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'ml', true);
  END IF;

  -- 50. Wok de poulet aux légumes
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Wok de poulet aux légumes',
    'Poulet et légumes colorés sautés au wok avec sauce soja et gingembre — rapide, sain et plein de fraîcheur asiatique.',
    15, 15, 4, 'easy',
    ARRAY['rapide','sans-gluten'],
    '[{"order":1,"text":"Couper le poulet en lanières et les légumes en julienne."},{"order":2,"text":"Chauffer le wok à feu très vif avec l''huile. Faire sauter le poulet 3-4 minutes."},{"order":3,"text":"Ajouter ail et gingembre émincés. Mélanger 1 minute."},{"order":4,"text":"Ajouter les légumes et faire sauter 5 minutes en remuant constamment."},{"order":5,"text":"Déglacer avec sauce soja et huile de sésame. Servir immédiatement."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'blanc de poulet';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 600, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poivron rouge';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'carotte';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'brocoli';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'gingembre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 15, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'sauce soja';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'cs', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile de sesame';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cs', true);
  END IF;

  -- 51. Fajitas
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Fajitas',
    'Lanières de poulet marinées aux épices tex-mex, servies dans des tortillas avec poivrons, creme fraîche et guacamole.',
    20, 15, 4, 'easy',
    ARRAY['rapide','familial','ete'],
    '[{"order":1,"text":"Faire mariner le poulet en lanières avec cumin, paprika, ail et jus de citron."},{"order":2,"text":"Faire sauter les lanières de poulet à feu vif 5-6 minutes."},{"order":3,"text":"Faire revenir les poivrons et l''oignon en lanières dans la même poêle."},{"order":4,"text":"Réchauffer les tortillas. Garnir de poulet, légumes, creme fraîche et avocat."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'escalope de poulet';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 4, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tortilla';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 8, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poivron rouge';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'poivron vert';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'avocat';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 2, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'cumin';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'paprika fume';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'creme fraiche';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 100, 'g', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'citron';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', true);
  END IF;

  -- 52. Dhal indien
  INSERT INTO public.recipes (title, description, prep_time, cook_time, servings, difficulty, tags, steps, source, household_id, created_by)
  VALUES (
    'Dhal indien',
    'Lentilles corail mijotées avec des épices indiennes — curcuma, cumin, coriandre — et une touche de ghee pour un plat végane fondant.',
    10, 35, 4, 'easy',
    ARRAY['vegetarien','vegan','economique','sans-gluten','batch-cooking'],
    '[{"order":1,"text":"Rincer les lentilles corail. Faire chauffer l''huile dans la cocotte."},{"order":2,"text":"Faire revenir oignon et ail. Ajouter curcuma, cumin, coriandre en poudre."},{"order":3,"text":"Ajouter les lentilles, les tomates et couvrir d''eau. Cuire 25 minutes."},{"order":4,"text":"Remuer jusqu''à consistance crémeuse. Ajouter du gingembre râpé."},{"order":5,"text":"Servir avec du riz basmati ou des chapatis. Garnir de coriandre fraîche."}]',
    'system', NULL, NULL
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing FROM public.ingredients WHERE name = 'lentille verte';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'tomate pelee en boite';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 400, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'piece', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 3, 'gousse', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'gingembre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 15, 'g', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'cumin';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'coriandre en poudre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'cc', false);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'coriandre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 1, 'botte', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'riz basmati';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 300, 'g', true);
    SELECT id INTO ing FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing, 30, 'ml', true);
  END IF;

END $$;
