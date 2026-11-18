window.F = window.F || {};
/* Supplement catalog for "내 영양제" — content only (plain text, no HTML, no logic).
   The person ticks what they own; the app places each item at a time of day relative to their meals,
   workout and bedtime, shows a banner ("곧 종합비타민 · 오메가3 섭취 시간이에요") and asks them to confirm.
   Facts match F.SUPPLEMENTS in data.nutrition.js, and its 7 ids are kept as they are
   (whey, creatine, omega3, vitd, magnesium, multi, fiber).

   F.SUPP_SLOTS     ordered slots the app maps to clock times: key → { label, hint }
   F.SUPP_CATALOG   one entry per product category, ordered by cat (order below), then by how common it is
     id, name, aka  aka = other names people type when searching
     cat            '비타민' '미네랄' '지방산' '장 건강' '운동' '관절·뼈' '눈' '간·피로' '피부·모발' '기타'
     slots          1–2 slot keys in priority order: slots[0] is the default, slots[1] the fallback
                    (never another breakfast slot, so it still works for people who skip breakfast).
                    Items whose slots hold only workout slots (bcaa, preworkout) are for workout days only.
     gymSlot        optional; used instead of slots on workout days
     withFood       true = take around a meal; false = fine without food
     fatMeal        true = fat-soluble: put it with the day's fattiest meal when known, else slots[0]
     split          true = better in 2 doses: half the daily amount at slots[0] and half at slots[1]
     dose           typical label dose in plain words
     why            1 sentence · timing 1–2 sentences · caution 1–2 sentences
     avoid          ids not to take at the same time, listed on both sides; keep them gapHours apart
   F.SUPP_RULES     general rules the app can show: { title, body } */

/* ---------------------------------------------------------------------------
 * F.SUPP_SLOTS
 * ------------------------------------------------------------------------- */
F.SUPP_SLOTS = {
  wake:            { label: '기상 직후 · 공복',  hint: '일어나자마자 물 한 컵과 함께, 아무것도 먹기 전에 먹어요.' },
  beforeBreakfast: { label: '아침 식사 30분 전', hint: '빈속에 먹어야 흡수가 잘 되는 제품을 아침 식사 전에 먹어요.' },
  breakfast:       { label: '아침 식사 직후',    hint: '아침에 먹는 게 좋거나 빈속엔 속이 쓰린 제품을 식사 후 바로 먹어요.' },
  lunch:           { label: '점심 식사 직후',    hint: '아침 영양제와 시간을 떼어야 하는 제품을 점심 식사 후 바로 먹어요.' },
  dinner:          { label: '저녁 식사 직후',    hint: '기름기 있는 식사와 함께 흡수되는 지용성 제품을 먹기 좋은 때예요.' },
  preWorkout:      { label: '운동 30분 전',      hint: '운동하는 날에만, 운동을 시작하기 30분 전에 먹어요.' },
  postWorkout:     { label: '운동 직후',         hint: '운동하는 날에만, 운동을 마치고 바로 챙겨요.' },
  bed:             { label: '잠들기 30분 전',    hint: '카페인 같은 각성 성분이 없는 제품만 물과 함께 먹어요.' }
};

/* ---------------------------------------------------------------------------
 * F.SUPP_CATALOG — 35 items
 * ------------------------------------------------------------------------- */
