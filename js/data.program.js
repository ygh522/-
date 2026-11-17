/* Program library — phases, workout templates, weekly patterns, cardio levels.
   Content only; logic lives in engine.js. */
window.F = window.F || {};

/* ---------- Phases (12-week beginner fat-loss block, then repeat P3) ---------- */
F.PHASES = [
  {
    id: 1, code: 'P1', name: '적응기', en: 'FOUNDATION', weeks: [1, 4],
    reps: [12, 15], sets: 2, rir: 3, rest: 60,
    cardioMax: 7,
    goal: '관절과 힘줄이 운동에 적응하고, 머신 위주로 정확한 자세를 몸에 새기는 4주예요.',
    focus: ['가벼운 무게로 12~15회', '모든 세트 여유 2~3회 남기기', '유산소는 경사 걷기 20~30분'],
  },
  {
    id: 2, code: 'P2', name: '기초 근력', en: 'BUILD', weeks: [5, 8],
    reps: [10, 12], sets: 3, rir: 2, rest: 75,
    cardioMax: 10,
    goal: '세트를 3세트로 늘리고 프리웨이트 비중을 높여 근육량을 지키며 지방을 태우는 4주예요.',
    focus: ['3세트 × 10~12회', '여유 1~2회까지 집중', '유산소 30~35분, 경사 10~12%'],
  },
  {
    id: 3, code: 'P3', name: '강화기', en: 'PROGRESS', weeks: [9, 12],
    reps: [8, 12], sets: 3, rir: 2, rest: 90,
    cardioMax: 12,
    goal: '무게를 꾸준히 올려 기초대사량을 끌어올리고, 유산소 시간을 늘려 감량 속도를 유지하는 4주예요.',
    focus: ['3~4세트 × 8~12회', '주요 운동은 4세트', '유산소 35~45분'],
  },
];

/* ---------- Workout templates ---------- */
F.TEMPLATES = {
  FA: { id: 'FA', name: '전신 A', en: 'FULL BODY A', region: 'full',
        ex: ['leg_press', 'lat_pulldown', 'chest_press', 'db_rdl', 'seated_row', 'plank'],
        focus: '하체 밀기 · 등 당기기 · 가슴 밀기를 머신 위주로' },
  FB: { id: 'FB', name: '전신 B', en: 'FULL BODY B', region: 'full',
        ex: ['goblet_squat', 'shoulder_press', 'db_row', 'hip_thrust', 'leg_curl', 'dead_bug'],
        focus: '스쿼트 패턴 · 어깨 · 엉덩이 강화' },
  FC: { id: 'FC', name: '전신 C', en: 'FULL BODY C', region: 'full',
        ex: ['deadlift', 'db_bench', 'lat_pulldown', 'split_squat', 'face_pull', 'bird_dog'],
        focus: '데드리프트 · 덤벨 프레스 · 한 발 하체' },
  UA: { id: 'UA', name: '상체 A', en: 'UPPER A', region: 'upper',
        ex: ['chest_press', 'lat_pulldown', 'shoulder_press', 'seated_row', 'lateral_raise', 'triceps_pushdown'],
        focus: '머신 위주 상체 밀기·당기기' },
  LA: { id: 'LA', name: '하체 A', en: 'LOWER A', region: 'lower',
        ex: ['leg_press', 'db_rdl', 'leg_curl', 'leg_extension', 'hip_abduction', 'plank'],
        focus: '허벅지 앞·뒤 + 엉덩이 옆' },
  UB: { id: 'UB', name: '상체 B', en: 'UPPER B', region: 'upper',
        ex: ['db_bench', 'db_row', 'db_shoulder_press', 'face_pull', 'db_curl', 'incline_pushup'],
        focus: '덤벨 위주 상체 + 자세 교정(페이스풀)' },
  LB: { id: 'LB', name: '하체 B', en: 'LOWER B', region: 'lower',
        ex: ['goblet_squat', 'deadlift', 'hip_thrust', 'split_squat', 'leg_extension', 'dead_bug'],
        focus: '스쿼트 · 힙힌지 · 엉덩이 집중' },
  CC: { id: 'CC', name: '유산소 + 코어', en: 'CARDIO + CORE', region: 'cardio',
        ex: ['plank', 'dead_bug', 'bird_dog'],
        focus: '긴 유산소로 지방 연소 + 코어 안정화', longCardio: true },
};

/* Rotation by weekly frequency. The next session always takes the next template in the
   rotation, so a missed day never skips a workout. */
