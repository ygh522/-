/* Nutrition library — content only (no logic). Nutrient values per 100 g edible portion as served (cooked where noted), based on typical values from the Korean MFDS food composition DB / USDA. */
/* Liquids (milk) are per 100 ml (≈100 g). beef_shabu is per 100 g RAW weight, because restaurants portion shabu-shabu meat raw. */
window.F = window.F || {};

/* ---------------------------------------------------------------------------
 * F.FOODS — per 100 g as eaten
 * kcal, p = protein g, c = carbs g, f = fat g, fib = fiber g, na = sodium mg
 * piece: null or { g, label } for countable foods
 * ------------------------------------------------------------------------- */
F.FOODS = {
  /* 곡류 · 전분 */
  brown_rice:         { name: '현미밥',                     kcal: 150, p: 3.2,  c: 32.0, f: 1.0,   fib: 1.8,  na: 2,    piece: null },
  white_rice:         { name: '흰쌀밥',                     kcal: 145, p: 2.6,  c: 32.0, f: 0.3,   fib: 0.3,  na: 2,    piece: null },
  multigrain_rice:    { name: '잡곡밥',                     kcal: 152, p: 3.6,  c: 32.6, f: 0.9,   fib: 1.9,  na: 3,    piece: null },
  sweet_potato:       { name: '고구마(찐 것)',              kcal: 130, p: 1.4,  c: 30.5, f: 0.2,   fib: 2.5,  na: 15,   piece: null },
  oats:               { name: '오트밀(압착귀리, 마른 것)',  kcal: 380, p: 13.2, c: 67.7, f: 6.5,   fib: 10.1, na: 6,    piece: null },
  ww_bread:           { name: '통밀식빵',                   kcal: 255, p: 11.0, c: 44.0, f: 3.5,   fib: 6.0,  na: 430,  piece: { g: 35, label: '장' } },
  tortilla:           { name: '통밀 또띠아',                kcal: 295, p: 8.5,  c: 47.0, f: 7.5,   fib: 6.5,  na: 600,  piece: { g: 60, label: '장' } },

  /* 과일 */
  banana:             { name: '바나나',                     kcal: 89,  p: 1.1,  c: 22.8, f: 0.3,   fib: 2.6,  na: 1,    piece: { g: 100, label: '개' } },
  apple:              { name: '사과',                       kcal: 55,  p: 0.3,  c: 14.0, f: 0.2,   fib: 2.2,  na: 1,    piece: { g: 250, label: '개' } },
  blueberry:          { name: '블루베리',                   kcal: 57,  p: 0.7,  c: 14.5, f: 0.3,   fib: 2.4,  na: 1,    piece: null },
  avocado:            { name: '아보카도',                   kcal: 160, p: 2.0,  c: 8.5,  f: 14.7,  fib: 6.7,  na: 7,    piece: null },

  /* 단백질 */
  chicken_breast:     { name: '닭가슴살(구운 것)',          kcal: 165, p: 31.0, c: 0,    f: 3.6,   fib: 0,    na: 75,   piece: null },
  egg:                { name: '계란',                       kcal: 150, p: 12.4, c: 0.8,  f: 10.0,  fib: 0,    na: 140,  piece: { g: 50, label: '개' } },
  greek_yogurt:       { name: '그릭요거트(무가당 저지방)',  kcal: 80,  p: 9.8,  c: 4.0,  f: 2.5,   fib: 0,    na: 36,   piece: null },
  salmon_raw:         { name: '생연어(회·포케용)',          kcal: 200, p: 20.4, c: 0,    f: 13.0,  fib: 0,    na: 55,   piece: null },
  salmon_grilled:     { name: '연어 구이',                  kcal: 206, p: 22.1, c: 0,    f: 12.4,  fib: 0,    na: 60,   piece: null },
  beef_lean:          { name: '소고기 우둔(익힌 것)',       kcal: 175, p: 29.0, c: 0,    f: 6.5,   fib: 0,    na: 60,   piece: null },
  beef_shabu:         { name: '샤브샤브용 소고기(생고기 기준)', kcal: 135, p: 21.5, c: 0, f: 5.5,  fib: 0,    na: 55,   piece: null },
  pork_tenderloin:    { name: '돼지 안심 수육',             kcal: 145, p: 26.0, c: 0,    f: 4.5,   fib: 0,    na: 55,   piece: null },
  tofu:               { name: '두부(부침용)',               kcal: 92,  p: 9.6,  c: 2.5,  f: 5.0,   fib: 0.6,  na: 8,    piece: null },
  whey:               { name: '웨이 프로틴(초코)',          kcal: 390, p: 75.0, c: 10.0, f: 5.5,   fib: 1.0,  na: 250,  piece: { g: 30, label: '스쿱' } },
  milk_low:           { name: '저지방 우유',                kcal: 42,  p: 3.3,  c: 4.9,  f: 1.0,   fib: 0,    na: 45,   piece: null },
  string_cheese:      { name: '스트링 치즈',                kcal: 290, p: 23.0, c: 2.0,  f: 21.0,  fib: 0,    na: 700,  piece: { g: 20, label: '개' } },
  edamame:            { name: '에다마메(깐 풋콩)',          kcal: 121, p: 11.9, c: 8.9,  f: 5.2,   fib: 5.2,  na: 6,    piece: null },

  /* 지방 · 견과 */
  almond:             { name: '아몬드',                     kcal: 579, p: 21.2, c: 21.6, f: 49.9,  fib: 12.5, na: 1,    piece: null },
  olive_oil:          { name: '올리브유',                   kcal: 884, p: 0,    c: 0,    f: 100.0, fib: 0,    na: 2,    piece: null },
  sesame_oil:         { name: '참기름',                     kcal: 884, p: 0,    c: 0,    f: 100.0, fib: 0,    na: 0,    piece: null },
  sesame:             { name: '참깨',                       kcal: 570, p: 17.7, c: 23.5, f: 49.7,  fib: 11.8, na: 11,   piece: null },

  /* 채소 · 버섯 */
  broccoli:           { name: '브로콜리(데친 것)',          kcal: 35,  p: 2.4,  c: 7.2,  f: 0.4,   fib: 3.3,  na: 41,   piece: null },
  spinach_namul:      { name: '시금치나물',                 kcal: 55,  p: 3.0,  c: 4.5,  f: 3.0,   fib: 2.4,  na: 380,  piece: null },
  beansprout_namul:   { name: '콩나물무침',                 kcal: 50,  p: 3.5,  c: 4.0,  f: 2.5,   fib: 2.2,  na: 330,  piece: null },
  carrot:             { name: '당근',                       kcal: 37,  p: 1.0,  c: 8.6,  f: 0.2,   fib: 2.8,  na: 60,   piece: null },
  zucchini:           { name: '애호박',                     kcal: 19,  p: 1.2,  c: 3.6,  f: 0.3,   fib: 1.1,  na: 5,    piece: null },
  mushroom:           { name: '버섯(표고·양송이)',          kcal: 28,  p: 2.8,  c: 5.0,  f: 0.3,   fib: 2.0,  na: 6,    piece: null },
  enoki:              { name: '팽이버섯',                   kcal: 37,  p: 2.7,  c: 7.8,  f: 0.3,   fib: 2.7,  na: 3,    piece: null },
  bell_pepper:        { name: '파프리카',                   kcal: 28,  p: 1.0,  c: 6.0,  f: 0.3,   fib: 2.0,  na: 4,    piece: null },
  asparagus:          { name: '아스파라거스',               kcal: 22,  p: 2.4,  c: 4.1,  f: 0.2,   fib: 2.0,  na: 14,   piece: null },
  mixed_greens:       { name: '샐러드 채소',                kcal: 18,  p: 1.5,  c: 3.4,  f: 0.2,   fib: 1.9,  na: 25,   piece: null },
  lettuce:            { name: '상추',                       kcal: 15,  p: 1.4,  c: 2.9,  f: 0.2,   fib: 1.3,  na: 28,   piece: null },
  perilla:            { name: '깻잎',                       kcal: 41,  p: 3.9,  c: 7.5,  f: 0.6,   fib: 4.5,  na: 5,    piece: null },
  cucumber:           { name: '오이',                       kcal: 13,  p: 0.7,  c: 3.0,  f: 0.1,   fib: 0.6,  na: 2,    piece: null },
  tomato:             { name: '토마토',                     kcal: 18,  p: 0.9,  c: 3.9,  f: 0.2,   fib: 1.2,  na: 5,    piece: null },
  cherry_tomato:      { name: '방울토마토',                 kcal: 22,  p: 1.0,  c: 4.8,  f: 0.2,   fib: 1.3,  na: 5,    piece: { g: 15, label: '개' } },
  napa_cabbage:       { name: '알배추',                     kcal: 15,  p: 1.2,  c: 3.2,  f: 0.2,   fib: 1.2,  na: 9,    piece: null },
  bok_choy:           { name: '청경채',                     kcal: 13,  p: 1.5,  c: 2.2,  f: 0.2,   fib: 1.0,  na: 65,   piece: null },
  garlic:             { name: '마늘',                       kcal: 135, p: 6.4,  c: 30.0, f: 0.4,   fib: 2.1,  na: 17,   piece: { g: 5, label: '쪽' } },
  green_chili:        { name: '풋고추',                     kcal: 24,  p: 1.2,  c: 5.0,  f: 0.3,   fib: 2.4,  na: 3,    piece: { g: 10, label: '개' } },
  kimchi:             { name: '배추김치',                   kcal: 25,  p: 1.8,  c: 4.0,  f: 0.5,   fib: 2.4,  na: 680,  piece: null },

  /* 완성 요리 (통째로 사 먹는 음식, 100 g 기준) */
  sundubu_jjigae:     { name: '순두부찌개(계란 포함)',      kcal: 68,  p: 5.0,  c: 2.8,  f: 4.2,   fib: 0.4,  na: 380,  piece: null },

  /* 소스 · 양념 */
  gochujang:          { name: '고추장',                     kcal: 220, p: 4.5,  c: 46.0, f: 1.8,   fib: 2.5,  na: 2600, piece: null },
  ssamjang:           { name: '쌈장',                       kcal: 200, p: 7.5,  c: 30.0, f: 5.0,   fib: 4.0,  na: 3100, piece: null },
  soy_scallion_sauce: { name: '파간장 소스',                kcal: 95,  p: 5.5,  c: 11.0, f: 3.0,   fib: 0.8,  na: 3800, piece: null },
  poke_sauce:         { name: '포케 소스(간장 베이스)',     kcal: 130, p: 4.5,  c: 15.0, f: 5.5,   fib: 0.3,  na: 3200, piece: null },
  yogurt_sauce:       { name: '요거트 소스',                kcal: 95,  p: 6.5,  c: 5.5,  f: 5.0,   fib: 0.2,  na: 280,  piece: null },
  ponzu_sauce:        { name: '폰즈 소스(간장·식초)',       kcal: 55,  p: 3.5,  c: 9.5,  f: 0.2,   fib: 0.3,  na: 3200, piece: null }
};