F.SUPP_CATALOG = [
  /* ===== 비타민 ===== */
  {
    id: 'multi', name: '종합비타민',
    aka: ['멀티비타민', '종합 비타민', '멀티', '종합영양제', '비타민 미네랄', '멀티미네랄'],
    cat: '비타민', slots: ['breakfast', 'lunch'], withFood: true, fatMeal: false, split: false,
    dose: '하루 1정 (제품 표기량)',
    why: '열량을 줄인 식단에서 생기기 쉬운 비타민·미네랄 빈틈을 메우는 보험 같은 제품이고, 그 이상의 건강 효과는 근거가 약해요.',
    timing: '아침 식사 직후에 먹어요. 빈속에 먹으면 메스꺼울 수 있고, 비타민B군이 들어 있어 저녁보다 아침이 무난해요.',
    avoid: ['iron', 'fiber'], gapHours: 2,
    caution: '비타민D·철분·아연 같은 단일 제품을 함께 먹는다면 함량을 더해 상한을 넘지 않게 해요. 갑상선약과는 4시간 이상 떼어 먹고, 와파린을 먹고 있거나(비타민K) 임신 중·임신 준비 중이면 의사·약사와 상의해요.'
  },
  {
    id: 'vitd', name: '비타민D',
    aka: ['비타민 D', '비타민D3', '비타민 D3', 'D3', '비타민디', '비타민D 드롭'],
    cat: '비타민', slots: ['dinner', 'lunch'], withFood: true, fatMeal: true, split: false,
    dose: 'D3 하루 1,000~2,000 IU (25~50μg)',
    why: '실내 생활이 많은 한국인에게 흔히 부족한 비타민으로 뼈와 근육 기능에 필요하지만, 혈중 수치가 충분한 사람이 더 먹는다고 이득이 커지지는 않아요.',
    timing: '지용성이라 하루 중 기름기가 가장 많은 식사 직후에 먹으면 흡수가 잘 돼요. 몇 시에 먹느냐보다 매일 거르지 않는 게 더 중요해요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '종합비타민·칼마디·오메가3 복합 제품에 든 양까지 더하고, 검사 없이 하루 4,000 IU를 넘겨 오래 먹지 않아요. 신장 질환·고칼슘혈증이 있거나 이뇨제·디곡신을 먹고 있다면 의사·약사와 상의해요.'
  },
  {
    id: 'vitc', name: '비타민C',
    aka: ['비타민 C', '비타민씨', '아스코르빈산', '고함량 비타민C', '리포좀 비타민C', '메가도스'],
    cat: '비타민', slots: ['breakfast', 'lunch'], withFood: true, fatMeal: false, split: true,
    dose: '하루 500~1,000mg (제품 표기량)',
    why: '채소·과일이 부족한 날의 빈틈을 채우고 식물성 철분의 흡수를 돕지만, 많이 먹을수록 피로나 면역이 더 좋아진다는 근거는 약해요.',
    timing: '수용성이라 몸에 오래 머물지 않아 아침·점심 식사 직후로 나눠 먹으면 좋고, 빈속에 먹으면 속이 쓰릴 수 있어요. 철분제를 먹는다면 그중 한 번은 철분과 같이 먹어도 돼요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '하루 2,000mg을 넘기면 설사·속쓰림이 생기기 쉽고, 신장결석을 앓은 적이 있다면 고함량은 피해요. 항암 치료 중이거나 몸에 철이 쌓이는 질환이 있다면 먼저 의사와 상의해요.'
  },
  {
    id: 'vitb', name: '비타민B 컴플렉스',
    aka: ['비타민B', '비타민 B', '비타민B군', 'B 컴플렉스', '비타민B 복합', '활성비타민', '고함량 비타민B', '비타민B1', '비타민B6', '비타민B12'],
    cat: '비타민', slots: ['breakfast', 'lunch'], withFood: true, fatMeal: false, split: false,
    dose: '제품 표기량 (보통 하루 1정)',
    why: '먹은 음식을 에너지로 바꾸는 데 쓰이는 비타민들로 식사가 불규칙하거나 술을 자주 마시면 부족해지기 쉽지만, 많이 먹는다고 피로가 풀린다는 근거는 약해요.',
    timing: '아침 식사 직후에 먹어요. 저녁에 먹으면 잠이 얕아진다는 사람이 있어 아침이 무난하고, 소변이 진한 노란색이 되는 건 비타민B2 때문이라 괜찮아요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '종합비타민과 함께 먹으면 B6가 겹치기 쉬운데, 고함량 B6를 오래 먹으면 손발이 저릴 수 있어 합계를 확인해요. 항경련제 같은 약을 먹고 있거나 임신·수유 중이면 약사와 상의해요.'
  },
  {
    id: 'vite', name: '비타민E',
    aka: ['비타민 E', '토코페롤', '천연 비타민E', '알파 토코페롤'],
    cat: '비타민', slots: ['dinner', 'lunch'], withFood: true, fatMeal: true, split: false,
    dose: '제품 표기량 (하루 필요량은 약 12mg)',
    why: '세포를 산화로부터 지키는 데 필요한 지용성 비타민이지만 견과류·식물성 기름으로 대부분 충분하고, 고함량 보충의 이득은 근거가 약해요.',
    timing: '지용성이라 하루 중 기름기가 가장 많은 식사 직후에 먹으면 흡수가 잘 돼요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '고함량(400 IU 이상)을 오래 먹으면 출혈 경향이 커질 수 있어, 와파린·항혈소판제를 먹거나 수술을 앞두고 있다면 의사·약사와 상의해요. 종합비타민에 든 양과 더해서 확인해요.'
  },
  {
    id: 'vitk2', name: '비타민K2',
    aka: ['비타민 K2', 'K2', 'MK-7', '메나퀴논', '비타민K', '비타민D3 K2'],
    cat: '비타민', slots: ['dinner', 'lunch'], withFood: true, fatMeal: true, split: false,
    dose: '제품 표기량 (보통 하루 100μg 안팎)',
    why: '칼슘이 뼈에 쓰이도록 돕는 단백질이 일하는 데 필요한 비타민이지만, 건강한 사람이 따로 먹었을 때 뼈·혈관 이득은 아직 근거가 제한적이에요.',
    timing: '지용성이라 비타민D와 함께 하루 중 기름기가 가장 많은 식사 직후에 먹어요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '와파린을 먹고 있다면 약효가 달라질 수 있어 임의로 시작하거나 끊지 말고 의사와 상의해요. 종합비타민이나 D3+K2 복합 제품에도 들어 있으니 겹치는지 확인해요.'
  },
  {
    id: 'folic', name: '엽산',
    aka: ['폴산', '활성엽산', '메틸폴레이트', '임산부 엽산', '엽산제', '비타민B9'],
    cat: '비타민', slots: ['breakfast', 'lunch'], withFood: false, fatMeal: false, split: false,
    dose: '하루 400μg (제품 표기량)',
    why: '임신을 준비하거나 임신 초기라면 아기의 신경관 발달을 위해 권장되는 비타민이고, 그 밖에는 채소를 충분히 먹으면 따로 챙길 필요가 적어요.',
    timing: '음식과 상관없이 잘 흡수돼서 잊지 않을 아침에 먹어요. 임신을 준비한다면 임신 1~3개월 전부터 임신 12주까지 거르지 않아요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '종합비타민·임산부 영양제와 합쳐 하루 1,000μg을 넘기지 않아요(비타민B12 부족을 가릴 수 있어요). 메토트렉세이트·항경련제를 먹고 있거나 신경관 결손 아기를 임신한 적이 있다면 의사와 용량을 상의해요.'
  },

  /* ===== 미네랄 ===== */
  {
    id: 'magnesium', name: '마그네슘',
    aka: ['마그', 'Mg', '마그네슘 글리시네이트', '산화마그네슘', '구연산마그네슘', '마그네슘B6'],
    cat: '미네랄', slots: ['bed', 'dinner'], withFood: false, fatMeal: false, split: false,
    dose: '원소 마그네슘 200~350mg (글리시네이트·구연산염)',
    why: '땀을 많이 흘리거나 식사량을 줄이면 부족해지기 쉬운 미네랄로, 수면이나 근육 경련에 대한 효과는 크지 않아 부족분을 채운다는 정도로 생각해요.',
    timing: '잠들기 30분 전에 먹으면 아침에 먹는 철분 같은 다른 미네랄과 시간이 자연스럽게 떨어져요. 속이 불편하면 저녁 식사 직후로 옮겨요.',
    avoid: ['iron', 'fiber'], gapHours: 2,
    caution: '설사가 나면 양을 줄이거나 글리시네이트로 바꾸고, 신장 기능이 떨어져 있다면 먼저 의사와 상의해요. 테트라사이클린·퀴놀론계 항생제, 골다공증약, 갑상선약과는 간격이 필요하니 약사에게 확인해요.'
  },
  {
    id: 'calcium', name: '칼슘',
    aka: ['칼슘제', '탄산칼슘', '구연산칼슘', '해조칼슘', '칼슘D', '칼슘 비타민D'],
    cat: '미네랄', slots: ['lunch', 'dinner'], withFood: true, fatMeal: false, split: true,
    dose: '칼슘으로서 하루 300~600mg (제품 표기량)',
    why: '우유·두부·멸치를 잘 먹지 않는 사람이 뼈 건강에 필요한 칼슘의 부족분을 채우는 제품으로, 음식으로 충분히 먹고 있다면 따로 먹을 필요는 적어요.',
    timing: '한 번에 500mg 이하일 때 흡수가 잘 돼서 점심·저녁 식사 직후로 나눠 먹어요. 특히 탄산칼슘은 위산이 나오는 식사 직후에 잘 흡수돼요.',
    avoid: ['iron', 'fiber'], gapHours: 2,
    caution: '신장결석·신장 질환이 있다면 의사와 상의하고, 음식까지 합쳐 하루 2,000mg 안팎을 넘기지 않아요. 갑상선약과는 4시간, 일부 항생제·골다공증약과도 간격이 필요하니 약사에게 확인해요.'
  },
  {
    id: 'calcium_mag', name: '칼슘·마그네슘 복합',
    aka: ['칼마디', '칼마디아연', '칼슘마그네슘', '칼슘 마그네슘', '칼마', '칼슘 마그네슘 비타민D'],
    cat: '미네랄', slots: ['dinner', 'lunch'], withFood: true, fatMeal: false, split: true,
    dose: '제품 표기량 (보통 하루 2~4정)',
    why: '칼슘·마그네슘에 제품에 따라 비타민D·아연까지 한 번에 채우는 제품으로, 유제품과 채소를 적게 먹는 사람의 부족분 보충에 맞아요.',
    timing: '칼슘은 한 번에 500mg 이하일 때 흡수가 잘 돼서 점심·저녁 식사 직후로 나눠 먹고, 하루 한 번이라면 저녁 식사 직후에 먹어요. 아침에 먹는 철분과 시간이 겹치지 않는 것도 장점이에요.',
    avoid: ['iron', 'fiber'], gapHours: 2,
    caution: '단일 칼슘·마그네슘·비타민D나 종합비타민과 함께 먹으면 성분이 겹치니 더해서 확인해요. 신장 질환이 있거나 갑상선약·일부 항생제·골다공증약을 먹고 있다면 복용 간격을 약사와 상의해요.'
  },
  {
    id: 'iron', name: '철분',
    aka: ['철분제', '철', '헴철', '액상철분', '철분 영양제', 'Fe'],
    cat: '미네랄', slots: ['beforeBreakfast', 'wake'], withFood: false, fatMeal: false, split: false,
    dose: '제품 표기량 (처방받았다면 처방대로)',
    why: '월경량이 많거나 고기를 거의 먹지 않아 철이 부족한 사람에게 필요한 미네랄이지만, 부족하지 않은 사람이 먹으면 이득 없이 변비·속쓰림만 생길 수 있어요.',
    timing: '아침 식사 30분 전 빈속에 비타민C나 오렌지주스와 함께 먹으면 흡수가 가장 잘 되고, 커피·차·우유는 앞뒤 2시간 피해요. 속이 쓰리면 식사 직후로 옮겨도 되고, 하루 여러 번 나누기보다 한 번에 먹는 편이 흡수에 유리해요.',
    avoid: ['calcium', 'calcium_mag', 'magnesium', 'zinc', 'multi', 'whey', 'green_tea', 'fiber'], gapHours: 2,
    caution: '부족한지 혈액검사로 먼저 확인하고, 철분이 든 종합비타민과 겹치지 않게 해요. 갑상선약·일부 항생제·위산억제제를 먹고 있거나 임신 중이면 약사와 복용 간격을 상의하고, 아이 손이 닿지 않는 곳에 보관해요.'
  },
  {
    id: 'zinc', name: '아연',
    aka: ['아연제', 'Zn', '징크', '글루콘산아연', '아연 영양제'],
    cat: '미네랄', slots: ['lunch', 'dinner'], withFood: true, fatMeal: false, split: false,
    dose: '아연으로서 하루 8~12mg (제품 표기량)',
    why: '세포 분열과 면역 기능 유지에 필요한 미네랄이지만, 고기·해산물을 골고루 먹는 사람은 대개 음식으로 충분해요.',
    timing: '빈속에 먹으면 메스꺼움이 흔해서 식사 직후에 먹어요. 철분과는 서로 흡수를 방해해 2시간 이상 떼어 먹어요.',
    avoid: ['iron', 'fiber'], gapHours: 2,
    caution: '상한(하루 35mg)을 넘겨 오래 먹으면 구리가 부족해질 수 있어 종합비타민·칼마디에 든 양까지 더해요. 퀴놀론·테트라사이클린계 항생제를 먹을 때는 간격이 필요하니 약사에게 확인해요.'
  },

  /* ===== 지방산 ===== */
  {
    id: 'omega3', name: '오메가3',
    aka: ['오메가-3', '오메가 3', '피쉬오일', '피시오일', '어유', 'rTG 오메가3', '알티지 오메가3', 'EPA', 'DHA'],
    cat: '지방산', slots: ['dinner', 'lunch'], withFood: true, fatMeal: true, split: false,
    dose: 'EPA+DHA 합계 하루 약 1g',
    why: '생선을 자주 먹기 어려울 때 EPA·DHA를 채우는 제품으로, 혈중 중성지방을 낮추는 효과는 근거가 있지만 체지방을 줄여 주지는 않아요.',
    timing: '지용성이라 하루 중 기름기가 가장 많은 식사 직후에 먹으면 흡수가 잘 되고 비린 트림도 덜해요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '와파린·아스피린·클로피도그렐 같은 항응고·항혈소판제를 먹거나, 수술·시술을 앞뒀거나, 심방세동 같은 부정맥이 있었다면 의사·약사와 상의해요. 생선 알레르기가 있거나 임신 중이면 먼저 전문가와 상의해요.'
  },
  {
    id: 'omega3_vitd', name: '오메가3·비타민D 복합',
    aka: ['오메가3 비타민D', '오메가3+비타민D', '오메가3 D', '오메가3 비타민디', '알티지 오메가3 비타민D'],
    cat: '지방산', slots: ['dinner', 'lunch'], withFood: true, fatMeal: true, split: false,
    dose: '제품 표기량 (보통 EPA+DHA 0.5~1g, 비타민D 1,000 IU 안팎)',
    why: '오메가3와 비타민D를 한 캡슐로 챙기는 제품이라, 둘 다 필요하다면 먹는 개수를 줄일 수 있어요.',
    timing: '둘 다 지용성이라 하루 중 기름기가 가장 많은 식사 직후에 먹으면 흡수가 잘 돼요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '단일 비타민D·종합비타민·칼마디와 함께 먹으면 비타민D가 겹치니 더해서 하루 4,000 IU를 넘기지 않아요. 항응고·항혈소판제를 먹거나 수술을 앞두고 있다면, 또는 생선 알레르기가 있다면 의사·약사와 상의해요.'
  },
  {
    id: 'gla', name: '감마리놀렌산',
    aka: ['GLA', '달맞이꽃종자유', '달맞이꽃 오일', '보라지오일', '보라지유', '이브닝 프림로즈'],
    cat: '지방산', slots: ['dinner', 'lunch'], withFood: true, fatMeal: true, split: false,
    dose: '제품 표기량 (감마리놀렌산으로서 보통 하루 200~300mg)',
    why: '월경 전 불편함이나 피부 보습을 위해 많이 찾는 지방산이지만, 연구 결과가 엇갈려 효과는 개인차가 커요.',
    timing: '지용성이라 하루 중 기름기가 가장 많은 식사 직후에 먹어요. 효과는 2~3개월 꾸준히 먹어 보고 판단해요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '와파린·항혈소판제를 먹고 있거나 수술을 앞두고 있다면 의사·약사와 상의해요. 뇌전증(경련) 병력이 있거나 임신 중이면 먹지 않는 게 좋아요.'
  },

  /* ===== 장 건강 ===== */
  {
    id: 'probiotics', name: '유산균',
    aka: ['프로바이오틱스', '프로바이오틱', '장 유산균', '여성 유산균', '질 유산균', '신바이오틱스', '락토바실러스', '비피더스'],
    cat: '장 건강', slots: ['beforeBreakfast', 'wake'], withFood: false, fatMeal: false, split: false,
    dose: '제품 표기량 (보통 하루 1억~100억 CFU)',
    why: '장내 유익균을 보태 배변 활동을 돕는 제품인데, 균주마다 효과가 달라 2~4주 먹어 보고 몸에 맞는지 판단해요.',
    timing: '아침 식사 30분 전이나 식사와 함께 먹을 때 균이 더 많이 살아남았다는 실험 결과가 있어요. 제품에 따로 적힌 시간이 있으면 그걸 따르고, 뜨거운 물과 함께 먹지 않아요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '항생제를 먹는 동안에는 2~3시간 떼어 먹어요. 면역억제제를 쓰거나 항암 치료 중인 등 면역이 크게 떨어진 상태라면 먼저 의사와 상의해요.'
  },
  {
    id: 'fiber', name: '차전자피',
    aka: ['차전자피 식이섬유', '식이섬유', '실리엄', '사일리움', '차전자 껍질', '화이바'],
    cat: '장 건강', slots: ['lunch', 'beforeBreakfast'], withFood: true, fatMeal: false, split: false,
    dose: '차전자피 5g + 물 300ml 이상',
    why: '물을 머금고 부풀어 배변을 돕고 포만감을 높이며, LDL 콜레스테롤과 식후 혈당을 낮추는 효과도 근거가 있어요.',
    timing: '약과 다른 영양제의 흡수를 방해할 수 있어 2시간 이상 떼어야 하니, 다른 영양제가 몰리지 않는 점심이 편해요. 물 300ml 이상에 타서 굳기 전에 바로 마시고, 포만감을 원하면 식사 15~30분 전에 먹어요.',
    avoid: [
      'multi', 'vitd', 'vitc', 'vitb', 'vite', 'vitk2', 'folic',
      'magnesium', 'calcium', 'calcium_mag', 'iron', 'zinc',
      'omega3', 'omega3_vitd', 'gla',
      'probiotics',
      'whey', 'creatine', 'bcaa', 'arginine', 'preworkout',
      'glucosamine', 'msm', 'boswellia',
      'lutein',
      'milk_thistle', 'red_ginseng',
      'collagen', 'biotin',
      'coq10', 'propolis', 'green_tea', 'cla', 'garcinia'
    ],
    gapHours: 2,
    caution: '물을 충분히 마시지 않으면 오히려 변비가 생기거나 목·식도에 걸릴 수 있어요. 처음엔 2~3g으로 시작하고, 삼킴 장애나 장폐색 병력이 있거나 당뇨약을 먹고 있다면 의사·약사와 상의해요.'
  },

  /* ===== 운동 ===== */
  {
    id: 'whey', name: '단백질 쉐이크',
    aka: ['프로틴', '프로틴 쉐이크', '웨이 프로틴', '웨이프로틴', '단백질 파우더', '프로틴 파우더', '단백질 보충제', 'WPI', 'WPC', '분리유청단백', '단백질 음료'],
    cat: '운동', slots: ['breakfast', 'lunch'], gymSlot: 'postWorkout', withFood: false, fatMeal: false, split: false,
    dose: '1스쿱 (단백질 20~25g)',
    why: '식사만으로 하루 단백질을 채우기 어려울 때 가장 간편한 방법이고, 근력 운동과 함께하면 감량 중 근육 손실을 줄이는 데 도움이 돼요.',
    timing: '운동한 날은 운동을 마치고 바로 마시면 챙기기 쉽고, 쉬는 날은 단백질이 부족한 끼니에 곁들여요. 먹는 시간보다 하루 총 단백질량이 더 중요해요.',
    avoid: ['iron', 'fiber'], gapHours: 2,
    caution: '우유를 마시면 배가 불편하다면 유당을 대부분 걸러 낸 분리유청(WPI) 제품을 고르고, 우유 알레르기가 있으면 피해요. 신장 질환으로 단백질 제한을 받고 있거나 임신·수유 중이면 먼저 의사·약사와 상의해요.'
  },
  {
    id: 'creatine', name: '크레아틴',
    aka: ['크레아틴 모노하이드레이트', '크레아틴 일수화물', '모노하이드레이트', '크레아틴 파우더', '크레아틴 HCl'],
    cat: '운동', slots: ['breakfast', 'lunch'], gymSlot: 'postWorkout', withFood: true, fatMeal: false, split: false,
    dose: '크레아틴 일수화물 하루 3~5g',
    why: '근력과 근육량 증가에 대한 근거가 가장 탄탄한 운동 보충제로, 감량 중에도 운동 강도와 근육을 지키는 데 도움이 돼요.',
    timing: '몇 시에 먹느냐보다 쉬는 날에도 매일 먹는 게 중요해요. 운동한 날은 운동 직후 단백질 쉐이크에 섞고, 쉬는 날은 식사와 함께 먹어요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '처음 2~4주에 근육 속 수분이 늘어 체중이 1~2kg 오를 수 있고, 혈액검사의 크레아티닌이 높게 나올 수 있으니 검사 때 알려요. 신장 질환이 있거나 이뇨제·소염진통제를 오래 먹고 있거나 임신·수유 중이면 먼저 의사·약사와 상의해요.'
  },
  {
    id: 'bcaa', name: 'BCAA',
    aka: ['비씨에이에이', '분지사슬아미노산', '아미노산', 'EAA', '필수아미노산', '류신'],
    cat: '운동', slots: ['preWorkout'], gymSlot: 'preWorkout', withFood: false, fatMeal: false, split: false,
    dose: '제품 표기량 (보통 1회 5~10g)',
    why: '근육 합성의 신호가 되는 류신 등 아미노산 3가지를 담은 제품이지만, 하루 단백질을 충분히 먹는다면 더 얻는 이득은 거의 없어요.',
    timing: '운동하는 날 운동 30분 전이나 운동하는 동안 물에 타서 나눠 마셔요. 쉬는 날이나 단백질 쉐이크를 마시는 날엔 건너뛰어도 괜찮아요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '단백질 쉐이크와 함께라면 양이 겹치니 하루 총 단백질을 기준으로 판단해요. 신장·간 질환이 있거나 임신·수유 중이면 먼저 의사와 상의해요.'
  },
  {
    id: 'arginine', name: '아르기닌',
    aka: ['L-아르기닌', '엘아르기닌', '아르기닌 스틱', '고함량 아르기닌', '아르기닌 6000'],
    cat: '운동', slots: ['beforeBreakfast', 'wake'], gymSlot: 'preWorkout', withFood: false, fatMeal: false, split: false,
    dose: '제품 표기량 (보통 하루 3~6g)',
    why: '혈관을 넓히는 산화질소의 재료라 운동 수행·혈행용으로 팔리지만, 먹는 아르기닌은 흡수 과정에서 대부분 분해돼 운동 효과의 근거는 약해요.',
    timing: '다른 아미노산과 흡수 경쟁을 덜 하도록 식사 30분 전 빈속에 먹고, 운동하는 날은 운동 30분 전에 먹어요. 배가 더부룩하거나 설사가 나면 식사 직후로 옮기거나 양을 줄여요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '혈압을 낮출 수 있어 혈압약·협심증약(니트로글리세린 등)·발기부전 치료제를 먹고 있다면 의사·약사와 상의해요. 심근경색을 겪은 적이 있거나 임신·수유 중이면 먹지 않는 게 좋아요.'
  },
  {
    id: 'preworkout', name: '부스터(프리워크아웃)',
    aka: ['프리워크아웃', '부스터', '운동 부스터', '프리 워크아웃', '카페인 부스터', '카페인 정'],
    cat: '운동', slots: ['preWorkout'], gymSlot: 'preWorkout', withFood: false, fatMeal: false, split: false,
    dose: '제품 표기량 (처음엔 반 스쿱, 카페인 1회 200mg 이하)',
    why: '주성분인 카페인이 운동 중 집중력과 지구력을 조금 높여 준다는 근거는 있지만, 초보자에게 꼭 필요한 제품은 아니에요.',
    timing: '운동 30분 전에 먹고, 카페인이 오래 남아 잠을 방해하니 잠들기까지 6시간이 안 남았다면 건너뛰어요. 쉬는 날에는 먹지 않아요.',
    avoid: ['green_tea', 'fiber'], gapHours: 2,
    caution: '커피·에너지 음료까지 합쳐 카페인은 하루 400mg을 넘기지 않고, 두근거림·불안·불면이 생기면 양을 줄이거나 끊어요. 고혈압·부정맥이 있거나 임신·수유 중이면 먹지 않고, 해외 직구 제품은 국내 금지 성분이 들어 있을 수 있어 피해요.'
  },

  /* ===== 관절·뼈 ===== */
  {
    id: 'glucosamine', name: '글루코사민',
    aka: ['글루코사민 황산염', '글루코사민 염산염', 'N-아세틸글루코사민', 'NAG', '관절 영양제'],
    cat: '관절·뼈', slots: ['breakfast', 'dinner'], withFood: true, fatMeal: false, split: false,
    dose: '하루 1,500mg (제품 표기량)',
    why: '연골을 이루는 성분이라 관절 건강용으로 오래 쓰여 왔지만, 큰 연구들에서 효과는 작거나 뚜렷하지 않았어요.',
    timing: '식사 직후에 먹으면 속이 편해요. 2~3개월은 꾸준히 먹어 보고, 그래도 달라진 게 없으면 그만둬도 돼요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '게·새우 껍질로 만든 제품이 많아 갑각류 알레르기가 있다면 원료를 확인해요. 와파린을 먹고 있거나 당뇨가 있거나 임신·수유 중이면 의사·약사와 상의해요.'
  },
  {
    id: 'msm', name: 'MSM(식이유황)',
    aka: ['MSM', '엠에스엠', '식이유황', '디메틸설폰', '유황'],
    cat: '관절·뼈', slots: ['breakfast', 'dinner'], withFood: true, fatMeal: false, split: false,
    dose: '하루 1,500~2,000mg (제품 표기량)',
    why: '관절·연골 건강에 도움을 줄 수 있다고 인정된 원료지만, 연구 규모가 작고 효과도 크지 않은 편이에요.',
    timing: '식사 직후에 먹으면 속이 편해요. 2~3개월 먹어 보고 달라진 게 없으면 그만둬도 돼요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '속쓰림·설사·두통이 생기면 양을 줄이거나 중단하고, 임신·수유 중이면 먹지 않아요. 관절이 붓고 열이 나거나 통증이 심해진다면 영양제보다 진료가 먼저예요.'
  },
  {
    id: 'boswellia', name: '보스웰리아',
    aka: ['보스웰리아 추출물', '보스웰리아 세라타', '인도 유향', '유향', 'AKBA'],
    cat: '관절·뼈', slots: ['dinner', 'lunch'], withFood: true, fatMeal: true, split: false,
    dose: '제품 표기량',
    why: '관절 건강에 도움을 줄 수 있다고 인정된 원료지만, 연구 수가 적고 규모가 작아 효과를 단정하기는 어려워요.',
    timing: '기름기 있는 식사와 함께 먹었을 때 흡수가 몇 배 늘었다는 연구가 있어 하루 중 기름기가 가장 많은 식사 직후에 먹어요. 2~3개월 먹어 보고 판단해요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '속쓰림·설사·피부 발진이 생기면 중단해요. 임신·수유 중이거나 여러 약을 함께 먹고 있다면 약사에게 먼저 확인해요.'
  },

  /* ===== 눈 ===== */
  {
    id: 'lutein', name: '루테인',
    aka: ['루테인 지아잔틴', '루테인지아잔틴', '지아잔틴', '마리골드', '마리골드꽃추출물', '눈 영양제'],
    cat: '눈', slots: ['dinner', 'lunch'], withFood: true, fatMeal: true, split: false,
    dose: '루테인으로서 하루 10~20mg (제품 표기량)',
    why: '나이가 들며 줄어드는 황반색소 밀도를 유지하는 데 도움을 줄 수 있는 성분이지만, 당장 눈의 피로를 풀어 주는 제품은 아니에요.',
    timing: '지용성이라 기름기 없이 먹으면 흡수가 크게 떨어져요. 하루 중 기름기가 가장 많은 식사 직후에 먹어요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '담배를 피운다면 고함량 베타카로틴이 같이 든 눈 영양제는 피해요(흡연자에게서 폐암 위험이 높아졌다는 연구가 있어요). 눈 질환으로 치료 중이거나 임신·수유 중이면 의사와 상의해요.'
  },

  /* ===== 간·피로 ===== */
  {
    id: 'milk_thistle', name: '밀크씨슬',
    aka: ['밀크시슬', '밀크 씨슬', '실리마린', '간 영양제'],
    cat: '간·피로', slots: ['breakfast', 'dinner'], withFood: true, fatMeal: false, split: false,
    dose: '실리마린으로서 하루 130mg (제품 표기량)',
    why: '간 건강을 위해 많이 찾는 성분이지만 사람 대상 연구에서 효과는 뚜렷하지 않고, 술을 마셔도 괜찮게 해 주는 제품은 아니에요.',
    timing: '식사 직후에 먹으면 속이 편해요. 몇 시에 먹느냐보다 매일 같은 때 꾸준히 먹는 게 중요해요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '간 수치가 높게 나왔다면 영양제보다 원인(술·체중·약)부터 의사와 확인해요. 국화과 식물 알레르기가 있거나, 당뇨약을 먹고 있거나(혈당이 더 내려갈 수 있어요), 임신·수유 중이면 약사와 상의해요.'
  },
  {
    id: 'red_ginseng', name: '홍삼',
    aka: ['홍삼정', '홍삼 스틱', '홍삼액', '홍삼진액', '인삼', '진세노사이드'],
    cat: '간·피로', slots: ['breakfast', 'lunch'], withFood: false, fatMeal: false, split: false,
    dose: '제품 표기량',
    why: '피로 개선과 면역 기능에 도움을 줄 수 있다고 인정된 원료지만, 효과의 크기는 연구마다 차이가 있고 개인차도 커요.',
    timing: '몸을 깨우는 작용이 있어 늦게 먹으면 잠이 안 오는 사람이 있으니 아침에 먹어요. 빈속에 먹어도 되지만 속이 불편하다면 식사 직후가 편해요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '와파린·항혈소판제, 당뇨약, 혈압약, 면역억제제를 먹고 있다면 의사·약사와 상의하고, 수술 1~2주 전에는 끊어요. 임신·수유 중이거나 먹고 나서 두근거림·불면이 생기면 먹지 않아요.'
  },

  /* ===== 피부·모발 ===== */
  {
    id: 'collagen', name: '콜라겐',
    aka: ['저분자 콜라겐', '피쉬 콜라겐', '어류 콜라겐', '콜라겐 펩타이드', '콜라겐 젤리', '콜라겐 스틱'],
    cat: '피부·모발', slots: ['breakfast', 'lunch'], withFood: false, fatMeal: false, split: false,
    dose: '제품 표기량 (보통 하루 1,000~3,000mg)',
    why: '피부 보습에 도움을 줄 수 있다는 연구가 있지만 효과가 크지 않고, 근육을 위한 단백질 보충용으로는 웨이 프로틴보다 불리해요.',
    timing: '흡수에 유리한 시간대는 밝혀지지 않아 잊지 않을 때 매일 먹으면 돼요. 젤리·음료형은 당이 들어 있어 자기 직전보다 아침이 무난해요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '생선·돼지 등 원료에 알레르기가 있다면 원료를 확인하고, 젤리·음료형은 당류와 열량을 확인해요. 신장 질환으로 단백질 제한을 받고 있다면 먼저 의사와 상의해요.'
  },
  {
    id: 'biotin', name: '비오틴',
    aka: ['바이오틴', '비타민B7', '비타민H', '고함량 비오틴'],
    cat: '피부·모발', slots: ['breakfast', 'lunch'], withFood: false, fatMeal: false, split: false,
    dose: '제품 표기량 (하루 필요량은 30μg 정도)',
    why: '머리카락·손톱 영양제로 많이 팔리지만, 결핍이 아닌 사람에게 탈모나 손톱 개선 효과가 있다는 근거는 거의 없어요.',
    timing: '수용성이라 언제 먹어도 되니 다른 아침 영양제와 함께 아침 식사 직후에 먹으면 잊지 않아요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '고함량 비오틴은 갑상선 호르몬·심장 표지자 같은 혈액검사 결과를 틀어지게 할 수 있어 검사 2~3일 전에는 끊고, 검사 때 꼭 알려요. 임신·수유 중이면 고함량은 피해요.'
  },

  /* ===== 기타 ===== */
  {
    id: 'coq10', name: '코엔자임Q10',
    aka: ['코큐텐', '코엔자임 Q10', 'CoQ10', '코큐10', '유비퀴놀', '유비퀴논'],
    cat: '기타', slots: ['lunch', 'breakfast'], withFood: true, fatMeal: true, split: false,
    dose: '하루 90~100mg (제품 표기량)',
    why: '몸이 에너지를 만들고 산화를 막는 데 쓰는 성분으로 나이가 들거나 콜레스테롤약(스타틴)을 먹으면 줄어들지만, 보충해서 피로가 풀린다는 근거는 약해요.',
    timing: '지용성이라 하루 중 기름기가 가장 많은 식사 직후에 먹으면 흡수가 잘 돼요. 늦은 저녁에 먹고 잠이 얕아진다면 아침·점심으로 옮겨요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '와파린의 효과를 약하게 할 수 있어 복용 중이라면 의사·약사와 상의하고, 혈압약·당뇨약을 먹는다면 혈압·혈당이 더 내려갈 수 있어 함께 확인해요. 임신·수유 중이면 먹지 않아요.'
  },
  {
    id: 'propolis', name: '프로폴리스',
    aka: ['프로폴리스 추출물', '프로폴리스 스프레이', '프로폴리스 캡슐', '그린 프로폴리스'],
    cat: '기타', slots: ['breakfast', 'lunch'], withFood: true, fatMeal: false, split: false,
    dose: '제품 표기량 (플라보노이드로서 하루 16~17mg)',
    why: '꿀벌이 모은 수지 성분으로 항산화와 입안 항균에 도움을 줄 수 있다고 인정됐지만, 면역력을 크게 높여 준다는 근거는 부족해요.',
    timing: '캡슐은 식사 직후에 먹고, 스프레이는 양치한 뒤 입안에 뿌려요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '벌·꿀·꽃가루 알레르기나 천식이 있다면 심한 알레르기 반응이 생길 수 있어 먹지 않아요. 와파린 같은 항응고제를 먹고 있거나 임신·수유 중이면 의사·약사와 상의해요.'
  },
  {
    id: 'green_tea', name: '녹차 추출물(카테킨)',
    aka: ['녹차 추출물', '녹차추출물', '카테킨', '녹차 카테킨', 'EGCG', '그린티 추출물'],
    cat: '기타', slots: ['breakfast', 'lunch'], withFood: true, fatMeal: false, split: true,
    dose: '제품 표기량 (카테킨으로서 하루 300~1,000mg)',
    why: '체지방 감소에 도움을 줄 수 있다고 인정된 원료지만 실제 감량 효과는 미미하고, 농축 추출물이라 마시는 녹차와 달리 간 손상 사례가 보고됐어요.',
    timing: '빈속에 먹으면 간에 부담이 커질 수 있어 꼭 식사 직후에 먹어요. 카페인이 든 제품이 많아 오후 늦게는 먹지 않아요.',
    avoid: ['iron', 'preworkout', 'fiber'], gapHours: 2,
    caution: '간 질환이 있거나 간 수치가 높다면 먹지 않고, 먹는 동안 피로·구역·진한 소변·황달이 생기면 바로 중단하고 진료를 받아요. 카페인에 민감하거나 임신·수유 중이거나 약을 먹고 있다면 먼저 의사·약사와 상의해요.'
  },
  {
    id: 'cla', name: 'CLA(공액리놀레산)',
    aka: ['CLA', '공액리놀레산', '씨엘에이'],
    cat: '기타', slots: ['lunch', 'dinner'], withFood: true, fatMeal: false, split: true,
    dose: '제품 표기량 (공액리놀레산으로서 하루 1.4~4.2g)',
    why: '체지방 감소용으로 팔리지만 연구를 모아 보면 효과가 수개월에 1kg 미만으로 작아, 감량 목적으로는 권하지 않는 제품이에요.',
    timing: '이미 가지고 있다면 위장 불편을 줄이도록 점심·저녁 식사 직후로 나눠 먹어요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '속쓰림·설사 같은 위장 불편이 흔하고 일부 연구에서 인슐린 저항성이 나빠졌으니, 당뇨가 있거나 혈당이 높다면 먹지 않아요. 와파린·항혈소판제를 먹고 있거나 임신·수유 중이면 의사·약사와 상의해요.'
  },
  {
    id: 'garcinia', name: '가르시니아',
    aka: ['가르시니아 캄보지아', '가르시니아캄보지아', 'HCA', '가르시니아 추출물'],
    cat: '기타', slots: ['beforeBreakfast'], withFood: false, fatMeal: false, split: false,
    dose: '제품 표기량 (HCA로서 하루 750~2,800mg)',
    why: '탄수화물이 지방으로 바뀌는 것을 억제한다며 팔리지만 사람 대상 연구에서 감량 효과는 작고 일관되지 않아, 초보자에게 권하지 않는 제품이에요.',
    timing: '이미 가지고 있다면 제품 표기대로 식사 30분 전에 먹어요. 그래도 감량은 식단과 운동이 만들어요.',
    avoid: ['fiber'], gapHours: 2,
    caution: '드물게 간 손상 사례가 보고돼 간 질환이 있거나 술을 자주 마신다면 먹지 않고, 피로·구역·진한 소변·황달이 생기면 바로 중단해요. 당뇨약·항우울제를 먹고 있거나 임신·수유 중이면 먹지 않아요.'
  }
];