F.ROTATION = {
  2: ['FA', 'FB'],
  3: ['FA', 'FB', 'FC'],
  4: ['UA', 'LA', 'UB', 'LB'],
  5: ['UA', 'LA', 'CC', 'UB', 'LB'],
};

/* ---------- Weekly day patterns (0=Sun ... 6=Sat) with the reasons a PT would give ---------- */
F.PATTERNS = {
  2: {
    days: [1, 4],
    title: '월 · 목',
    reasons: [
      '전신 운동 사이에 72시간(3일)을 비워 근육이 완전히 회복된 상태에서 다시 자극해요.',
      '두 번 모두 주중(월~금)이라 "주중 최소 2회" 원칙을 지켜요.',
      '주말은 자유 시간 — 대신 하루 8,000보 걷기로 활동량을 채워요.',
    ],
  },
  3: {
    days: [1, 3, 5],
    title: '월 · 수 · 금',
    reasons: [
      '격일 배치로 같은 근육이 최소 48시간 쉬어요. 초보자 근성장에 가장 효율적인 빈도예요.',
      '세 번 모두 주중이라 주말 약속이 생겨도 주간 목표가 흔들리지 않아요.',
      '금요일 운동은 주말 과식 전에 소모 칼로리와 의지를 끌어올려 줘요.',
    ],
  },
  4: {
    days: [1, 2, 4, 5],
    title: '월 · 화 · 목 · 금',
    reasons: [
      '상체/하체 분할이라 이틀 연속이어도 서로 다른 부위를 써서 회복에 문제가 없어요.',
      '수요일 휴식으로 주중 피로를 한 번 리셋해요.',
      '주말은 완전 휴식 또는 가벼운 걷기 — 꾸준함이 강도보다 중요해요.',
    ],
  },
  5: {
    days: [1, 2, 3, 5, 6],
    title: '월 · 화 · 수 · 금 · 토',
    reasons: [
      '상체·하체 사이에 "유산소+코어" 날(수)을 넣어 근육은 쉬고 지방 연소는 계속돼요.',
      '목요일 완전 휴식으로 회복 리듬을 만들어요.',
      '토요일 하체 운동으로 주말에도 활동량을 지켜요.',
    ],
  },
};

F.DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
F.DAY_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/* ---------- Cardio progression levels ----------
   Level 1..12. Each session's rating moves the level; each phase caps the level. */
F.CARDIO = {
  treadmill: {
    id: 'treadmill', name: '트레드밀 경사 걷기', short: '경사 걷기', img: 'treadmill',
    levels: [
      null,
      { incline: 4, speed: 4.5, min: 20 },
      { incline: 6, speed: 4.5, min: 20 },
      { incline: 6, speed: 4.8, min: 25 },
      { incline: 8, speed: 4.5, min: 25 },
      { incline: 8, speed: 4.8, min: 30 },
      { incline: 10, speed: 4.5, min: 30 },
      { incline: 10, speed: 4.8, min: 30 },
      { incline: 12, speed: 4.0, min: 30 },
      { incline: 12, speed: 4.5, min: 30 },
      { incline: 12, speed: 4.8, min: 35 },
      { incline: 12, speed: 5.0, min: 40 },
      { incline: 12, speed: 5.2, min: 45 },
    ],
  },
  bike: {
    id: 'bike', name: '실내 사이클', short: '사이클', img: 'bike',
    levels: [
      null,
      { level: 4, rpm: '70~80', min: 20, met: 4.8 },
      { level: 5, rpm: '70~80', min: 20, met: 5.2 },
      { level: 5, rpm: '75~85', min: 25, met: 5.5 },
      { level: 6, rpm: '75~85', min: 25, met: 5.8 },
      { level: 6, rpm: '80~90', min: 30, met: 6.2 },
      { level: 7, rpm: '80~90', min: 30, met: 6.6 },
      { level: 8, rpm: '80~90', min: 30, met: 7.0 },
      { level: 8, rpm: '85~95', min: 35, met: 7.3 },
      { level: 9, rpm: '85~95', min: 35, met: 7.6 },
      { level: 10, rpm: '85~95', min: 40, met: 8.0 },
      { level: 11, rpm: '85~95', min: 40, met: 8.4 },
      { level: 12, rpm: '90~100', min: 45, met: 8.8 },
    ],
  },
  elliptical: {
    id: 'elliptical', name: '일립티컬 (크로스 트레이너)', short: '일립티컬', img: 'elliptical',
    levels: [
      null,
      { level: 3, ramp: 2, min: 20, met: 4.8 },
      { level: 4, ramp: 2, min: 20, met: 5.1 },
      { level: 4, ramp: 4, min: 25, met: 5.4 },
      { level: 5, ramp: 4, min: 25, met: 5.7 },
      { level: 5, ramp: 6, min: 30, met: 6.0 },
      { level: 6, ramp: 6, min: 30, met: 6.4 },
      { level: 7, ramp: 6, min: 30, met: 6.8 },
      { level: 7, ramp: 8, min: 35, met: 7.1 },
      { level: 8, ramp: 8, min: 35, met: 7.4 },
      { level: 9, ramp: 8, min: 40, met: 7.8 },
      { level: 10, ramp: 10, min: 40, met: 8.2 },
      { level: 11, ramp: 10, min: 45, met: 8.6 },
    ],
  },
  stairmill: {
    id: 'stairmill', name: '천국의 계단 (스텝밀)', short: '스텝밀', img: 'stairmill', minPhase: 2,
    levels: [
      null,
      { level: 2, min: 6, met: 7.5 },
      { level: 2, min: 8, met: 7.5 },
      { level: 3, min: 8, met: 8.0 },
      { level: 3, min: 10, met: 8.0 },
      { level: 3, min: 12, met: 8.0 },
      { level: 4, min: 12, met: 8.8 },
      { level: 4, min: 15, met: 8.8 },
      { level: 5, min: 15, met: 9.5 },
      { level: 5, min: 18, met: 9.5 },
      { level: 5, min: 20, met: 9.5 },
      { level: 6, min: 20, met: 10.0 },
      { level: 6, min: 25, met: 10.0 },
    ],
  },
};
F.CARDIO_ORDER = ['treadmill', 'bike', 'elliptical', 'stairmill'];