/* ---------------------------------------------------------------------------
 * F.MEALS — 18 meals. Roles: protein (scaled to protein target),
 * carb (scaled to kcal target), veg / fat / fixed (grams kept).
 * ------------------------------------------------------------------------- */
F.MEALS = [
  /* ===== 아침 ===== */
  {
    id: 'bf_greek', slot: 'breakfast', name: '그릭요거트 오트볼', img: 'bf_greek',
    tags: ['고단백', '5분 완성'],
    prep: 5,
    eatOut: false,
    items: [
      { food: 'greek_yogurt', g: 200, role: 'protein' },
      { food: 'oats', g: 40, role: 'carb' },
      { food: 'blueberry', g: 80, role: 'fixed' },
      { food: 'almond', g: 10, role: 'fat' }
    ],
    how: '그릭요거트에 오트밀을 섞어 5분쯤 두면 부드러워져요. 그 위에 블루베리와 슬라이스 아몬드를 올려요.',
    tip: '과일맛·가당 제품 대신 무가당 플레인을 고르고, 꿀이나 그래놀라 토핑은 빼면 당류를 크게 줄일 수 있어요.'
  },
  {
    id: 'bf_eggtoast', slot: 'breakfast', name: '스크램블에그 통밀 토스트', img: 'bf_eggtoast',
    tags: ['고단백', '든든한 아침'],
    prep: 10,
    eatOut: false,
    items: [
      { food: 'egg', g: 150, role: 'protein' },
      { food: 'ww_bread', g: 70, role: 'carb' },
      { food: 'cherry_tomato', g: 90, role: 'veg' },
      { food: 'olive_oil', g: 5, role: 'fat' }
    ],
    how: '팬에 올리브유 1작은술을 두르고 계란 3개를 약불에서 천천히 저어 촉촉하게 익혀요. 구운 통밀식빵 2장과 반으로 자른 방울토마토를 곁들여요.',
    tip: '버터·치즈·케첩을 더하면 금방 100kcal 넘게 늘어나니 소금 약간과 후추·허브로 간해요.'
  },
  {
    id: 'bf_oat', slot: 'breakfast', name: '바나나 시나몬 프로틴 오트밀', img: 'bf_oat',
    tags: ['운동 전', '포만감'],
    prep: 5,
    eatOut: false,
    items: [
      { food: 'oats', g: 45, role: 'carb' },
      { food: 'milk_low', g: 200, role: 'fixed' },
      { food: 'banana', g: 50, role: 'carb' },
      { food: 'whey', g: 30, role: 'protein' }
    ],
    how: '오트밀을 저지방 우유에 넣어 전자레인지로 2분(냄비라면 3~4분) 익히고, 한 김 식힌 뒤 웨이 프로틴 1스쿱을 섞어요. 바나나 반 개를 썰어 올리고 시나몬 가루를 뿌려요.',
    tip: '단백질 파우더는 뜨거울 때 넣으면 뭉치기 쉬우니 살짝 식혀서 섞고, 설탕·시럽 대신 바나나로 단맛을 내요.'
  },
  {
    id: 'bf_kor', slot: 'breakfast', name: '고구마·삶은 계란·우유', img: 'bf_kor',
    tags: ['한국식', '간편'],
    prep: 5,
    eatOut: false,
    items: [
      { food: 'sweet_potato', g: 180, role: 'carb' },
      { food: 'egg', g: 100, role: 'protein' },
      { food: 'milk_low', g: 250, role: 'fixed' }
    ],
    how: '주말에 고구마를 쪄서 냉장 보관하고 계란도 9~10분 삶아 두면, 아침엔 꺼내기만 하면 돼요. 저지방 우유 1잔(250ml)을 곁들여요.',
    tip: '단백질이 조금 부족한 조합이라 금방 배고프면 계란을 1개 더하고, 고구마는 작은 것 2개(약 180g) 정도로 양을 지켜요.'
  },

  /* ===== 점심 ===== */
  {
    id: 'ln_chicken', slot: 'lunch', name: '닭가슴살 현미 도시락', img: 'ln_chicken',
    tags: ['고단백', '도시락'],
    prep: 10,
    eatOut: false,
    items: [
      { food: 'brown_rice', g: 210, role: 'carb' },
      { food: 'chicken_breast', g: 100, role: 'protein' },
      { food: 'broccoli', g: 80, role: 'veg' },
      { food: 'spinach_namul', g: 50, role: 'veg' },
      { food: 'beansprout_namul', g: 50, role: 'veg' }
    ],
    how: '닭가슴살은 소금·후추로 밑간해 굽거나 저염 시판 제품을 데워요. 현미밥, 데친 브로콜리, 시금치나물, 콩나물무침과 함께 도시락에 담아요.',
    tip: '주말에 3~4개를 한 번에 만들어 두고, 냉장 보관한 도시락은 3일 안에 먹어요.'
  },
  {
    id: 'ln_poke', slot: 'lunch', name: '연어 포케', img: 'ln_poke',
    tags: ['오메가3', '샐러드볼'],
    prep: 15,
    eatOut: false,
    items: [
      { food: 'brown_rice', g: 150, role: 'carb' },
      { food: 'salmon_raw', g: 110, role: 'protein' },
      { food: 'avocado', g: 40, role: 'fat' },
      { food: 'mixed_greens', g: 40, role: 'veg' },
      { food: 'cucumber', g: 40, role: 'veg' },
      { food: 'edamame', g: 40, role: 'veg' },
      { food: 'sesame', g: 5, role: 'fat' },
      { food: 'poke_sauce', g: 20, role: 'fixed' }
    ],
    how: '현미밥 위에 깍둑 썬 생연어, 아보카도, 샐러드 채소, 오이, 에다마메를 올리고 포케 소스 1큰술과 참깨를 뿌려요. 연어는 회·초밥용으로 파는 제품을 써요.',
    tip: '매장에서 주문할 땐 소스를 따로 받아 절반만 쓰고, 마요·크림 계열 소스는 피해요.'
  },
  {
    id: 'ln_bibim', slot: 'lunch', name: '소고기 비빔밥', img: 'ln_bibim',
    tags: ['한식', '채소 듬뿍'],
    prep: 20,
    eatOut: false,
    items: [
      { food: 'brown_rice', g: 180, role: 'carb' },
      { food: 'beef_lean', g: 80, role: 'protein' },
      { food: 'spinach_namul', g: 30, role: 'veg' },
      { food: 'beansprout_namul', g: 30, role: 'veg' },
      { food: 'carrot', g: 20, role: 'veg' },
      { food: 'zucchini', g: 30, role: 'veg' },
      { food: 'mushroom', g: 20, role: 'veg' },
      { food: 'egg', g: 50, role: 'fixed' },
      { food: 'gochujang', g: 10, role: 'fixed' },
      { food: 'sesame_oil', g: 5, role: 'fat' }
    ],
    how: '현미밥에 시금치·콩나물·당근·애호박·표고 나물과 간장 약간에 볶은 우둔살을 올려요. 계란프라이 1개, 고추장 ½큰술, 참기름 1작은술을 넣어 비벼요.',
    tip: '나물을 넉넉히 넣고 고추장은 ½큰술로 정해 두면 나트륨과 당을 함께 줄일 수 있어요.'
  },
  {
    id: 'ln_wrap', slot: 'lunch', name: '닭가슴살 통밀 랩', img: 'ln_wrap',
    tags: ['고단백', '도시락'],
    prep: 10,
    eatOut: false,
    items: [
      { food: 'tortilla', g: 120, role: 'carb' },
      { food: 'chicken_breast', g: 90, role: 'protein' },
      { food: 'lettuce', g: 30, role: 'veg' },
      { food: 'tomato', g: 50, role: 'veg' },
      { food: 'cucumber', g: 30, role: 'veg' },
      { food: 'yogurt_sauce', g: 30, role: 'fixed' },
      { food: 'cherry_tomato', g: 90, role: 'veg' }
    ],
    how: '데운 통밀 또띠아에 요거트 소스를 바르고 구운 닭가슴살, 상추, 토마토, 오이를 넣어 단단히 말아요. 또띠아 2장으로 랩 2개를 만들고 방울토마토를 곁들여요.',
    tip: '요거트 소스(그릭요거트+레몬즙+다진 마늘)는 같은 양의 마요네즈보다 열량이 약 7분의 1이에요.'
  },
  {
    id: 'ln_sundubu', slot: 'lunch', name: '순두부찌개 (공기밥 반)', img: 'ln_sundubu',
    tags: ['외식', '한식'],
    prep: 0,
    eatOut: true,
    items: [
      { food: 'sundubu_jjigae', g: 500, role: 'protein' },
      { food: 'white_rice', g: 110, role: 'carb' },
      { food: 'kimchi', g: 40, role: 'veg' },
      { food: 'spinach_namul', g: 50, role: 'veg' },
      { food: 'beansprout_namul', g: 50, role: 'veg' }
    ],
    how: '순두부찌개에 계란을 넣어 달라고 하고, 공기밥은 반 공기만 먹어요. 반찬은 김치보다 나물 위주로 먹어요.',
    tip: '나트륨은 국물에 몰려 있으니 순두부와 건더기 위주로 먹고 국물은 절반 이상 남겨요.'
  },

  /* ===== 저녁 ===== */
  {
    id: 'dn_salmon', slot: 'dinner', name: '연어 스테이크와 구운 채소', img: 'dn_salmon',
    tags: ['오메가3', '에어프라이어'],
    prep: 25,
    eatOut: false,
    items: [
      { food: 'salmon_grilled', g: 120, role: 'protein' },
      { food: 'sweet_potato', g: 120, role: 'carb' },
      { food: 'bell_pepper', g: 60, role: 'veg' },
      { food: 'zucchini', g: 60, role: 'veg' },
      { food: 'mushroom', g: 50, role: 'veg' },
      { food: 'asparagus', g: 50, role: 'veg' },
      { food: 'olive_oil', g: 5, role: 'fat' }
    ],
    how: '연어는 소금·후추로 밑간해 껍질 쪽부터 중불에 4~5분, 뒤집어 2~3분 구워요. 채소는 올리브유 1작은술에 버무려 에어프라이어 200℃에서 10~12분 굽고, 미리 쪄 둔 작은 고구마를 함께 데워요.',
    tip: '연어는 자체 지방이 많아 기름 없이도 잘 구워지니, 기름은 채소용 1작은술만 계량해서 써요.'
  },
  {
    id: 'dn_tofu', slot: 'dinner', name: '두부 스테이크와 잡곡밥', img: 'dn_tofu',
    tags: ['식물성 단백질', '가성비'],
    prep: 15,
    eatOut: false,
    items: [
      { food: 'tofu', g: 300, role: 'protein' },
      { food: 'olive_oil', g: 5, role: 'fat' },
      { food: 'soy_scallion_sauce', g: 15, role: 'fixed' },
      { food: 'multigrain_rice', g: 130, role: 'carb' },
      { food: 'mixed_greens', g: 60, role: 'veg' },
      { food: 'cherry_tomato', g: 60, role: 'veg' }
    ],
    how: '두부는 키친타월로 물기를 빼고 1.5cm 두께로 썰어 기름 1작은술에 앞뒤로 노릇하게 구운 뒤 파간장 1큰술을 올려요. 잡곡밥 작은 공기와 샐러드를 곁들여요.',
    tip: '두부는 같은 무게의 닭가슴살보다 단백질이 3분의 1 수준이라, 한 모(300g)는 먹어야 단백질 약 30g이 채워져요.'
  },
  {
    id: 'dn_chicken', slot: 'dinner', name: '닭가슴살 스테이크와 고구마', img: 'dn_chicken',
    tags: ['고단백', '밀프렙'],
    prep: 20,
    eatOut: false,
    items: [
      { food: 'chicken_breast', g: 120, role: 'protein' },
      { food: 'broccoli', g: 100, role: 'veg' },
      { food: 'sweet_potato', g: 160, role: 'carb' },
      { food: 'olive_oil', g: 5, role: 'fat' }
    ],
    how: '닭가슴살을 두께가 고르게 두드려 펴고 소금·후추·허브로 밑간한 뒤, 기름을 살짝 두른 팬에 중약불로 앞뒤 5~6분씩 구워요. 데친 브로콜리와 찐 고구마를 곁들여요.',
    tip: '가장 두꺼운 부분까지 하얗게 익으면 바로 불을 끄고 3분쯤 두었다 썰면 덜 퍽퍽해요.'
  },
  {
    id: 'dn_shabu', slot: 'dinner', name: '소고기 샤브샤브', img: 'dn_shabu',
    tags: ['외식', '저지방'],
    prep: 0,
    eatOut: true,
    items: [
      { food: 'beef_shabu', g: 150, role: 'protein' },
      { food: 'napa_cabbage', g: 150, role: 'veg' },
      { food: 'enoki', g: 60, role: 'veg' },
      { food: 'mushroom', g: 50, role: 'veg' },
      { food: 'bok_choy', g: 80, role: 'veg' },
      { food: 'ponzu_sauce', g: 30, role: 'fixed' },
      { food: 'white_rice', g: 120, role: 'carb' }
    ],
    how: '우둔·홍두깨처럼 기름기 적은 부위를 고르고, 배추·버섯·청경채 같은 채소를 넉넉히 익혀 폰즈(간장 식초) 소스에 찍어 먹어요. 참깨 소스는 열량이 높아 조금만 써요.',
    tip: '마무리 칼국수와 죽은 건너뛰고 공기밥 반 공기 정도로 대신하며, 짠 육수는 마시지 않아요.'
  },
  {
    id: 'dn_suyuk', slot: 'dinner', name: '돼지 안심 수육 쌈', img: 'dn_suyuk',
    tags: ['고단백', '한식'],
    prep: 35,
    eatOut: false,
    items: [
      { food: 'pork_tenderloin', g: 130, role: 'protein' },
      { food: 'lettuce', g: 60, role: 'veg' },
      { food: 'perilla', g: 10, role: 'veg' },
      { food: 'garlic', g: 10, role: 'veg' },
      { food: 'green_chili', g: 20, role: 'veg' },
      { food: 'ssamjang', g: 15, role: 'fixed' },
      { food: 'brown_rice', g: 140, role: 'carb' }
    ],
    how: '돼지 안심을 통째로 된장 약간, 통후추, 대파를 넣은 물에 25~30분 삶아 한 김 식힌 뒤 얇게 썰어요. 상추·깻잎에 수육, 마늘, 풋고추와 쌈장을 조금 올려 싸 먹어요.',
    tip: '쌈장은 쌈 하나에 콩알만큼만 올리고, 수육은 삼겹·목살 대신 안심·뒷다리살을 쓰면 지방이 크게 줄어요.'
  },

  /* ===== 간식 ===== */
  {
    id: 'sn_shake', slot: 'snack', name: '초코 프로틴 쉐이크', img: 'sn_shake',
    tags: ['운동 직후', '1분 완성'],
    prep: 1,
    eatOut: false,
    items: [
      { food: 'whey', g: 30, role: 'protein' },
      { food: 'milk_low', g: 200, role: 'fixed' }
    ],
    how: '쉐이커에 저지방 우유 200ml(또는 물 250ml)와 웨이 프로틴 1스쿱을 넣고 10초간 흔들어요.',
    tip: '운동 직후에 마시면 간편하게 단백질을 채울 수 있고, 우유 대신 물에 타면 약 80kcal가 줄어요.'
  },
  {
    id: 'sn_eggnut', slot: 'snack', name: '삶은 계란과 아몬드', img: 'sn_eggnut',
    tags: ['포만감', '휴대 간편'],
    prep: 1,
    eatOut: false,
    items: [
      { food: 'egg', g: 100, role: 'protein' },
      { food: 'almond', g: 15, role: 'carb' }
    ],
    how: '미리 삶아 둔 계란(또는 편의점 구운 계란) 2개와 아몬드 한 줌(약 15g, 12알 정도)을 먹어요.',
    tip: '견과류는 봉지째 먹으면 양 조절이 어려우니 한 번 먹을 만큼만 덜어 두거나 소포장을 골라요.'
  },
  {
    id: 'sn_apple', slot: 'snack', name: '사과와 스트링 치즈', img: 'sn_apple',
    tags: ['달콤', '휴대 간편'],
    prep: 2,
    eatOut: false,
    items: [
      { food: 'apple', g: 125, role: 'carb' },
      { food: 'string_cheese', g: 40, role: 'protein' }
    ],
    how: '사과 반 개를 껍질째 먹기 좋게 썰고 스트링 치즈 2개를 곁들여요.',
    tip: '과일만 먹으면 금방 허기지니 치즈 같은 단백질을 함께 먹으면 포만감이 오래가요.'
  },
  {
    id: 'sn_veg', slot: 'snack', name: '방울토마토·오이 스틱', img: 'sn_veg',
    tags: ['저칼로리', '배고플 때'],
    prep: 3,
    eatOut: false,
    items: [
      { food: 'cherry_tomato', g: 150, role: 'veg' },
      { food: 'cucumber', g: 100, role: 'veg' },
      { food: 'egg', g: 50, role: 'protein' }
    ],
    how: '방울토마토와 오이 스틱을 통에 담아 냉장고에 두고, 삶은 계란 1개와 함께 꺼내 먹어요.',
    tip: '식사 전에 허기가 심하거나 야식이 당길 때 과자 대신 먹는 비상 간식이에요.'
  }
];