/* ---------------------------------------------------------------------------
 * F.SUPP_RULES — general rules
 * ------------------------------------------------------------------------- */
F.SUPP_RULES = [
  {
    title: '처음엔 2~3개만',
    body: '한꺼번에 여러 개를 시작하면 속이 불편하거나 몸에 변화가 생겼을 때 원인을 찾기 어려워요. 꼭 필요한 2~3개로 시작해 2~4주 지켜본 뒤 하나씩 더해요.'
  },
  {
    title: '영양제는 식단을 대신하지 않아요',
    body: '영양제는 식사로 못 채운 빈틈을 메우는 보조예요. 단백질·채소·통곡물을 먼저 챙기고, 감량은 식단과 운동이 만들어요.'
  },
  {
    title: '같은 성분이 겹치는지 확인해요',
    body: '종합비타민, 칼마디, 오메가3·비타민D 복합 제품에는 비타민D·아연·칼슘이 이미 들어 있는 경우가 많아요. 단일 제품을 더하기 전에 성분표의 함량을 더해 보고, 특히 비타민A·D, 철분, 아연은 상한을 넘지 않게 해요.'
  },
  {
    title: '약을 먹고 있다면 약사와 상담',
    body: '와파린 같은 항응고제, 갑상선약, 혈압약, 당뇨약, 항생제를 먹고 있다면 영양제를 시작하기 전에 약사에게 목록을 보여 줘요. 진료·수술·혈액검사 때도 먹고 있는 영양제를 함께 알려요.'
  },
  {
    title: '흡수를 방해하는 조합은 시간을 나눠요',
    body: '철분은 칼슘·마그네슘·아연과 서로 흡수를 방해해서 2시간 이상 떼어 먹어요. 차전자피 같은 식이섬유는 약과 다른 영양제 모두와 2시간 이상 떼고, 물을 넉넉히 마셔요.'
  },
  {
    title: '지용성은 기름기 있는 식사와 함께',
    body: '비타민D·E·K, 오메가3, 루테인, 코엔자임Q10은 지방과 함께 흡수돼요. 빈속이나 채소만 먹은 끼니보다 하루 중 기름기가 가장 많은 식사 직후에 먹어요.'
  },
  {
    title: '시간보다 꾸준함이 먼저',
    body: '대부분의 영양제는 몇 시에 먹느냐보다 매일 거르지 않는 게 더 중요해요. 한 번 잊었다면 다음에 두 배로 먹지 말고 원래 양대로 이어 가요.'
  },
  {
    title: '임신·수유 중이라면 먼저 상담',
    body: '임신을 준비하거나 임신·수유 중이라면 엽산 외의 영양제는 산부인과 의사·약사와 상의해서 골라요. 고함량 비타민A와 허브·다이어트 보조제는 피해요.'
  },
  {
    title: '이상하면 바로 멈춰요',
    body: '두드러기, 숨이 차는 느낌, 심한 복통, 진한 갈색 소변, 눈 흰자가 노래지는 증상이 생기면 바로 중단하고 진료를 받아요. 무엇을 언제부터 먹었는지 기록해 두면 원인을 찾기 쉬워요.'
  },
  {
    title: '인증 마크와 함량을 확인해요',
    body: '식약처 건강기능식품 마크와 하루 섭취량을 확인하고 골라요. 해외 직구 제품은 국내 기준보다 함량이 높거나 국내 금지 성분이 들어 있을 수 있어 신중하게 골라요.'
  }
];