/* ---------- XP / levels ---------- */
F.LEVEL_TITLES = [
  [1, '헬린이'], [3, '출석러'], [5, '루틴러'], [7, '땀방울'], [10, '근성러'],
  [13, '체지방 헌터'], [16, '바디 체인저'], [20, '아이언 멘탈'], [25, '레전드'],
];

F.BADGES = [
  { id: 'first_session', name: '첫 출석', desc: '첫 운동을 완료했어요', icon: 'flag' },
  { id: 'first_test', name: '무게 찾기', desc: '첫 무게 테스트를 완료했어요', icon: 'scale' },
  { id: 'week_goal', name: '주간 목표', desc: '한 주 계획을 모두 지켰어요', icon: 'target' },
  { id: 'weekday2', name: '주중 2회', desc: '주중(월~금) 2회 이상 출석했어요', icon: 'check2' },
  { id: 'streak4', name: '4주 연속', desc: '4주 연속 주간 목표 달성', icon: 'bolt' },
  { id: 'streak8', name: '8주 연속', desc: '8주 연속 주간 목표 달성', icon: 'bolt2' },
  { id: 'sessions10', name: '10회 출석', desc: '누적 10회 운동', icon: 'n10' },
  { id: 'sessions30', name: '30회 출석', desc: '누적 30회 운동', icon: 'n30' },
  { id: 'sessions50', name: '50회 출석', desc: '누적 50회 운동', icon: 'n50' },
  { id: 'cardio300', name: '유산소 300분', desc: '누적 유산소 300분', icon: 'heart' },
  { id: 'cardio1000', name: '유산소 1000분', desc: '누적 유산소 1,000분', icon: 'heart2' },
  { id: 'inbody1', name: '첫 인바디', desc: '인바디 기록을 처음 등록했어요', icon: 'doc' },
  { id: 'inbody3', name: '3개월 추적', desc: '인바디 3회 이상 기록', icon: 'chart' },
  { id: 'loss3', name: '-3kg', desc: '시작 체중보다 3kg 감량', icon: 'down' },
  { id: 'loss5', name: '-5kg', desc: '시작 체중보다 5kg 감량', icon: 'down' },
  { id: 'loss10', name: '-10kg', desc: '시작 체중보다 10kg 감량', icon: 'down2' },
  { id: 'pbf3', name: '체지방률 -3%p', desc: '첫 인바디 대비 체지방률 3%p 감소', icon: 'drop' },
  { id: 'smm_up', name: '근육 지킴이', desc: '감량 중 골격근량 유지·증가', icon: 'muscle' },
  { id: 'comeback', name: '대체 출석', desc: '약속이 생겨도 대체일에 출석했어요', icon: 'swap' },
  { id: 'meal7', name: '식단 7일', desc: '식단 체크 7일 달성', icon: 'bowl' },
];