/* ---------------------------------------------------------------------------
 * F.FOOD_GUIDE — 4 food groups
 * ------------------------------------------------------------------------- */
F.FOOD_GUIDE = [
  {
    id: 'grp_protein', img: 'grp_protein',
    title: '단백질 — 매 끼니 손바닥 1~1.5개',
    sub: '근육을 지키고 포만감을 오래 유지해 줘요. 하루 120~140g을 3~4번에 나눠 채워요.',
    items: ['닭가슴살', '계란', '두부', '연어', '소고기 우둔·홍두깨', '그릭요거트', '참치캔(물)'],
    tips: [
      '손바닥 크기·두께의 고기나 생선은 약 100g, 단백질 20~30g이에요.',
      '시판 닭가슴살·참치캔은 나트륨이 높은 제품도 있으니 성분표를 확인하고, 기름에 담긴 참치는 기름을 따라 버려요.',
      '햄·소시지·베이컨 같은 가공육은 나트륨과 지방이 많아 단백질 반찬으로 세지 않아요.'
    ]
  },
  {
    id: 'grp_carb', img: 'grp_carb',
    title: '탄수화물 — 끼니당 주먹 1개, 운동 전후에 배치',
    sub: '운동할 힘과 회복의 연료예요. 흰 밀가루·설탕 대신 식이섬유가 있는 통곡물과 고구마를 골라요.',
    items: ['현미밥·잡곡밥', '고구마', '오트밀', '통밀빵', '바나나', '단호박'],
    tips: [
      '주먹 1개는 밥 약 2/3공기(140g), 고구마 중간 1개 정도예요. 운동하는 날이나 활동량이 많은 날은 1공기까지 괜찮아요.',
      '운동 1~2시간 전과 운동 직후 끼니에 탄수화물을 배치하고, 줄인다면 운동과 먼 끼니에서 줄여요.',
      '흰쌀밥이 익숙하다면 잡곡을 30%부터 섞어 시작해요.'
    ]
  },
  {
    id: 'grp_veg', img: 'grp_veg',
    title: '채소 — 끼니마다 두 주먹 이상',
    sub: '열량은 낮고 식이섬유와 수분이 많아 배를 채워 줘요. 변비 예방과 혈당 관리에도 도움이 돼요.',
    items: ['브로콜리', '시금치', '버섯', '양배추', '파프리카', '상추', '오이', '방울토마토'],
    tips: [
      '채소를 먼저 먹고 단백질, 탄수화물 순서로 먹으면 과식을 줄이는 데 도움이 돼요.',
      '나물·샐러드의 열량과 나트륨은 대부분 양념과 드레싱에서 오니 소스는 따로 받아 찍어 먹어요.',
      '냉동 브로콜리나 데친 채소를 소분해 두면 바쁜 날에도 채소를 챙기기 쉬워요.'
    ]
  },
  {
    id: 'grp_avoid', img: 'grp_avoid',
    title: '줄여야 할 음식',
    sub: '완전히 끊기보다 횟수와 양을 줄이는 게 오래가요. 먹고 싶을 땐 아래처럼 바꿔 봐요.',
    items: [
      '라면 — 1봉에 하루 권장량에 가까운 나트륨, 정제 탄수화물',
      '치킨(튀김) — 반 마리만 먹어도 1,000kcal 안팎',
      '떡볶이 — 정제 탄수화물인 떡에 달고 짠 양념',
      '콜라·탄산음료 — 액상 당류라 포만감 없이 열량만 더해요',
      '맥주 — 술 열량에 안주까지 더해지고 식욕이 늘어요',
      '감자칩 — 한 봉지(60g)에 약 320kcal, 짜고 기름져요',
      '크루아상·도넛 — 버터·설탕·흰 밀가루, 1개 약 250~300kcal'
    ],
    tips: [
      '라면 → 면은 반만, 스프는 절반만 넣고 계란·채소를 더한 뒤 국물은 남겨요.',
      '튀김 치킨 → 오븐구이·전기구이를 고르고 껍질은 벗겨 먹어요.',
      '탄산음료 → 탄산수나 제로 음료로 바꾸고, 점차 물로 옮겨 가요.',
      '과자·빵 → 구운 계란, 무가당 요거트, 방울토마토처럼 단백질·채소 간식으로 바꿔요.'
    ]
  }
];

/* ---------------------------------------------------------------------------
 * F.EATING_OUT — common situations in Korea
 * ------------------------------------------------------------------------- */
F.EATING_OUT = [
  {
    id: 'meat', place: '고깃집 · 회식',
    pick: ['돼지는 삼겹살 대신 목살·앞다리·갈매기살', '소는 차돌·갈비 대신 안심·부채살', '상추·깻잎 쌈과 생채소, 생마늘', '된장찌개는 건더기 위주, 공기밥은 반 공기'],
    avoid: ['삼겹살·항정살·차돌박이처럼 기름진 부위', '달고 짠 양념갈비·양념 불고기', '마무리 볶음밥·냉면·라면'],
    tip: '고기와 쌈 채소로 먼저 배를 채우고, 밥이나 면은 정말 필요할 때만 마지막에 조금 먹어요.'
  },
  {
    id: 'hansik', place: '한식 백반 · 국밥',
    pick: ['생선구이·두부 반찬이 나오는 백반', '순대·내장 대신 살코기 국밥(수육국밥·소고기국밥)', '나물·쌈 채소 위주로 반찬 고르기', '비빔밥은 고추장을 반만'],
    avoid: ['국물까지 다 마시기(한 그릇에 나트륨 2,000mg을 넘기기 쉬워요)', '전·튀김·젓갈 반찬', '밥을 처음부터 국에 다 말기'],
    tip: '국밥은 밥을 따로 받아 반 공기만 말고, 국물보다 건더기를 먼저 건져 먹어요.'
  },
  {
    id: 'chinese', place: '중식',
    pick: ['팔보채·유산슬처럼 튀기지 않은 해물·채소 요리', '양장피(겨자 소스는 조금만)', '고추잡채에 꽃빵 1~2개', '식사는 잡탕밥·마파두부밥으로, 밥은 반만'],
    avoid: ['탕수육·깐풍기 같은 튀김에 달고 짠 소스', '짜장면·볶음밥(한 그릇 700~900kcal)', '짬뽕 국물(한 그릇 나트륨 약 4,000mg)'],
    tip: '여럿이 갈 땐 튀기지 않은 요리를 나눠 단백질을 먼저 채우고, 탕수육은 소스를 따로 받아 몇 조각만 찍어 먹어요.'
  },
  {
    id: 'bunsik', place: '분식',
    pick: ['계란·소고기·닭가슴살 김밥 1줄', '군만두 대신 찐만두', '삶은 계란 추가', '떡볶이는 여럿이 나눠 몇 개만 맛보기'],
    avoid: ['참치마요·돈가스·치즈 김밥', '떡볶이 국물에 튀김·밥 비벼 먹기', '라면 + 김밥 조합(탄수화물·나트륨 과다)'],
    tip: '분식은 탄수화물 위주라 단백질이 부족하기 쉬우니 삶은 계란이나 닭가슴살을 따로 챙겨요.'
  },
  {
    id: 'cvs', place: '편의점',
    pick: ['훈제 닭가슴살 + 컵샐러드 + 구운 계란', '삼각김밥 1개 + 구운 계란 2개 + 저지방 우유', '군고구마 + 무가당 그릭요거트(또는 단백질 음료)', '샐러드에 닭가슴살 추가, 드레싱은 절반만'],
    avoid: ['컵라면 + 삼각김밥(나트륨 2,000mg 안팎)', '튀김·소시지 반찬 위주 도시락', '가당 커피·과일 음료·에너지 음료'],
    tip: '영양성분표에서 단백질은 높고 나트륨·당류는 낮은 제품을 고르는 습관을 들여요. 훈제 닭가슴살도 제품마다 나트륨 차이가 커요.'
  },
  {
    id: 'drink', place: '술자리',
    pick: ['회·숙회·두부김치·골뱅이무침(소면은 빼고)', '노가리·황태구이·계란말이', '오이·당근 스틱', '술 1잔마다 물 1잔'],
    avoid: ['치킨·감자튀김·소시지 같은 튀김 안주', '마무리 라면·볶음밥', '달콤한 칵테일·과일 소주·폭탄주'],
    tip: '알코올이 분해되는 동안 지방 연소는 뒤로 밀리고 식욕은 커져요. 마실 양(예: 소주 2~3잔)을 미리 정하고, 단백질 안주부터 먹어 과식을 막아요.'
  },
  {
    id: 'delivery', place: '배달',
    pick: ['샐러드·포케(소스는 따로, 절반만)', '보쌈은 살코기 위주로 쌈 채소와 함께', '회·회덮밥(초장은 조금, 밥은 반)', '마라탕은 채소·두부·고기 위주로 담고 국물은 남기기'],
    avoid: ['치킨·피자 세트(1인분이 1,000kcal를 쉽게 넘어요)', '찜닭·떡볶이처럼 당면·떡이 많은 메뉴', '감자튀김·치즈볼·탄산음료 사이드'],
    tip: '포장째 먹지 말고 접시에 먹을 만큼만 덜어 먹고, 남은 음식은 바로 냉장고에 넣어 다음 끼니로 돌려요.'
  }
];

/* ---------------------------------------------------------------------------
 * F.DIET_RULES — core principles
 * ------------------------------------------------------------------------- */
F.DIET_RULES = [
  {
    title: '접시 법칙',
    body: '한 끼를 손으로 재요. 단백질은 손바닥 1~1.5개, 탄수화물은 주먹 1개, 채소는 두 주먹 이상, 지방(기름·견과류)은 엄지 1개 정도예요. 운동하는 날은 운동 전후 끼니의 탄수화물을 반 주먹 늘려요.'
  },
  {
    title: '매 끼니 단백질',
    body: '하루 120~140g을 한두 끼에 몰아 먹기보다 끼니마다 25~40g씩 나누면 근육 유지와 포만감에 유리해요. 부족한 날은 그릭요거트, 계란, 웨이 프로틴으로 채워요.'
  },
  {
    title: '물은 체중 × 30~35ml',
    body: '90kg이면 하루 약 2.7~3.2L예요. 물병을 곁에 두고 끼니마다 1~2컵씩 마시고, 운동하는 날은 500ml~1L를 더해요. 소변이 옅은 노란색이면 충분하고, 신장·심장 질환으로 수분 제한을 받고 있다면 의사 지시를 따라요.'
  },
  {
    title: '국물은 남기고 싱겁게',
    body: '찌개·국·라면 국물과 김치·장류에 나트륨이 몰려 있어요. 국물은 건더기 위주로 먹고 절반 이상 남기며, 하루 나트륨 2,000mg 안팎을 목표로 해요. 짜게 먹은 다음 날 체중이 0.5~1kg 오르는 건 대부분 수분이에요.'
  },
  {
    title: '야식 줄이고 7시간 자기',
    body: '잠들기 2~3시간 전에는 식사를 마쳐요. 잠이 부족하면 식욕 조절 호르몬이 흔들려 다음 날 배고픔과 단 음식 욕구가 커져요. 7시간 이상 자는 것도 다이어트의 일부예요.'
  },
  {
    title: '술은 횟수와 양을 정해서',
    body: '알코올은 1g에 7kcal로 열량이 높고, 분해되는 동안 지방 연소가 뒤로 밀리며 안주 과식으로 이어지기 쉬워요. 마신다면 주 1회 이하로, 양을 미리 정하고 튀김 안주는 피해요.'
  },
  {
    title: '체중은 같은 조건, 주간 단위로',
    body: '아침에 일어나 화장실을 다녀온 뒤, 먹기 전에 같은 체중계로 재요. 주 1회 같은 요일에 재거나 매일 재서 주간 평균을 비교하고, 하루하루의 출렁임은 수분 변화라 신경 쓰지 않아도 돼요. 주당 체중의 0.5~1%(약 0.5~0.9kg) 감량이 근육을 지키는 적당한 속도예요.'
  },
  {
    title: '운동 전후 탄수화물은 지키기',
    body: '탄수화물을 0으로 줄이면 운동 강도가 떨어지고 회복이 늦어져요. 운동 1~2시간 전이나 운동 직후 끼니에는 밥 반~1공기, 고구마, 바나나 같은 탄수화물을 남겨 두고, 줄이려면 운동과 먼 끼니에서 줄여요.'
  }
];

/* ---------------------------------------------------------------------------
 * F.SUPPLEMENTS — ordered by priority. evidence: A strong, B moderate, C limited
 * when: any of 'morning', 'meal', 'pre', 'post', 'night'
 * ------------------------------------------------------------------------- */
F.SUPPLEMENTS = [
  {
    id: 'whey', img: 'supp_whey', name: '웨이 프로틴', priority: 1, evidence: 'A',
    dose: '1스쿱 (단백질 20~25g)',
    timing: '운동 직후 또는 단백질이 부족한 끼니에',
    when: ['post'],
    why: '식사만으로 하루 단백질 120~140g을 채우기 어려울 때 가장 간편한 방법이에요. 근력 운동과 함께하면 감량 중 근육 손실을 줄이는 데 도움이 돼요.',
    how: '물이나 저지방 우유 200~300ml에 1스쿱을 타요. 하루 1~2스쿱이면 충분하고 나머지는 음식으로 채워요. 1회 단백질 20g 이상, 당류 5g 이하인 제품을 골라요.',
    caution: '우유를 마시면 배가 불편한 유당불내증이 있다면 유당을 대부분 걸러 낸 분리유청(WPI) 제품을 골라요. 우유 알레르기가 있으면 피하고, 신장 질환으로 단백질 제한을 받고 있거나 임신·수유 중이면 먼저 의사·약사와 상의해요.'
  },
  {
    id: 'creatine', img: 'supp_creatine', name: '크레아틴', priority: 2, evidence: 'A',
    dose: '크레아틴 일수화물 하루 3~5g',
    timing: '매일 식사와 함께 (운동한 날은 운동 후 쉐이크에 섞어도 좋아요)',
    when: ['meal'],
    why: '근력과 근육량 증가에 대한 근거가 가장 탄탄한 운동 보충제예요. 감량 중에도 운동 강도와 근육을 지키는 데 도움이 돼요.',
    how: '로딩(하루 20g) 없이 매일 3~5g을 꾸준히 먹으면 3~4주 안에 근육 속 농도가 충분히 올라가요. 쉬는 날에도 거르지 말고 물을 평소보다 넉넉히 마셔요. 성분이 크레아틴 일수화물(모노하이드레이트) 하나인 기본 제품이면 충분해요.',
    caution: '처음 2~4주에 근육 속 수분이 늘어 체중이 1~2kg 오를 수 있는데, 지방이 아니라 수분이에요. 혈액검사에서 크레아티닌(신장 기능 지표)이 높게 나올 수 있으니 검사 때 복용 사실을 알려요. 신장 질환이 있거나 이뇨제·소염진통제 등을 오래 먹고 있다면, 그리고 임신·수유 중이면 복용 전에 의사·약사와 상의해요.'
  },
  {
    id: 'omega3', img: 'supp_omega3', name: '오메가-3', priority: 3, evidence: 'B',
    dose: 'EPA+DHA 합계 하루 약 1g',
    timing: '식사 중 또는 식사 직후',
    when: ['meal'],
    why: '생선을 주 2회 이상 먹기 어렵다면 EPA·DHA를 보충할 수 있어요. 중성지방을 낮추는 효과는 근거가 있지만, 체지방을 직접 줄여 주지는 않아요.',
    how: '라벨에서 캡슐 용량이 아니라 "EPA와 DHA의 합"을 확인해 하루 약 1g으로 맞춰요. 연어·고등어를 먹은 날은 걸러도 괜찮아요.',
    caution: '와파린·아스피린·클로피도그렐 같은 항응고·항혈소판제를 먹고 있거나, 수술·시술을 앞두고 있거나, 심방세동 같은 부정맥 병력이 있다면 의사·약사와 상의해요. 비린 트림이 불편하면 식사 중에 먹거나 캡슐을 냉동해 두고 먹어요. 생선 알레르기가 있거나 임신 중이면 복용 전에 전문가와 상의해요.'
  },
  {
    id: 'vitd', img: 'supp_vitd', name: '비타민 D', priority: 4, evidence: 'B',
    dose: 'D3 하루 1,000~2,000 IU (25~50μg)',
    timing: '지방이 들어 있는 식사와 함께',
    when: ['meal'],
    why: '실내 생활과 자외선 차단 때문에 한국인은 비타민 D가 부족한 경우가 흔해요. 부족하면 뼈 건강과 근육 기능에 불리할 수 있어요.',
    how: '계란·연어·견과류처럼 지방이 있는 식사와 함께 먹으면 흡수가 잘 돼요. 건강검진 때 혈중 비타민 D(25(OH)D) 수치를 확인해 두면 용량을 정하기 쉬워요.',
    caution: '검사 없이 하루 4,000 IU를 넘는 고용량을 오래 먹지 않아요. 종합비타민에 든 양도 합산해요. 신장 질환, 고칼슘혈증, 부갑상선 질환이 있거나 이뇨제·심장약(디곡신) 등을 먹고 있다면 의사·약사와 상의해요.'
  },
  {
    id: 'magnesium', img: 'supp_mag', name: '마그네슘', priority: 5, evidence: 'C',
    dose: '원소 마그네슘 200~350mg (글리시네이트·구연산염)',
    timing: '저녁 식사 후 또는 자기 1시간 전',
    when: ['night'],
    why: '땀을 흘리고 식사량을 줄이면 부족해지기 쉬운 미네랄이에요. 수면의 질이나 근육 경련에 도움이 된다는 연구가 있지만 효과는 크지 않아, 부족할 때 채운다는 정도로 생각해요.',
    how: '라벨의 "마그네슘으로서 ○○mg"(원소 함량)을 확인하고, 보충제로는 하루 350mg을 넘기지 않아요. 시금치·견과류·두부·현미 같은 음식으로도 함께 채워요.',
    caution: '산화마그네슘은 설사를 일으키기 쉬워요. 설사가 나면 양을 줄이거나 글리시네이트로 바꿔요. 신장 기능이 떨어져 있으면 몸에 쌓일 수 있어 먼저 의사와 상의하고, 일부 항생제(테트라사이클린·퀴놀론계)·골다공증약·갑상선약을 먹고 있다면 복용 간격을 약사에게 확인해요.'
  },
  {
    id: 'multi', img: 'supp_multi', name: '종합비타민', priority: 6, evidence: 'C',
    dose: '하루 1정 (각 성분 권장섭취량 100% 안팎)',
    timing: '아침 식사 직후',
    when: ['morning', 'meal'],
    why: '열량을 줄이면 비타민·미네랄 섭취도 함께 줄어요. 식단이 단조로운 감량기에 부족분을 메우는 보험 역할이지만, 건강상 이득에 대한 근거는 제한적이에요.',
    how: '각 성분이 권장섭취량의 100% 안팎인 기본 제품이면 충분해요. 수백~수천 %를 담은 고함량 제품은 필요 없어요.',
    caution: '채소·과일을 대신하지는 못해요. 다른 영양제와 성분이 겹치면 합산해서 상한을 넘지 않게 하고, 특히 비타민 A(레티놀)와 철분은 중복으로 먹지 않아요(철분은 결핍이 확인된 경우가 아니면 따로 추가하지 않아요). 와파린을 복용 중이거나(비타민 K) 임신을 계획 중·임신 중이면 의사·약사와 상의해요.'
  },
  {
    id: 'fiber', img: 'supp_fiber', name: '차전자피 식이섬유', priority: 7, evidence: 'B',
    dose: '차전자피 5g + 물 300ml 이상',
    timing: '식사 15~30분 전',
    when: ['meal'],
    why: '물을 머금고 부풀어 포만감을 높이고, 식사량이 줄면서 생기기 쉬운 변비를 예방해요. LDL 콜레스테롤과 식후 혈당을 낮추는 효과도 근거가 있어요.',
    how: '처음엔 하루 1회 2~3g으로 시작해 1~2주에 걸쳐 5g까지 늘리면 가스와 더부룩함이 덜해요. 물에 타서 굳기 전에 바로 마시고, 이어서 물을 한 컵 더 마셔요.',
    caution: '물을 충분히 마시지 않으면 오히려 변비가 생기거나 목·식도에 걸릴 수 있어요. 약과 다른 영양제의 흡수를 방해할 수 있으니 2시간 이상 간격을 둬요. 삼킴 장애나 장폐색·장 협착 병력이 있거나, 당뇨약을 먹고 있다면(혈당이 더 내려갈 수 있어요) 의사·약사와 상의해요.'
  }
];

/* ---------------------------------------------------------------------------
 * F.SUPP_AVOID — popular weight-loss products the app does not recommend
 * ------------------------------------------------------------------------- */
F.SUPP_AVOID = [
  {
    name: '가르시니아 캄보지아(HCA)',
    reason: '사람 대상 연구에서 체지방 감소 효과가 작고 일관되지 않아요. 드물게 간 손상 사례도 보고돼 감량 목적으로 권하지 않아요.'
  },
  {
    name: '고용량 녹차 추출물(카테킨)',
    reason: '마시는 녹차와 달리 농축 추출물을 고용량이나 공복으로 먹으면 간 수치 상승과 간 손상 사례가 보고됐어요. 감량 효과는 미미해요.'
  },
  {
    name: 'CLA(공액리놀레산)',
    reason: '연구를 모아 보면 체지방 감소 효과가 수개월에 1kg 미만으로 작고, 위장 불편이 흔하며 일부 연구에서는 인슐린 저항성이 나빠졌어요.'
  },
  {
    name: '카페인·흥분제 혼합 "지방 연소제"',
    reason: '고용량 카페인에 시네프린 같은 흥분 성분이 섞여 심박수·혈압 상승, 불면, 불안을 일으킬 수 있어요. 해외 직구 제품에서는 국내 금지 성분이 검출된 사례도 있어요.'
  },
  {
    name: '변비약·이뇨 성분 "디톡스" 차',
    reason: '빠지는 건 지방이 아니라 수분과 장 내용물이라 금방 돌아와요. 반복하면 탈수, 전해질 불균형, 장 기능 저하가 생길 수 있어요.'
  }
];
